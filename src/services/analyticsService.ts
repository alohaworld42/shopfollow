/**
 * Analytics Service - Fetches real user stats from Supabase
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DashboardStats {
    earnings: number;
    clicks: number;
    orders: number;
    reach: number;
    totalProducts: number;
    totalLikes: number;
    totalComments: number;
    followers: number;
    following: number;
}

// Default empty stats for fallback
const DEMO_STATS: DashboardStats = {
    earnings: 0,
    clicks: 0,
    orders: 0,
    reach: 0,
    totalProducts: 0,
    totalLikes: 0,
    totalComments: 0,
    followers: 0,
    following: 0
};

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    if (!isSupabaseConfigured) {
        return DEMO_STATS;
    }

    try {
        // Get product count and likes
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', userId);

        if (prodError) throw prodError;
        const productIds = products?.map(p => p.id) || [];

        // Skip likes/comments queries if user has no products
        let totalLikes = 0;
        let totalComments = 0;

        if (productIds.length > 0) {
            const [likesResult, commentsResult] = await Promise.all([
                supabase
                    .from('likes')
                    .select('*', { count: 'exact', head: true })
                    .in('product_id', productIds),
                supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .in('product_id', productIds)
            ]);
            totalLikes = likesResult.count || 0;
            totalComments = commentsResult.count || 0;
        }

        // Get followers count
        const { count: followers } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        // Get following count
        const { count: following } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        // Get pending orders count
        const { count: orders } = await supabase
            .from('staging_orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'pending');

        return {
            earnings: 0, // Would need affiliate tracking table
            clicks: 0, // Would need link click tracking
            orders: orders || 0,
            reach: (followers || 0) * 15, // Estimate
            totalProducts: productIds.length,
            totalLikes: totalLikes || 0,
            totalComments: totalComments || 0,
            followers: followers || 0,
            following: following || 0
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return DEMO_STATS;
    }
}

/**
 * Get user profile data
 */
export async function getUserProfile(userId: string) {
    if (!isSupabaseConfigured) {
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        bio: data.bio || '',
        score: data.score || 0,
        isVerified: data.is_verified || false,
        isAdmin: data.is_admin || false,
        createdAt: new Date(data.created_at)
    };
}
