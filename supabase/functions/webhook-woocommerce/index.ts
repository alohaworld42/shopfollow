// WooCommerce Webhook Handler
// Receives order webhooks from WooCommerce and creates staging orders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wc-webhook-signature, x-wc-webhook-source",
};

interface WooCommerceLineItem {
    name: string;
    price: number;
    quantity: number;
    product_id: number;
    image?: { src: string };
}

interface WooCommerceOrder {
    id: number;
    order_key: string;
    billing: { email: string };
    line_items: WooCommerceLineItem[];
    total: string;
    date_created: string;
}

// Verify WooCommerce webhook signature
async function verifyWooCommerceSignature(
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
        const wcSignature = req.headers.get("x-wc-webhook-signature");
        const wcSource = req.headers.get("x-wc-webhook-source");

        if (!wcSource) {
            return new Response(
                JSON.stringify({ error: "Missing webhook source" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Extract domain from source URL
        const shopDomain = new URL(wcSource).hostname;
        const body = await req.text();

        // Find shop connection
        const { data: shopConnection, error: shopError } = await supabase
            .from("shop_connections")
            .select("*")
            .eq("platform", "woocommerce")
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

        // Verify signature if provided
        if (wcSignature) {
            const isValid = await verifyWooCommerceSignature(
                body,
                wcSignature,
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
        const order: WooCommerceOrder = JSON.parse(body);

        // Create staging orders for each line item
        const stagingOrders = order.line_items.map((item) => ({
            user_id: shopConnection.user_id,
            source: "woocommerce",
            source_order_id: `${order.id}-${item.product_id}`,
            product_name: item.name,
            product_image_url: item.image?.src || `https://via.placeholder.com/400x500.png?text=${encodeURIComponent(item.name)}`,
            product_price: item.price,
            store_name: shopDomain.replace("www.", ""),
            store_url: wcSource,
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
