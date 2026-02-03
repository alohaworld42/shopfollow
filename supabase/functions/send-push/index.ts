import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "https://esm.sh/web-push@3.6.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, title, body, url, icon } = await req.json()

        // Initialize Supabase Client
        // Need to use service key to read subscriptions if RLS blocks (which is allowed for service role)
        // Actually standard fetch works if we just check subscriptions
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase env vars missing')
        }

        // Configure Web Push
        const vapidSubject = 'mailto:admin@shopfollow.com' // customizable
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error('VAPID keys missing')
        }

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

        // Fetch subscriptions
        const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=*`, {
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
            }
        })

        const subscriptions = await response.json()

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const payload = JSON.stringify({
            title,
            body,
            url,
            icon
        })

        const results = await Promise.all(subscriptions.map((sub: any) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }
            return webpush.sendNotification(pushSubscription, payload)
                .catch((err: any) => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Cleanup invalid subscription
                        fetch(`${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${sub.endpoint}`, {
                            method: 'DELETE',
                            headers: {
                                'apikey': supabaseServiceKey,
                                'Authorization': `Bearer ${supabaseServiceKey}`
                            }
                        })
                    }
                    return { error: err }
                })
        }))

        return new Response(
            JSON.stringify({ success: true, sent: results.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
