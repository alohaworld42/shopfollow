import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
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

        console.log(`Scraping URL: ${url}`)

        // Check for known blocked/difficult domains
        const urlObj = new URL(url)
        const blockedDomains = ['etsy.com', 'amazon.com', 'amazon.de', 'amazon.co.uk', 'walmart.com', 'ebay.com']
        const isBlocked = blockedDomains.some(d => urlObj.hostname.includes(d))

        if (isBlocked) {
            return new Response(
                JSON.stringify({
                    error: `${urlObj.hostname} blocks automated requests. Please enter product details manually.`,
                    blocked: true,
                    success: false,
                    storeName: urlObj.hostname.replace('www.', ''),
                    url: url
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Fetch the HTML with rotating User-Agent
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ]
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Extract Metadata
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || ''
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
        const image = $('meta[property="og:image"]').attr('content') || $('meta[property="twitter:image"]').attr('content') || ''
        const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname

        // Try to find price
        let price: number | null = null
        let currency = 'UR'

        // 1. Structured Data (JSON-LD)
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html() || '{}')
                if (data['@type'] === 'Product' || data['@type'] === 'ItemPage') {
                    const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers
                    if (offer) {
                        price = offer.price ? parseFloat(offer.price) : null
                        currency = offer.priceCurrency || currency
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        })

        // 2. OpenGraph Price
        if (!price) {
            const ogPrice = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content')
            const ogCurrency = $('meta[property="product:price:currency"]').attr('content') || $('meta[property="og:price:currency"]').attr('content')
            if (ogPrice) {
                price = parseFloat(ogPrice.replace(/[^0-9.]/g, ''))
                if (ogCurrency) currency = ogCurrency
            }
        }

        // 3. Fallback: Microdata / Common Classes
        if (!price) {
            const itempropPrice = $('[itemprop="price"]').first().attr('content') || $('[itemprop="price"]').first().text()
            if (itempropPrice) {
                const cleaned = itempropPrice.replace(/[^0-9.,]/g, '').replace(',', '.')
                price = parseFloat(cleaned)
            }
        }

        // 4. Fallback: Common Metadata
        if (!price) {
            const twitterPrice = $('meta[name="twitter:data1"]').attr('content') // Often used for price label
            if (twitterPrice && /[\d]+/.test(twitterPrice)) {
                const cleaned = twitterPrice.replace(/[^0-9.,]/g, '').replace(',', '.')
                price = parseFloat(cleaned)
            }
        }

        // Normalize currency symbols
        const currencyMap: Record<string, string> = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        const currencySymbol = currencyMap[currency] || currency;

        const result = {
            title: title.trim(),
            description: description.trim(),
            image,
            price: price || 0,
            currency: currencySymbol,
            storeName: siteName,
            url: url,
            success: true
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Scraping error:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message, success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
