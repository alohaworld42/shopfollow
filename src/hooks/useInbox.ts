import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as inboxService from '../services/inboxService';
import type { StagingOrder } from '../types';

// Demo staging orders
const DEMO_ORDERS: StagingOrder[] = [
    {
        id: 'order-1',
        userId: 'demo-user-1',
        rawData: {
            name: 'Wireless Charging Pad',
            price: 39.99,
            storeName: 'Amazon',
            storeUrl: 'https://amazon.com',
            imageUrl: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=800&q=80'
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 5)
    },
    {
        id: 'order-2',
        userId: 'demo-user-1',
        rawData: {
            name: 'Ceramic Coffee Mug Set',
            price: 45.00,
            storeName: 'Etsy',
            storeUrl: 'https://etsy.com',
            imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80'
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
    }
];

export const useInbox = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<StagingOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const isDemoMode = !isSupabaseConfigured;

    // Fetch pending orders
    const fetchOrders = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                await new Promise(r => setTimeout(r, 300));
                setOrders(DEMO_ORDERS);
                setUnreadCount(DEMO_ORDERS.length);
            } else {
                const data = await inboxService.getStagingOrders(user.uid);
                setOrders(data);
                setUnreadCount(data.length);
            }
        } catch {
            setError('Fehler beim Laden der Inbox');
        } finally {
            setLoading(false);
        }
    }, [user, isDemoMode]);

    // Accept order (creates product)
    const acceptOrder = useCallback(async (orderId: string) => {
        if (!user) return false;

        setOrders(prev => prev.filter(o => o.id !== orderId));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (!isDemoMode) {
            await inboxService.acceptStagingOrder(orderId, user.uid);
        }

        return true;
    }, [isDemoMode, user]);

    // Reject order
    const rejectOrder = useCallback(async (orderId: string) => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (!isDemoMode) {
            await inboxService.rejectStagingOrder(orderId);
        }
    }, [isDemoMode]);

    // Simulate new incoming order (for demo)
    const simulateNewOrder = useCallback(() => {
        const sampleProducts = [
            {
                name: 'Vintage Vinyl Record',
                price: 25.00,
                storeName: 'Discogs',
                storeUrl: 'https://discogs.com',
                imageUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&q=80'
            },
            {
                name: 'Artisan Chocolate Box',
                price: 55.00,
                storeName: 'Godiva',
                storeUrl: 'https://godiva.com',
                imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&q=80'
            },
            {
                name: 'Smart LED Light Strip',
                price: 29.99,
                storeName: 'Phillips',
                storeUrl: 'https://phillips.com',
                imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'
            }
        ];

        const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const newOrder: StagingOrder = {
            id: crypto.randomUUID(),
            userId: user?.uid || 'demo-user-1',
            rawData: randomProduct,
            status: 'pending',
            createdAt: new Date()
        };

        setOrders(prev => [newOrder, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, [user]);

    // Start background sync simulation
    useEffect(() => {
        if (!user || !isDemoMode) return;

        // Simulate incoming order every 45-90 seconds
        const interval = setInterval(() => {
            if (Math.random() > 0.5) { // 50% chance
                simulateNewOrder();
            }
        }, 45000 + Math.random() * 45000);

        return () => clearInterval(interval);
    }, [user, isDemoMode, simulateNewOrder]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!user || isDemoMode) return;

        const { unsubscribe } = inboxService.subscribeToStagingOrders(user.uid, (newOrders) => {
            setOrders(newOrders);
            setUnreadCount(newOrders.length);
        });

        return () => unsubscribe();
    }, [user, isDemoMode]);

    // Initial fetch
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        error,
        unreadCount,
        fetchOrders,
        acceptOrder,
        rejectOrder,
        simulateNewOrder
    };
};

export default useInbox;
