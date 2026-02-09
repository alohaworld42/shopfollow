// WooCommerce Webhook Handler
// Receives order webhooks from WooCommerce and creates staging orders
// Supports email-based user matching

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wc-webhook-signature, x-wc-webhook-source, x-api-key",
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
    billing: { email: string; first_name?: string; last_name?: string };
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
        const webhookApiKey = Deno.env.get("WEBHOOK_API_KEY");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get headers
        const wcSignature = req.headers.get("x-wc-webhook-signature");
        const wcSource = req.headers.get("x-wc-webhook-source");
        const apiKey = req.headers.get("x-api-key");

        // Verify API key if configured
        if (webhookApiKey && apiKey !== webhookApiKey) {
            return new Response(
                JSON.stringify({ error: "Invalid API key" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.text();
        const order: WooCommerceOrder = JSON.parse(body);

        // Extract customer email from billing
        const customerEmail = order.billing?.email?.toLowerCase().trim();
        if (!customerEmail) {
            return new Response(
                JSON.stringify({ error: "No customer email in order" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Extract shop domain from source URL
        let shopDomain = "";
        try {
            if (wcSource) {
                shopDomain = new URL(wcSource).hostname;
            }
        } catch {
            // wcSource might not be a valid URL
        }

        // Try to find existing user by email
        const { data: existingUser } = await supabase
            .from("users")
            .select("uid")
            .eq("email", customerEmail)
            .single();

        // Also check shop_connections for legacy support
        let shopConnection = null;
        if (shopDomain) {
            const { data } = await supabase
                .from("shop_connections")
                .select("*")
                .eq("platform", "woocommerce")
                .eq("shop_domain", shopDomain)
                .eq("is_active", true)
                .single();
            shopConnection = data;

            // Verify signature if shop connection exists
            if (shopConnection && wcSignature) {
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
        }

        // Determine user_id: prefer shop connection, then email match, else null
        const userId = shopConnection?.user_id || existingUser?.uid || null;
        const storeName = shopDomain?.replace("www.", "") || "WooCommerce Store";

        // Create staging orders for each line item
        const stagingOrders = order.line_items.map((item) => ({
            user_id: userId,
            customer_email: customerEmail,
            matched: !!userId,
            source: "woocommerce",
            source_order_id: `${order.id}-${item.product_id}`,
            product_name: item.name,
            product_image_url: item.image?.src || `https://via.placeholder.com/400x500.png?text=${encodeURIComponent(item.name)}`,
            product_price: item.price,
            store_name: storeName,
            store_url: wcSource || "",
            status: "pending",
            raw_data: { order_id: order.id, line_item: item, shop_domain: shopDomain }
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
                matched: !!userId,
                customer_email: customerEmail,
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
