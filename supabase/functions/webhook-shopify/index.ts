// Shopify Webhook Handler
// Receives order webhooks from Shopify and creates staging orders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain",
};

interface ShopifyLineItem {
    title: string;
    price: string;
    quantity: number;
    product_id: number;
    variant_id: number;
    image?: { src: string };
}

interface ShopifyOrder {
    id: number;
    order_number: number;
    email: string;
    line_items: ShopifyLineItem[];
    total_price: string;
    created_at: string;
}

// Verify Shopify webhook signature
async function verifyShopifySignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(payload)
    );

    const computedSignature = btoa(
        String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return signature === computedSignature;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get headers
        const shopifyHmac = req.headers.get("x-shopify-hmac-sha256");
        const shopDomain = req.headers.get("x-shopify-shop-domain");

        if (!shopDomain) {
            return new Response(
                JSON.stringify({ error: "Missing shop domain" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.text();

        // Find shop connection to verify webhook and get user
        const { data: shopConnection, error: shopError } = await supabase
            .from("shop_connections")
            .select("*")
            .eq("platform", "shopify")
            .eq("shop_domain", shopDomain)
            .eq("is_active", true)
            .single();

        if (shopError || !shopConnection) {
            console.log("Shop not found:", shopDomain);
            return new Response(
                JSON.stringify({ error: "Shop not connected" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify signature
        if (shopifyHmac) {
            const isValid = await verifyShopifySignature(
                body,
                shopifyHmac,
                shopConnection.webhook_secret
            );

            if (!isValid) {
                return new Response(
                    JSON.stringify({ error: "Invalid signature" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Parse order
        const order: ShopifyOrder = JSON.parse(body);

        // Create staging orders for each line item
        const stagingOrders = order.line_items.map((item) => ({
            user_id: shopConnection.user_id,
            source: "shopify",
            source_order_id: `${order.id}-${item.product_id}`,
            product_name: item.title,
            product_image_url: item.image?.src || `https://via.placeholder.com/400x500.png?text=${encodeURIComponent(item.title)}`,
            product_price: parseFloat(item.price),
            store_name: shopDomain.replace(".myshopify.com", ""),
            store_url: `https://${shopDomain}`,
            status: "pending",
            raw_data: { order_id: order.id, line_item: item }
        }));

        // Insert staging orders
        const { data, error } = await supabase
            .from("staging_orders")
            .insert(stagingOrders)
            .select();

        if (error) {
            console.error("Error inserting staging orders:", error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Created ${stagingOrders.length} staging orders`,
                orders: data
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
