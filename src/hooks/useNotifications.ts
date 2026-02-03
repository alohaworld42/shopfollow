/**
 * useNotifications Hook - Manage notifications state with real-time updates
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as notificationService from '../services/notificationService';
import type { Notification } from '../services/notificationService';

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const data = await notificationService.getNotifications(user.uid);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.readAt).length);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Mark as read
    const markAsRead = useCallback(async (notificationId: string) => {
        await notificationService.markAsRead(notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, readAt: new Date() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!user) return;
        await notificationService.markAllAsRead(user.uid);
        setNotifications(prev =>
            prev.map(n => ({ ...n, readAt: n.readAt || new Date() }))
        );
        setUnreadCount(0);
    }, [user]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const { unsubscribe } = notificationService.subscribeToNotifications(
            user.uid,
            (newNotification) => {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        );

        return () => unsubscribe();
    }, [user, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };
};

export default useNotifications;
