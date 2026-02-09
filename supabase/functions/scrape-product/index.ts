import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gemini-based fallback for extracting product data from HTML
async function scrapeWithGemini(html: string, url: string, apiKey: string) {
    console.log('Falling back to Gemini scraping...');

    const truncatedHtml = html.length > 30000 ? html.substring(0, 30000) : html;

    const prompt = `
    You are a product data extractor. Extract the product details from the following HTML snippet of a product page.
    Return JSON ONLY with the following keys: title, description, price (number), currency (symbol), image (url), storeName.
    If you cannot find a value, use null.
    URL: ${url}
    HTML: ${truncatedHtml}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        console.error('Gemini API Error:', await response.text());
        return null;
    }

    const data = await response.json();
    try {
        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to parse Gemini response', e);
        return null;
    }
}

// Use a proxy service (ScraperAPI, ScrapingBee, etc.) to bypass anti-bot
async function fetchWithProxy(url: string, proxyApiKey: string): Promise<string | null> {
    console.log('Attempting proxy-based fetch...');

    // ScraperAPI format - works well for Etsy, Amazon, etc.
    const proxyUrl = `http://api.scraperapi.com?api_key=${proxyApiKey}&url=${encodeURIComponent(url)}&render=true`;

    try {
        const response = await fetch(proxyUrl, {
            headers: {
                'Accept': 'text/html',
            }
        });

        if (!response.ok) {
            console.error('Proxy fetch failed:', response.status);
            return null;
        }

        return await response.text();
    } catch (err) {
        console.error('Proxy fetch error:', err);
        return null;
    }
}

// Alternative: Use Jina AI Reader for clean extraction (free tier available)
async function fetchWithJinaReader(url: string): Promise<any | null> {
    console.log('Attempting Jina Reader fetch...');

    try {
        const response = await fetch(`https://r.jina.ai/${url}`, {
            headers: {
                'Accept': 'application/json',
                'X-Return-Format': 'json'
            }
        });

        if (!response.ok) {
            console.error('Jina Reader failed:', response.status);
            return null;
        }

        return await response.json();
    } catch (err) {
        console.error('Jina Reader error:', err);
        return null;
    }
}

