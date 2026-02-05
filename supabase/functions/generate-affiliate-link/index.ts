import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()
        if (!url) {
            return new Response(
                JSON.stringify({ error: 'URL is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Fetch configs
        const { data: configs, error } = await supabase
            .from('affiliate_configs')
            .select('*')

        if (error) throw error

        let newUrl = url
        let matched = false
        const urlObj = new URL(url)

        for (const config of configs) {
            if (urlObj.hostname.includes(config.domain_pattern)) {
                matched = true
                const affiliateId = config.affiliate_id

                // Basic network handling
                if (config.affiliate_network === 'amazon') {
                    urlObj.searchParams.set('tag', affiliateId)
                }
                else if (config.affiliate_network === 'etsy') {
                    // Etsy usually requires 'aff' or similar via networks like Awin, but for now we mock it
                    urlObj.searchParams.set('aff', affiliateId)
                }
                else {
                    // Generic fallback: check template
                    // Simple param injection if we can parse the template name
                    // But for now, just logging match
                }
            }
        }

        newUrl = urlObj.toString()

        return new Response(
            JSON.stringify({
                success: true,
                originalUrl: url,
                affiliatedUrl: newUrl,
                matched
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Affiliate generation error:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
