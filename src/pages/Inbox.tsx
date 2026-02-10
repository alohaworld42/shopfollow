import { useEffect } from 'react';
import { Inbox as InboxIcon, Sparkles, RefreshCw } from 'lucide-react';
import { InboxItem } from '../components/inbox';
import { Button } from '../components/common';
import { useInbox, useProducts, useToast } from '../hooks';

const Inbox = () => {
    const { orders, loading, fetchOrders, acceptOrder, rejectOrder } = useInbox();
    const { createProduct } = useProducts();
    const { showToast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleAccept = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        await createProduct({
            name: order.rawData.name,
            images: order.rawData.images,
            price: order.rawData.price,
            storeName: order.rawData.storeName,
            storeUrl: order.rawData.storeUrl,
            visibility: 'public'
        });

        await acceptOrder(orderId);
        showToast('success', 'Product posted! 🎉');
    };

    const handleReject = async (orderId: string) => {
        await rejectOrder(orderId);
        showToast('info', 'Product rejected');
    };

    return (
        <div className="inbox-page">
            {/* Header */}
            <div className="inbox-header">
                <div>
                    <h1>
                        <InboxIcon size={24} className="text-primary-400" />
                        Inbox
                    </h1>
                    <p>Auto-detected purchases</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchOrders()}
                >
                    <RefreshCw size={16} />
                </Button>
            </div>

            {/* Info Card */}
            <div className="inbox-info-card feed-card" style={{ padding: '16px' }}>
                <div className="inbox-info-icon">
                    <Sparkles size={20} />
                </div>
                <p>
                    These items were automatically detected from your linked stores or browser extension.
                    Accept them to share on your profile.
                </p>
            </div>

            {/* Orders List */}
            <div className="inbox-list">
                {loading ? (
                    <div className="loading-screen" style={{ minHeight: '200px' }}>
                        <div className="loading-spinner" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state feed-card" style={{ margin: '16px', padding: '40px 24px' }}>
                        <div className="inbox-empty-icon">
                            <InboxIcon size={40} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <h3 style={{ marginBottom: '8px' }}>No new purchases</h3>
                        <p style={{ marginBottom: '24px', maxWidth: '280px' }}>New items will appear here automatically when you shop</p>
                        <button
                            onClick={() => fetchOrders()}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>
                ) : (
                    orders.map(order => (
                        <InboxItem
                            key={order.id}
                            order={order}
                            onAccept={handleAccept}
                            onReject={handleReject}
                        />
                    ))
                )}
            </div>

            {/* Count */}
            {orders.length > 0 && (
                <p className="inbox-count">
                    {orders.length} {orders.length === 1 ? 'item' : 'items'} awaiting confirmation
                </p>
            )}
        </div>
    );
};

export default Inbox;