serve(async (req) => {
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

        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ]

        // Check if this is a difficult site that blocks bots
        const isDifficultSite = ['etsy.com', 'amazon.', 'ebay.com', 'walmart.com'].some(d => url.includes(d));
        const proxyApiKey = Deno.env.get('SCRAPER_API_KEY');
        const geminiKey = Deno.env.get('GEMINI_API_KEY');

        let html = '';
        let usedMethod = 'direct';

        // === STRATEGY 1: Try Jina Reader first for difficult sites (free, no API key needed) ===
        if (isDifficultSite) {
            const jinaResult = await fetchWithJinaReader(url);
            if (jinaResult && jinaResult.data) {
                const jinaTitle = jinaResult.data.title || '';
                const jinaImage = jinaResult.data.image || '';

                // Validate Jina Result quality
                // Etsy often returns just "etsy.com..." if it fails
                const isGoodTitle = jinaTitle.length > 5 && !jinaTitle.toLowerCase().includes('etsy.com...') && !jinaTitle.toLowerCase().includes('access denied');
                const isGoodImage = jinaImage && !jinaImage.includes('MISSING');

                if (isGoodTitle && isGoodImage) {
                    usedMethod = 'jina';
                    // Jina returns structured data directly
                    const result = {
                        title: jinaTitle.trim(),
                        description: jinaResult.data.description?.trim() || '',
                        image: jinaImage,
                        price: 0,
                        currency: '$',
                        storeName: new URL(url).hostname.replace('www.', ''),
                        url: url,
                        success: true,
                        method: 'jina'
                    };

                    // Try to extract price from content
                    if (jinaResult.data.content) {
                        const priceMatch = jinaResult.data.content.match(/[\$€£][\d,]+\.?\d*/);
                        if (priceMatch) {
                            result.price = parseFloat(priceMatch[0].replace(/[^\d.]/g, ''));
                            result.currency = priceMatch[0].charAt(0);
                        }
                    }

                    return new Response(
                        JSON.stringify(result),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                } else {
                    console.log('Jina result poor (missing image or bad title), falling back to other methods...', { title: jinaTitle, hasImage: !!jinaImage });
                }
            }
        }

        // === STRATEGY 2: Try direct fetch ===
        try {
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
            if (!response.ok) throw new Error(`Status ${response.status}`);
            html = await response.text();
            usedMethod = 'direct';
        } catch (fetchError) {
            console.log('Direct fetch failed, trying alternatives...');

            // === STRATEGY 3: WhatsApp Preview Masquerade (User Suggestion) ===
            // Many sites whitelist WhatsApp to ensure previews work
            try {
                console.log('Trying WhatsApp User-Agent...');
                const waResponse = await fetch(url, {
                    headers: {
                        'User-Agent': 'WhatsApp/2.23.1.76 A', // Modern WhatsApp UA
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5'
                    }
                });
                if (waResponse.ok) {
                    html = await waResponse.text();
                    usedMethod = 'whatsapp';
                }
            } catch (e) {
                console.log('WhatsApp masquerade failed', e);
            }

            // === STRATEGY 4: Try proxy API if available ===
            if (!html && proxyApiKey) {
                html = await fetchWithProxy(url, proxyApiKey) || '';
                usedMethod = 'proxy';
            }

            // === STRATEGY 5: Final fallback - return error with manual entry suggestion ===
            if (!html) {
                return new Response(
                    JSON.stringify({
                        error: 'This site blocks automated access. Please enter product details manually.',
                        success: false,
                        blocked: true
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        const $ = cheerio.load(html)

        // Helper to resolve relative URLs
        const resolveUrl = (relativeUrl: string | undefined) => {
            if (!relativeUrl) return '';
            try {
                return new URL(relativeUrl, url).href;
            } catch (e) {
                return relativeUrl;
            }
        };

        // Extract Metadata
        let title = $('meta[property="og:title"]').attr('content') || $('title').text() || ''
        let description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
        let image = $('meta[property="og:image"]').attr('content') ||
            $('meta[property="twitter:image"]').attr('content') ||
            $('link[rel="image_src"]').attr('href') ||
            $('link[rel="apple-touch-icon"]').attr('href') ||
            ''

        // Fallback: Find largest image on page if no metadata
        if (!image) {
            let maxArea = 0;
            $('img').each((_, el) => {
                const src = $(el).attr('src');
                if (src && !src.includes('data:image')) {
                    // Simple heuristic: prioritize images with dimensions specified
                    const width = parseInt($(el).attr('width') || '0');
                    const height = parseInt($(el).attr('height') || '0');
                    const area = width * height;

                    // Or just take the first substantial likely product image
                    if (area > maxArea && area > 5000) { // > 50x100
                        maxArea = area;
                        image = src;
                    }
                }
            });

            // If still no image, take the first non-icon image
            if (!image) {
                const firstImg = $('img').first().attr('src');
                if (firstImg) image = firstImg;
            }
        }

        // Fix relative URLs
        image = resolveUrl(image);
        let siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname
        let price = 0;
        let currency = '$';

        // JSON-LD extraction
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html() || '{}')
                if (data['@type'] === 'Product' || data['@type'] === 'ItemPage') {
                    const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers
                    if (offer && offer.price) {
                        price = parseFloat(offer.price)
                        currency = offer.priceCurrency || currency
                    }
                    if (data.name) title = data.name;
                    if (data.image) image = Array.isArray(data.image) ? data.image[0] : data.image;
                }
            } catch (e) { }
        })

        // OG price tags
        if (!price) {
            const ogPrice = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content')
            if (ogPrice) price = parseFloat(ogPrice.replace(/[^0-9.]/g, ''))
        }

        // === STRATEGY 4: Jina Reader Fallback (Universal) ===
        // If we still don't have a good title or image, try Jina
        if ((!title || !image || image.includes('MISSING')) && !isDifficultSite) { // Don't double-call if we already tried it
            console.log('Falling back to Jina Reader...');
            const jinaResult = await fetchWithJinaReader(url);
            if (jinaResult && jinaResult.data) {
                if (!title) title = jinaResult.data.title || '';
                if (!description) description = jinaResult.data.description || '';
                if (!image || image.includes('MISSING')) image = jinaResult.data.image || '';

                // Try to extract price from Jina content if we still don't have it
                if (!price && jinaResult.data.content) {
                    const priceMatch = jinaResult.data.content.match(/[\$€£][\d,]+\.?\d*/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[0].replace(/[^\d.]/g, ''));
                        currency = priceMatch[0].charAt(0);
                    }
                }

                usedMethod = 'jina_fallback';
            }
        }

        // === GEMINI FALLBACK for missing data ===
        if ((!title || !price) && geminiKey) {
            const llmResult = await scrapeWithGemini(html, url, geminiKey);
            if (llmResult) {
                console.log('Used Gemini result');
                title = llmResult.title || title;
                description = llmResult.description || description;
                price = llmResult.price || price;
                image = llmResult.image || image;
                currency = llmResult.currency || currency;
                siteName = llmResult.storeName || siteName;
            }
        }

        const result = {
            title: title?.trim(),
            description: description?.trim(),
            image,
            price: price || 0,
            currency: currency,
            storeName: siteName,
            url: url,
            success: true,
            method: usedMethod
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Scraping error:', error)

        // Return 200 with error details instead of 500 to prevent client-side SDK throwing
        return new Response(
            JSON.stringify({
                error: (error as Error).message || 'Unknown error occurred',
                success: false,
                stack: (error as Error).stack
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 // Use 200 so the client can parse the error message
            }
        )
    }
})
