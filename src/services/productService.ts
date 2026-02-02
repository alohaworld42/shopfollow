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
        .eq('visibility', 'public')
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
        return product;
    }));
}

// Get likes for a product
async function getProductLikes(productId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('likes')
        .select('user_id')
        .eq('product_id', productId);

    if (error) return [];
    return data.map(row => row.user_id);
}

// Get comments for a product
async function getProductComments(productId: string): Promise<Comment[]> {
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

// Add a comment
export async function addComment(productId: string, userId: string, text: string): Promise<Comment> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('comments')
        .insert({
            product_id: productId,
            user_id: userId,
            text
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

// Mock products for demo mode
function getMockProducts(): Product[] {
    const now = new Date();
    return [
        {
            id: '1',
            userId: 'demo-user',
            userName: 'Sarah Miller',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
            name: 'Nike Air Max 90',
            images: ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80'],
            imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
            price: 139.99,
            currency: '€',
            storeName: 'Nike',
            storeUrl: 'https://nike.com',
            hasAffiliateLink: true,
            affiliateUrl: 'https://nike.com?ref=cartconnect',
            visibility: 'public',
            likes: ['user1', 'user2'],
            comments: [],
            saves: [],
            createdAt: new Date(now.getTime() - 3600000)
        },
        {
            id: '2',
            userId: 'demo-user-2',
            userName: 'Max Schmidt',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
            name: 'Apple AirPods Pro',
            images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'],
            imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
            price: 279.00,
            currency: '€',
            storeName: 'Apple',
            storeUrl: 'https://apple.com',
            hasAffiliateLink: false,
            visibility: 'public',
            likes: ['user1'],
            comments: [],
            saves: [],
            createdAt: new Date(now.getTime() - 7200000)
        },
        {
            id: '3',
            userId: 'demo-user-3',
            userName: 'Lisa Weber',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
            name: 'Minimalist Watch',
            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
            price: 189.00,
            currency: '€',
            storeName: 'Nordstrom',
            storeUrl: 'https://nordstrom.com',
            hasAffiliateLink: true,
            affiliateUrl: 'https://nordstrom.com?ref=cartconnect',
            visibility: 'public',
            likes: [],
            comments: [],
            saves: [],
            createdAt: new Date(now.getTime() - 14400000)
        }
    ];
}
