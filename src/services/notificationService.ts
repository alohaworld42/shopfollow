/**
 * Notifications Service - Real-time notifications from Supabase
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Notification {
    id: string;
    userId: string;
    type: 'like' | 'comment' | 'follow' | 'order' | 'mention' | 'system';
    title: string;
    body: string | null;
    data: Record<string, unknown>;
    readAt: Date | null;
    createdAt: Date;
}

// Convert DB row to Notification
function toNotification(row: Record<string, unknown>): Notification {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        type: row.type as Notification['type'],
        title: row.title as string,
        body: row.body as string | null,
        data: row.data as Record<string, unknown> || {},
        readAt: row.read_at ? new Date(row.read_at as string) : null,
        createdAt: new Date(row.created_at as string)
    };
}

// Get all notifications for a user
export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    if (!isSupabaseConfigured) {
        return getDemoNotifications();
    }

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data.map(toNotification);
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) return 3;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

    if (error) return 0;
    return count || 0;
}

// Mark a notification as read
export async function markAsRead(notificationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
}

// Mark all notifications as read
export async function markAllAsRead(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
    userId: string,
    onNew: (notification: Notification) => void
) {
    if (!isSupabaseConfigured) {
        return { unsubscribe: () => { } };
    }

    const channel = supabase
        .channel('notifications_channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                onNew(toNotification(payload.new as Record<string, unknown>));
            }
        )
        .subscribe();

    return {
        unsubscribe: () => supabase.removeChannel(channel)
    };
}

// Demo notifications
function getDemoNotifications(): Notification[] {
    const now = new Date();
    return [
        {
            id: 'demo-1',
            userId: 'demo-user-1',
            type: 'follow',
            title: 'New Follower',
            body: 'Sarah Miller started following you',
            data: { follower_id: 'user-2' },
            readAt: null,
            createdAt: new Date(now.getTime() - 1000 * 60 * 30)
        },
        {
            id: 'demo-2',
            userId: 'demo-user-1',
            type: 'like',
            title: 'New Like',
            body: 'Max Weber liked your post "Designer Sneakers"',
            data: { product_id: 'prod-1' },
            readAt: null,
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2)
        },
        {
            id: 'demo-3',
            userId: 'demo-user-1',
            type: 'order',
            title: 'New Purchase Detected',
            body: 'A new item from Amazon is ready to share',
            data: { order_id: 'order-1' },
            readAt: new Date(now.getTime() - 1000 * 60 * 60),
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5)
        }
    ];
}
