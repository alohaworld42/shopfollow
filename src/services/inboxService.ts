import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StagingOrder, OrderStatus, OrderSource } from '../types';

// Convert DB row to StagingOrder
function toStagingOrder(row: Record<string, unknown>): StagingOrder {
    // Handle images - can be array or extract from single image
    const imageUrl = row.product_image_url as string;
    const images = row.images as string[] || (imageUrl ? [imageUrl] : []);

    return {
        id: row.id as string,
        userId: row.user_id as string,
        source: (row.source as OrderSource) || 'manual',
        rawData: {
            name: row.product_name as string,
            description: row.product_description as string | undefined,
            price: Number(row.product_price),
            originalPrice: row.original_price ? Number(row.original_price) : undefined,
            currency: row.currency as string || '€',
            storeName: row.store_name as string,
            storeUrl: row.store_url as string || '',
            images: images,
            category: row.category as string | undefined,
            brand: row.brand as string | undefined
        },
        status: row.status as OrderStatus,
        createdAt: new Date(row.created_at as string)
    };
}

// Get pending staging orders for a user
export async function getStagingOrders(userId: string): Promise<StagingOrder[]> {
    if (!isSupabaseConfigured) {
        return getMockStagingOrders();
    }

    const { data, error } = await supabase
        .from('staging_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching staging orders:', error);
        return [];
    }

    return data.map(toStagingOrder);
}

// Accept a staging order (create product and update status)
export async function acceptStagingOrder(orderId: string, userId: string, visibility: 'public' | 'private' | 'group' = 'public'): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { data: order, error: fetchError } = await supabase
        .from('staging_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) throw new Error('Order not found');

    // Create product from staging order
    const { error: insertError } = await supabase
        .from('products')
        .insert({
            user_id: userId,
            name: order.product_name,
            images: order.images || [order.product_image_url],
            image_url: order.product_image_url,
            price: order.product_price,
            original_price: order.original_price,
            currency: order.currency || '€',
            store_name: order.store_name,
            store_url: order.store_url,
            visibility
        });

    if (insertError) throw insertError;

    // Update staging order status
    const { error: updateError } = await supabase
        .from('staging_orders')
        .update({ status: 'accepted', processed_at: new Date().toISOString() })
        .eq('id', orderId);

    if (updateError) throw updateError;
}

// Reject a staging order
export async function rejectStagingOrder(orderId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
        .from('staging_orders')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', orderId);

    if (error) throw error;
}

// Subscribe to real-time staging order updates
export function subscribeToStagingOrders(userId: string, onUpdate: (orders: StagingOrder[]) => void) {
    if (!isSupabaseConfigured) {
        return { unsubscribe: () => { } };
    }

    const channel = supabase
        .channel('staging_orders_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'staging_orders',
                filter: `user_id=eq.${userId}`
            },
            async () => {
                const orders = await getStagingOrders(userId);
                onUpdate(orders);
            }
        )
        .subscribe();

    return {
        unsubscribe: () => supabase.removeChannel(channel)
    };
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) return 2;

    const { count, error } = await supabase
        .from('staging_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

    if (error) return 0;
    return count || 0;
}

// Mock staging orders for demo mode
function getMockStagingOrders(): StagingOrder[] {
    const now = new Date();
    return [
        {
            id: 'mock-1',
            userId: 'demo-user',
            source: 'scraper',
            rawData: {
                name: 'Wireless Charging Pad',
                price: 39.99,
                currency: '€',
                storeName: 'Amazon',
                storeUrl: 'https://amazon.com',
                images: ['https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=800&q=80']
            },
            status: 'pending',
            createdAt: new Date(now.getTime() - 1800000)
        },
        {
            id: 'mock-2',
            userId: 'demo-user',
            source: 'browser',
            rawData: {
                name: 'Sustainable Water Bottle',
                price: 34.00,
                currency: '€',
                storeName: 'Etsy',
                storeUrl: 'https://etsy.com',
                images: [
                    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80'
                ]
            },
            status: 'pending',
            createdAt: new Date(now.getTime() - 3600000)
        }
    ];
}

// Simulate incoming order (for demo)
export async function simulateIncomingOrder(userId: string): Promise<string> {
    if (!isSupabaseConfigured) {
        return 'mock-new';
    }

    const sampleProducts = [
        { name: 'Designer Sunglasses', price: 245, store: 'Ray-Ban', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80' },
        { name: 'Premium Headphones', price: 199, store: 'Sony', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' },
        { name: 'Running Shoes', price: 159, store: 'Adidas', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' }
    ];

    const random = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];

    const { data, error } = await supabase
        .from('staging_orders')
        .insert({
            user_id: userId,
            source: 'demo',
            product_name: random.name,
            images: [random.image],
            product_image_url: random.image,
            product_price: random.price,
            store_name: random.store,
            store_url: `https://${random.store.toLowerCase()}.com`,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;
    return data.id;
}
