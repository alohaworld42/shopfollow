import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product, Comment, Visibility } from '../types';

// Convert DB row to Product
function toProduct(row: Record<string, unknown>): Product {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        userName: row.user_name as string || 'Anonymous',
        userAvatar: row.user_avatar as string || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
        name: row.name as string,
        images: row.images as string[] || [row.image_url as string],
        imageUrl: row.image_url as string,
        price: Number(row.price),
        originalPrice: row.original_price ? Number(row.original_price) : undefined,
        currency: row.currency as string || '€',
        storeName: row.store_name as string,
        storeUrl: row.store_url as string || '',
        affiliateUrl: row.affiliate_url as string | undefined,
        hasAffiliateLink: !!row.affiliate_url,
        visibility: row.visibility as Visibility,
        groupId: row.group_id as string | undefined,
        likes: [],
        comments: [],
        saves: [],
        createdAt: new Date(row.created_at as string)
    };
}

// Get feed products (from followed users + public)
export async function getFeedProducts(userId?: string, limit = 20): Promise<Product[]> {
    if (!isSupabaseConfigured) {
        return getMockProducts();
    }

    const { data, error } = await supabase
        .from('products_with_details')
        .select('*')
        // .eq('visibility', 'public') -- Removed to allow RLS to handle Group/Private visibility
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching products:', error);
        return getMockProducts();
    }

    const products = await Promise.all(data.map(async (row) => {
        const product = toProduct(row);
        product.likes = await getProductLikes(product.id);
        product.comments = await getProductComments(product.id);
        product.saves = await getProductSaves(product.id);
        return product;
    }));

    return products;
}

// Get user's products
export async function getUserProducts(userId: string): Promise<Product[]> {
    if (!isSupabaseConfigured) {
        return getMockProducts().filter(p => p.userId === userId);
    }

    const { data, error } = await supabase
        .from('products_with_details')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user products:', error);
        return [];
    }

    return Promise.all(data.map(async (row) => {
        const product = toProduct(row);
        product.likes = await getProductLikes(product.id);
        product.comments = await getProductComments(product.id);
        product.saves = await getProductSaves(product.id);
        return product;
    }));
}

// Get likes for a product
export async function getProductLikes(productId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('likes')
        .select('user_id')
        .eq('product_id', productId);

    if (error) return [];
    return data.map(row => row.user_id);
}

// Get comments for a product
export async function getProductComments(productId: string): Promise<Comment[]> {
    if (!productId) return [];

    const { data, error } = await supabase
        .from('comments')
        .select('id, text, created_at, user_id')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

    if (error) return [];

    // Fetch profiles for comments
    const comments: Comment[] = [];
    for (const row of data) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', row.user_id)
            .single();

        comments.push({
            id: row.id,
            userId: row.user_id,
            userName: profile?.display_name || 'Anonymous',
            userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
            text: row.text,
            createdAt: new Date(row.created_at)
        });
    }

    return comments;
}

// Create a new product
export async function createProduct(product: Omit<Product, 'id' | 'likes' | 'comments' | 'saves' | 'createdAt'>): Promise<Product> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('products')
        .insert({
            user_id: product.userId,
            name: product.name,
            images: product.images,
            image_url: product.imageUrl,
            price: product.price,
            original_price: product.originalPrice,
            currency: product.currency,
            store_name: product.storeName,
            store_url: product.storeUrl,
            affiliate_url: product.affiliateUrl,
            category: product.category,
            brand: product.brand,
            visibility: product.visibility,
            group_id: product.groupId
        })
        .select()
        .single();

    if (error) throw error;

    return {
        ...toProduct(data),
        userName: product.userName,
        userAvatar: product.userAvatar,
        likes: [],
        comments: [],
        saves: []
    };
}

// Update a product
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.images) dbUpdates.images = updates.images;
    if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.originalPrice !== undefined) dbUpdates.original_price = updates.originalPrice;
    if (updates.storeName) dbUpdates.store_name = updates.storeName;
    if (updates.storeUrl) dbUpdates.store_url = updates.storeUrl;
    if (updates.affiliateUrl) dbUpdates.affiliate_url = updates.affiliateUrl;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.brand) dbUpdates.brand = updates.brand;
    if (updates.visibility) dbUpdates.visibility = updates.visibility;
    if (updates.groupId) dbUpdates.group_id = updates.groupId;

    const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', productId);

    if (error) throw error;
}

// Delete a product
export async function deleteProduct(productId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) throw error;
}

// Toggle like on a product
export async function toggleLike(productId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    const { data: existing } = await supabase
        .from('likes')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        await supabase
            .from('likes')
            .delete()
            .eq('product_id', productId)
            .eq('user_id', userId);
        return false;
    } else {
        await supabase
            .from('likes')
            .insert({ product_id: productId, user_id: userId });
        return true;
    }
}

// Get saves for a product
export async function getProductSaves(productId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('saves')
        .select('user_id')
        .eq('product_id', productId);

    if (error) return [];
    return data.map(row => row.user_id);
}

// Toggle save on a product
export async function toggleSave(productId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    const { data: existing } = await supabase
        .from('saves')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        await supabase
            .from('saves')
            .delete()
            .eq('product_id', productId)
            .eq('user_id', userId);
        return false;
    } else {
        await supabase
            .from('saves')
            .insert({ product_id: productId, user_id: userId });
        return true;
    }
}

// Add a comment (with moderation)
export async function addComment(productId: string, userId: string, text: string): Promise<Comment> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    // Call moderation Edge Function first (best-effort, non-blocking)
    let moderationStatus: 'approved' | 'flagged' | 'rejected' = 'approved';
    let moderationScore = 0;

    try {
        const { data: modResult, error: modError } = await supabase.functions.invoke('moderate-comment', {
            body: { text }
        });

        if (!modError && modResult) {
            if (modResult.rejected) {
                throw new Error(modResult.reason || 'Comment rejected by moderation');
            }
            if (modResult.flagged) {
                moderationStatus = 'flagged';
                moderationScore = modResult.toxicityScore || 0;
            }
        }
    } catch (modError) {
        // If moderation fails for any reason (401, network, etc.), allow the comment
        // Only re-throw if it was explicitly rejected
        if ((modError as Error).message?.includes('rejected')) {
            throw modError;
        }
        console.warn('Moderation check skipped:', (modError as Error).message);
    }

    // Insert comment with moderation status
    const { data, error } = await supabase
        .from('comments')
        .insert({
            product_id: productId,
            user_id: userId,
            text,
            moderation_status: moderationStatus,
            toxicity_score: moderationScore
        })
        .select('id, text, created_at, user_id')
        .single();

    if (error) throw error;

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single();

    return {
        id: data.id,
        userId: data.user_id,
        userName: profile?.display_name || 'Anonymous',
        userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        text: data.text,
        createdAt: new Date(data.created_at)
    };
}

// Mock products disabled - using real Supabase data
function getMockProducts(): Product[] {
    return [];
}
