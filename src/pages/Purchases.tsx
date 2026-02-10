import { useEffect } from 'react';
import { ShoppingBag, RefreshCw, AlertCircle } from 'lucide-react';
import { InboxItem } from '../components/inbox';
import { useInbox, useProducts, useToast } from '../hooks';

const Purchases = () => {
    const { orders, loading, fetchOrders, acceptOrder, rejectOrder } = useInbox();
    const { createProduct } = useProducts();
    const { showToast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handlePostProduct = async (orderId: string) => {
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
        showToast('success', 'Product posted to your profile! 🎉');
    };

    const handleDismiss = async (orderId: string) => {
        await rejectOrder(orderId);
        showToast('info', 'Order hidden');
    };

    return (
        <div className="inbox-page">
            {/* Header */}
            <div className="inbox-header">
                <div>
                    <h1>
                        <ShoppingBag size={28} className="text-primary-400" />
                        My Orders
                    </h1>
                    <p>Matches from your shopping activity</p>
                </div>
                <button
                    onClick={() => fetchOrders()}
                    style={{
                        padding: '8px',
                        borderRadius: '50%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Info Card */}
            <div className="inbox-info-card feed-card" style={{ padding: '16px' }}>
                <div className="inbox-info-icon">
                    <AlertCircle size={22} />
                </div>
                <div>
                    <p style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                        Ready to Share
                    </p>
                    <p>
                        These items were detected from your recent shopping.
                        Tap the checkmark to post them to your feed.
                    </p>
                </div>
            </div>

            {/* Orders List */}
            <div className="inbox-list">
                {loading ? (
                    <div className="loading-screen" style={{ minHeight: '200px', background: 'transparent' }}>
                        <div className="loading-spinner" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state feed-card" style={{ margin: '16px', padding: '40px 24px' }}>
                        <div className="empty-state-icon">
                            <ShoppingBag size={40} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <h3 className="empty-state-title" style={{ marginBottom: '8px' }}>No new orders found</h3>
                        <p className="empty-state-text" style={{ marginBottom: '24px', maxWidth: '280px' }}>
                            Make a purchase at a supported store to see it appear here automatically.
                        </p>
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
                            <RefreshCw size={16} /> Check for Orders
                        </button>
                    </div>
                ) : (
                    orders.map(order => (
                        <InboxItem
                            key={order.id}
                            order={order}
                            onAccept={handlePostProduct}
                            onReject={handleDismiss}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Purchases;
