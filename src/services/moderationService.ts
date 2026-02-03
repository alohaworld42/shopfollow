// Moderation Service
// Handles content moderation, user blocking, and reporting

import { supabase } from './supabase';

export type ReportReason =
    | 'spam'
    | 'inappropriate'
    | 'harassment'
    | 'nsfw'
    | 'scam'
    | 'impersonation'
    | 'other';

export interface ModerationResult {
    allowed: boolean;
    toxicity_score: number;
    spam_score: number;
    profanity_detected: boolean;
    reason?: string;
    comment_id?: string;
    message?: string;
}

export interface Report {
    id: string;
    reporter_id: string;
    reported_product_id?: string;
    reported_comment_id?: string;
    reported_user_id?: string;
    reason: ReportReason;
    description?: string;
    status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
    created_at: string;
}

export interface BlockedUser {
    blocker_id: string;
    blocked_id: string;
    created_at: string;
    blocked_profile?: {
        display_name: string;
        avatar_url: string;
    };
}

// ========================================
// COMMENT MODERATION
// ========================================

/**
 * Check if a comment passes moderation before posting
 */
export async function moderateComment(text: string): Promise<ModerationResult> {
    try {
        const { data, error } = await supabase.functions.invoke('moderate-comment', {
            body: { text },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Moderation check failed:', error);
        // Fail open - allow comment if moderation fails
        return {
            allowed: true,
            toxicity_score: 0,
            spam_score: 0,
            profanity_detected: false,
        };
    }
}

/**
 * Post a comment with moderation
 */
export async function postModeratedComment(
    productId: string,
    userId: string,
    text: string
): Promise<ModerationResult> {
    try {
        const { data, error } = await supabase.functions.invoke('moderate-comment', {
            body: {
                text,
                product_id: productId,
                user_id: userId,
                save_result: true,
            },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Failed to post moderated comment:', error);
        throw error;
    }
}

// ========================================
// USER BLOCKING
// ========================================

/**
 * Block a user
 */
export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) {
        if (error.code === '23505') {
            // Already blocked, ignore
            return;
        }
        throw error;
    }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    if (error) throw error;
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(viewerId: string, targetId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_user_blocked', {
        p_viewer_id: viewerId,
        p_target_id: targetId,
    });

    if (error) {
        console.error('Failed to check block status:', error);
        return false;
    }

    return data === true;
}

/**
 * Get all blocked users for a user
 */
export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    const { data, error } = await supabase
        .from('blocked_users')
        .select(`
            blocker_id,
            blocked_id,
            created_at,
            blocked_profile:profiles!blocked_id(display_name, avatar_url)
        `)
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as BlockedUser[]) || [];
}

// ========================================
// CONTENT REPORTING
// ========================================

/**
 * Report a product
 */
export async function reportProduct(
    reporterId: string,
    productId: string,
    reason: ReportReason,
    description?: string
): Promise<void> {
    const { error } = await supabase
        .from('moderation_flags')
        .insert({
            reporter_id: reporterId,
            reported_product_id: productId,
            reason,
            description,
        });

    if (error) throw error;
}

/**
 * Report a comment
 */
export async function reportComment(
    reporterId: string,
    commentId: string,
    reason: ReportReason,
    description?: string
): Promise<void> {
    const { error } = await supabase
        .from('moderation_flags')
        .insert({
            reporter_id: reporterId,
            reported_comment_id: commentId,
            reason,
            description,
        });

    if (error) throw error;
}

/**
 * Report a user
 */
export async function reportUser(
    reporterId: string,
    userId: string,
    reason: ReportReason,
    description?: string
): Promise<void> {
    const { error } = await supabase
        .from('moderation_flags')
        .insert({
            reporter_id: reporterId,
            reported_user_id: userId,
            reason,
            description,
        });

    if (error) throw error;
}

/**
 * Get user's own reports
 */
export async function getMyReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase
        .from('moderation_flags')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// ========================================
// RATE LIMITING (Client-side check)
// ========================================

/**
 * Check if user can perform action (client-side rate limit check)
 */
export async function checkRateLimit(
    userId: string,
    actionType: 'comment' | 'product' | 'follow' | 'report',
    maxCount: number,
    windowMinutes: number
): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_action_type: actionType,
        p_max_count: maxCount,
        p_window_minutes: windowMinutes,
    });

    if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Fail open
    }

    return data === true;
}

// Rate limit constants
export const RATE_LIMITS = {
    comment: { maxCount: 10, windowMinutes: 1 },      // 10 comments per minute
    commentDaily: { maxCount: 100, windowMinutes: 1440 }, // 100 per day
    product: { maxCount: 20, windowMinutes: 1440 },   // 20 products per day
    follow: { maxCount: 100, windowMinutes: 1440 },   // 100 follows per day
    report: { maxCount: 10, windowMinutes: 1440 },    // 10 reports per day
};
