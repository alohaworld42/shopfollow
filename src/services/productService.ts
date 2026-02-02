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
        imageUrl: row.image_url as string,
        price: Number(row.price),
        storeName: row.store_name as string,
        storeUrl: row.store_url as string || '',
        visibility: row.visibility as Visibility,
        groupId: row.group_id as string | undefined,
        likes: [], // Will be populated separately
        comments: [], // Will be populated separately
        createdAt: new Date(row.created_at as string)
    };
}

// Get feed products (from followed users + public)
export async function getFeedProducts(userId?: string, limit = 20): Promise<Product[]> {
    if (!isSupabaseConfigured) {
        return getMockProducts();
    }

    // Use the view with user details
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

    // Get likes and comments for each product
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
        .select(`
            id,
            text,
            created_at,
            user_id,
            profiles!inner(display_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

    if (error) return [];

    return data.map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { display_name: string; avatar_url: string };
        return {
            id: row.id as string,
            userId: row.user_id as string,
            userName: profiles?.display_name || 'Anonymous',
            userAvatar: profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
            text: row.text as string,
            createdAt: new Date(row.created_at as string)
        };
    });
}

// Create a new product
export async function createProduct(product: Omit<Product, 'id' | 'likes' | 'comments' | 'createdAt'>): Promise<Product> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('products')
        .insert({
            user_id: product.userId,
            name: product.name,
            image_url: product.imageUrl,
            price: product.price,
            store_name: product.storeName,
            store_url: product.storeUrl,
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
        comments: []
    };
}

// Update a product
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.storeName) dbUpdates.store_name = updates.storeName;
    if (updates.storeUrl) dbUpdates.store_url = updates.storeUrl;
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

    // Check if already liked
    const { data: existing } = await supabase
        .from('likes')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        // Unlike
        await supabase
            .from('likes')
            .delete()
            .eq('product_id', productId)
            .eq('user_id', userId);
        return false;
    } else {
        // Like
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

    // Fetch profile separately to avoid complex join types
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
            imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80',
            price: 139.99,
            storeName: 'Nike',
            storeUrl: 'https://nike.com',
            visibility: 'public',
            likes: ['user1', 'user2'],
            comments: [],
            createdAt: new Date(now.getTime() - 3600000)
        },
        {
            id: '2',
            userId: 'demo-user-2',
            userName: 'Max Schmidt',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
            name: 'Apple AirPods Pro',
            imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
            price: 279.00,
            storeName: 'Apple',
            storeUrl: 'https://apple.com',
            visibility: 'public',
            likes: ['user1'],
            comments: [],
            createdAt: new Date(now.getTime() - 7200000)
        },
        {
            id: '3',
            userId: 'demo-user-3',
            userName: 'Lisa Weber',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
            name: 'Minimalist Watch',
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
            price: 189.00,
            storeName: 'Nordstrom',
            storeUrl: 'https://nordstrom.com',
            visibility: 'public',
            likes: [],
            comments: [],
            createdAt: new Date(now.getTime() - 14400000)
        }
    ];
}
