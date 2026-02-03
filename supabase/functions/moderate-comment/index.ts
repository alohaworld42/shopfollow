// Comment Moderation Edge Function
// Analyzes comments for toxicity, spam, and profanity before allowing them

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Basic profanity list (extend as needed)
const PROFANITY_LIST = [
    // Add words to filter - keeping this minimal for example
    'spam', 'scam', 'fake', 'fraud',
];

// Spam patterns
const SPAM_PATTERNS = [
    /(.)\1{4,}/i,                    // Repeated characters (aaaaa)
    /https?:\/\/[^\s]+/gi,           // URLs
    /\b(buy|click|free|winner|prize)\b/gi, // Spam keywords
    /[A-Z]{5,}/,                     // Excessive caps
    /(.{2,})\1{2,}/i,                // Repeated phrases
];

interface ModerationResult {
    allowed: boolean;
    toxicity_score: number;
    spam_score: number;
    profanity_detected: boolean;
    reason?: string;
    filtered_text?: string;
}

function analyzeText(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    let toxicity_score = 0;
    let spam_score = 0;
    let profanity_detected = false;
    const reasons: string[] = [];

    // Check profanity
    for (const word of PROFANITY_LIST) {
        if (lowerText.includes(word)) {
            profanity_detected = true;
            toxicity_score += 0.3;
            reasons.push(`Contains word: ${word}`);
        }
    }

    // Check spam patterns
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(text)) {
            spam_score += 0.25;
        }
    }

    // Check for ALL CAPS (more than 50% uppercase)
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 5 && upperCount / letterCount > 0.7) {
        toxicity_score += 0.2;
        reasons.push('Excessive caps detected');
    }

    // Check for very short comments that might be spam
    if (text.length < 3) {
        spam_score += 0.5;
        reasons.push('Too short');
    }

    // Check for repeated punctuation
    if (/[!?]{3,}/.test(text)) {
        toxicity_score += 0.1;
    }

    // Normalize scores to 0-1 range
    toxicity_score = Math.min(1, toxicity_score);
    spam_score = Math.min(1, spam_score);

    // Determine if allowed (threshold: 0.7 for either score)
    const allowed = toxicity_score < 0.7 && spam_score < 0.7;

    return {
        allowed,
        toxicity_score,
        spam_score,
        profanity_detected,
        reason: reasons.length > 0 ? reasons.join('; ') : undefined,
    };
}

// Optional: Use OpenAI Moderation API for better accuracy
async function moderateWithOpenAI(text: string): Promise<ModerationResult | null> {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return null;

    try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: text }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const result = data.results[0];

        // Calculate toxicity from OpenAI categories
        const categoryScores = result.category_scores;
        const toxicity = Math.max(
            categoryScores.harassment,
            categoryScores.hate,
            categoryScores['self-harm'],
            categoryScores.sexual,
            categoryScores.violence
        );

        return {
            allowed: !result.flagged,
            toxicity_score: toxicity,
            spam_score: 0, // OpenAI doesn't detect spam
            profanity_detected: result.flagged,
            reason: result.flagged ? 'Flagged by OpenAI moderation' : undefined,
        };
    } catch {
        return null;
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text, product_id, user_id, save_result } = await req.json();

        if (!text || typeof text !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Text is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Try OpenAI moderation first, fall back to local
        let result = await moderateWithOpenAI(text);
        if (!result) {
            result = analyzeText(text);
        } else {
            // Combine OpenAI result with local spam detection
            const localResult = analyzeText(text);
            result.spam_score = localResult.spam_score;
            if (localResult.spam_score >= 0.7) {
                result.allowed = false;
                result.reason = (result.reason ? result.reason + '; ' : '') + 'Spam detected';
            }
        }

        // If saving to database is requested
        if (save_result && product_id && user_id) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            if (result.allowed) {
                // Insert the comment
                const { data: comment, error: commentError } = await supabase
                    .from('comments')
                    .insert({
                        product_id,
                        user_id,
                        text,
                        is_hidden: false,
                    })
                    .select()
                    .single();

                if (commentError) throw commentError;

                // Save moderation result
                await supabase
                    .from('comment_moderation')
                    .insert({
                        comment_id: comment.id,
                        toxicity_score: result.toxicity_score,
                        spam_score: result.spam_score,
                        profanity_detected: result.profanity_detected,
                        auto_hidden: false,
                    });

                // Increment rate limit
                await supabase.rpc('increment_rate_limit', {
                    p_user_id: user_id,
                    p_action_type: 'comment',
                });

                return new Response(
                    JSON.stringify({
                        ...result,
                        comment_id: comment.id,
                        message: 'Comment posted successfully'
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            } else {
                return new Response(
                    JSON.stringify({
                        ...result,
                        message: 'Comment was not allowed due to content policy'
                    }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // Just return moderation result without saving
        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Moderation error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
