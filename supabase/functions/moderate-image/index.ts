// Image Moderation Edge Function
// Detects NSFW content in images using Google Cloud Vision API or fallback heuristics

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageModerationResult {
    safe: boolean;
    nsfw_score: number;
    violence_score: number;
    categories: {
        adult: number;
        violence: number;
        racy: number;
        spoof: number;
        medical: number;
    };
    reason?: string;
}

// Use Google Cloud Vision API for NSFW detection
async function moderateWithGoogleVision(imageUrl: string): Promise<ImageModerationResult | null> {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [{
                        image: { source: { imageUri: imageUrl } },
                        features: [{ type: 'SAFE_SEARCH_DETECTION' }]
                    }]
                }),
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const safeSearch = data.responses[0]?.safeSearchAnnotation;

        if (!safeSearch) return null;

        // Convert likelihood to scores (0-1)
        const likelihoodToScore = (likelihood: string): number => {
            const scores: Record<string, number> = {
                'VERY_UNLIKELY': 0.0,
                'UNLIKELY': 0.2,
                'POSSIBLE': 0.5,
                'LIKELY': 0.8,
                'VERY_LIKELY': 1.0,
            };
            return scores[likelihood] || 0;
        };

        const categories = {
            adult: likelihoodToScore(safeSearch.adult),
            violence: likelihoodToScore(safeSearch.violence),
            racy: likelihoodToScore(safeSearch.racy),
            spoof: likelihoodToScore(safeSearch.spoof),
            medical: likelihoodToScore(safeSearch.medical),
        };

        // Calculate overall scores
        const nsfw_score = Math.max(categories.adult, categories.racy * 0.7);
        const violence_score = categories.violence;

        // Image is safe if all concerning categories are below threshold
        const safe = nsfw_score < 0.5 && violence_score < 0.5;

        return {
            safe,
            nsfw_score,
            violence_score,
            categories,
            reason: safe ? undefined : `Content flagged: adult=${categories.adult.toFixed(2)}, violence=${categories.violence.toFixed(2)}`,
        };
    } catch (error) {
        console.error('Google Vision API error:', error);
        return null;
    }
}

// Fallback: Simple URL-based heuristics (not recommended for production)
function basicUrlCheck(imageUrl: string): ImageModerationResult {
    const suspiciousPatterns = [
        /nsfw/i,
        /adult/i,
        /xxx/i,
        /porn/i,
        /explicit/i,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(imageUrl));

    return {
        safe: !isSuspicious,
        nsfw_score: isSuspicious ? 0.8 : 0,
        violence_score: 0,
        categories: {
            adult: isSuspicious ? 0.8 : 0,
            violence: 0,
            racy: isSuspicious ? 0.5 : 0,
            spoof: 0,
            medical: 0,
        },
        reason: isSuspicious ? 'URL contains suspicious keywords' : undefined,
    };
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { image_url, product_id, update_product } = await req.json();

        if (!image_url || typeof image_url !== 'string') {
            return new Response(
                JSON.stringify({ error: 'image_url is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Try Google Vision first, fall back to basic check
        let result = await moderateWithGoogleVision(image_url);
        if (!result) {
            result = basicUrlCheck(image_url);
        }

        // If we should update the product's moderation status
        if (update_product && product_id) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const moderationStatus = result.safe ? 'approved' : 'flagged';

            await supabase
                .from('products')
                .update({
                    is_nsfw: !result.safe,
                    moderation_status: moderationStatus,
                })
                .eq('id', product_id);

            return new Response(
                JSON.stringify({
                    ...result,
                    product_id,
                    moderation_status: moderationStatus,
                    message: result.safe ? 'Image approved' : 'Image flagged for review',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Image moderation error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
