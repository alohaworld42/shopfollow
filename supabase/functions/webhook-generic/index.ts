// Generic Webhook Handler
// For manual product additions and custom integrations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface GenericProductPayload {
    api_key: string;
    product: {
        name: string;
        image_url: string;
        price: number;
        store_name: string;
        store_url?: string;
    };
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

        // Get API key from header or body
        const apiKeyHeader = req.headers.get("x-api-key");
        const body = await req.json() as GenericProductPayload;
        const apiKey = apiKeyHeader || body.api_key;

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "Missing API key" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Find user by API key (webhook_secret used as API key for generic webhooks)
        const { data: shopConnection, error: shopError } = await supabase
            .from("shop_connections")
            .select("*")
            .eq("platform", "generic")
            .eq("webhook_secret", apiKey)
            .eq("is_active", true)
            .single();

        if (shopError || !shopConnection) {
            return new Response(
                JSON.stringify({ error: "Invalid API key" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate product data
        const { product } = body;
        if (!product || !product.name || !product.image_url || !product.price || !product.store_name) {
            return new Response(
                JSON.stringify({
                    error: "Invalid product data",
                    required: ["name", "image_url", "price", "store_name"]
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create staging order
        const { data, error } = await supabase
            .from("staging_orders")
            .insert({
                user_id: shopConnection.user_id,
                source: "generic",
                source_order_id: `generic-${Date.now()}`,
                product_name: product.name,
                product_image_url: product.image_url,
                product_price: product.price,
                store_name: product.store_name,
                store_url: product.store_url || null,
                status: "pending",
                raw_data: body
            })
            .select()
            .single();

        if (error) {
            console.error("Error inserting staging order:", error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Product added to inbox",
                order: data
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
