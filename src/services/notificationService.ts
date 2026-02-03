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

// Web Push Subscription
export async function subscribeToPushNotifications(userId: string) {
    if (!isSupabaseConfigured) return null;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // VAPID Public Key (Ideally from env, but hardcoded for now or fetched)
        // You need to generate this pair. For now using a placeholder or needing env.
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('Missing VAPID Public Key');
            return null;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Save to Supabase
        const { error } = await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!)))),
            user_agent: navigator.userAgent
        }, { onConflict: 'endpoint' });

        if (error) throw error;

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push:', error);
        return null;
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Demo notifications disabled - using real Supabase data
function getDemoNotifications(): Notification[] {
    return [];
}
