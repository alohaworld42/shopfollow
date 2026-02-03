import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as inboxService from '../services/inboxService';
import type { StagingOrder } from '../types';

// Demo staging orders disabled for production
const DEMO_ORDERS: StagingOrder[] = [];

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
            setError('Error loading inbox');
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
    }, [user, isDemoMode]);

    // Reject order
    const rejectOrder = useCallback(async (orderId: string) => {
        if (!user) return false;

        setOrders(prev => prev.filter(o => o.id !== orderId));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (!isDemoMode) {
            await inboxService.rejectStagingOrder(orderId);
        }

        return true;
    }, [user, isDemoMode]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!user || isDemoMode) return;

        const { unsubscribe } = inboxService.subscribeToStagingOrders(user.uid, (newOrders) => {
            setOrders(newOrders);
            setUnreadCount(newOrders.length);
        });

        return () => unsubscribe();
    }, [user, isDemoMode]);

    // Initial load
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
        rejectOrder
    };
};

export default useInbox;
