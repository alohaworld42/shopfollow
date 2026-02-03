import { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, ShoppingBag, Check, CheckCheck } from 'lucide-react';
import { useNotifications, useAuth, useToast } from '../hooks';
import { formatDistanceToNow } from '../utils/formatDate';
import type { Notification } from '../services/notificationService';

// Get icon for notification type
function getNotificationIcon(type: Notification['type']) {
    switch (type) {
        case 'like':
            return <Heart size={20} className="text-pink-500" />;
        case 'comment':
            return <MessageCircle size={20} className="text-blue-500" />;
        case 'follow':
            return <UserPlus size={20} className="text-green-500" />;
        case 'order':
            return <ShoppingBag size={20} className="text-purple-500" />;
        default:
            return <Bell size={20} className="text-gray-500" />;
    }
}

const Notifications = () => {
    const { user } = useAuth(); // Need user for follow requests
    const { notifications, loading, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
    const [followRequests, setFollowRequests] = useState<any[]>([]); // User type import issue? Use any for now or imported User
    const [loadingRequests, setLoadingRequests] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchNotifications();
        if (user) fetchRequests();
    }, [fetchNotifications, user]);

    const fetchRequests = async () => {
        if (!user) return;
        setLoadingRequests(true);
        try {
            // Dynamically import userService to avoid circular dependency issues if any
            const { getFollowRequests } = await import('../services/userService');
            const reqs = await getFollowRequests(user.uid);
            setFollowRequests(reqs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleAccept = async (requesterId: string) => {
        if (!user) return;
        try {
            const { acceptFollowRequest } = await import('../services/userService');
            await acceptFollowRequest(user.uid, requesterId);
            setFollowRequests(prev => prev.filter(req => req.uid !== requesterId));
            showToast('success', 'Request accepted');
            // update followers count?
        } catch (error) {
            showToast('error', 'Failed to accept request');
        }
    };

    const handleReject = async (requesterId: string) => {
        if (!user) return;
        try {
            const { rejectFollowRequest } = await import('../services/userService');
            await rejectFollowRequest(user.uid, requesterId);
            setFollowRequests(prev => prev.filter(req => req.uid !== requesterId));
            showToast('success', 'Request rejected');
        } catch (error) {
            showToast('error', 'Failed to reject request');
        }
    };

    return (
        <div className="feed-container">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)'
            }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Bell size={28} className="text-primary-400" />
                    Notifications
                    {unreadCount > 0 && (
                        <span style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px'
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        <CheckCheck size={16} />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Follow Requests */}
            {followRequests.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Follow Requests</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {followRequests.map(req => (
                            <div key={req.uid} style={{
                                padding: '12px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={req.avatarUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '14px' }}>{req.displayName}</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>wants to follow you</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleAccept(req.uid)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Accept</button>
                                    <button onClick={() => handleReject(req.uid)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notifications List */}
            {loading ? (
                <div className="loading-screen" style={{ minHeight: '200px', background: 'transparent' }}>
                    <div className="loading-spinner" />
                </div>
            ) : notifications.length === 0 && followRequests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Bell size={32} />
                    </div>
                    <h3 className="empty-state-title">No notifications yet</h3>
                    <p className="empty-state-text">
                        When someone likes, comments, or follows you, you'll see it here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.readAt && markAsRead(notification.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '16px',
                                background: notification.readAt ? 'var(--bg-card)' : 'var(--bg-elevated)',
                                border: `1px solid ${notification.readAt ? 'var(--border-subtle)' : 'var(--color-primary-light)'}`,
                                borderRadius: 'var(--radius-lg)',
                                cursor: notification.readAt ? 'default' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--bg-glass)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    marginBottom: '2px'
                                }}>
                                    {notification.title}
                                </p>
                                {notification.body && (
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '13px',
                                        lineHeight: 1.4
                                    }}>
                                        {notification.body}
                                    </p>
                                )}
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '12px',
                                    marginTop: '4px'
                                }}>
                                    {formatDistanceToNow(notification.createdAt)}
                                </p>
                            </div>

                            {/* Read indicator */}
                            {!notification.readAt && (
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    flexShrink: 0
                                }} />
                            )}
                            {notification.readAt && (
                                <Check size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
