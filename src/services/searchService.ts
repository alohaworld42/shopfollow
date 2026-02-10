/**
 * Search Service - Full-text search for products and users
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product, User } from '../types';

// Type for profile join data
interface ProfileData {
    display_name: string;
    avatar_url: string | null;
}

// Helper to safely get profile data
function getProfileData(profiles: unknown): ProfileData | null {
    if (profiles && typeof profiles === 'object' && 'display_name' in profiles) {
        return profiles as ProfileData;
    }
    return null;
}

// Search products by name/store/category
export async function searchProducts(query: string, category?: string | null, limit = 20): Promise<Product[]> {
    if (!isSupabaseConfigured) return [];

    let queryBuilder = supabase
        .from('products')
        .select(`
            id,
            user_id,
            name,
            images,
            image_url,
            price,
            original_price,
            currency,
            store_name,
            store_url,
            affiliate_url,
            visibility,
            group_id,
            created_at,
            category,
            brand,
            profiles!products_user_id_fkey(display_name, avatar_url)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (query && query.trim()) {
        const searchTerm = `%${query.trim()}%`;
        queryBuilder = queryBuilder.or(`name.ilike.${searchTerm},store_name.ilike.${searchTerm}`);
    }

    if (category) {
        queryBuilder = queryBuilder.ilike('category', category);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    return data.map((row) => {
        const profile = getProfileData(row.profiles);

        return {
            id: row.id,
            userId: row.user_id,
            userName: profile?.display_name || 'Anonymous',
            userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
            name: row.name,
            images: row.images || [row.image_url],
            imageUrl: row.image_url,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : undefined,
            currency: row.currency || '€',
            storeName: row.store_name,
            storeUrl: row.store_url || '',
            affiliateUrl: row.affiliate_url,
            hasAffiliateLink: !!row.affiliate_url,
            visibility: row.visibility as 'public' | 'private' | 'group',
            groupId: row.group_id,
            category: row.category,
            brand: row.brand,
            likes: [],
            comments: [],
            saves: [],
            createdAt: new Date(row.created_at)
        };
    });
}

// Search users by display name
export async function searchUsers(query: string, limit = 20): Promise<User[]> {
    if (!isSupabaseConfigured || !query.trim()) return [];

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', searchTerm)
        .limit(limit);

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    return data.map(row => ({
        uid: row.id,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`,
        score: row.score || 0,
        following: [],
        followers: [],
        groups: [],
        isPrivate: row.is_private as boolean || false,
        createdAt: new Date(row.created_at)
    }));
}

// Get trending/popular products (most liked)
export async function getTrendingProducts(category?: string | null, limit = 10): Promise<Product[]> {
    if (!isSupabaseConfigured) return [];

    let queryBuilder = supabase
        .from('products')
        .select(`
            id,
            user_id,
            name,
            images,
            image_url,
            price,
            original_price,
            currency,
            store_name,
            store_url,
            affiliate_url,
            visibility,
            group_id,
            created_at,
            category,
            brand,
            profiles!products_user_id_fkey(display_name, avatar_url)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (category) {
        queryBuilder = queryBuilder.ilike('category', category);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error('Error fetching trending:', error);
        return [];
    }

    return data.map(row => {
        const profile = getProfileData(row.profiles);
        return {
            id: row.id,
            userId: row.user_id,
            userName: profile?.display_name || 'Anonymous',
            userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
            name: row.name,
            images: row.images || [row.image_url],
            imageUrl: row.image_url,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : undefined,
            currency: row.currency || '€',
            storeName: row.store_name,
            storeUrl: row.store_url || '',
            affiliateUrl: row.affiliate_url,
            hasAffiliateLink: !!row.affiliate_url,
            visibility: row.visibility as 'public' | 'private' | 'group',
            groupId: row.group_id,
            category: row.category,
            brand: row.brand,
            likes: [],
            comments: [],
            saves: [],
            createdAt: new Date(row.created_at)
        };
    });
}
