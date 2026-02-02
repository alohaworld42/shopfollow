import { useEffect } from 'react';
import { Inbox as InboxIcon, Sparkles, RefreshCw } from 'lucide-react';
import { InboxItem } from '../components/inbox';
import { Card, Button, SkeletonList } from '../components/common';
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

        // Create product from order using new images array format
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
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <InboxIcon className="w-6 h-6 text-primary-400" />
                        Inbox
                    </h1>
                    <p className="text-sm text-white/50 mt-1">
                        Auto-detected purchases
                    </p>
                </div>

                {/* Refresh Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchOrders()}
                    className="text-white/50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Info Card */}
            <Card glass padding="sm">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white/70">
                            These items were automatically detected from your linked stores or browser extension.
                            Accept them to share on your profile.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Orders List */}
            <div className="space-y-3">
                {loading ? (
                    <SkeletonList count={3} />
                ) : orders.length === 0 ? (
                    <Card glass className="text-center py-12">
                        <InboxIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <p className="text-white/50">No new purchases</p>
                        <p className="text-sm text-white/30 mt-1">
                            New items will appear here automatically
                        </p>
                    </Card>
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

            {/* Pending Count */}
            {orders.length > 0 && (
                <p className="text-center text-sm text-white/40">
                    {orders.length} {orders.length === 1 ? 'item' : 'items'} awaiting confirmation
                </p>
            )}
        </div>
    );
};

export default Inbox;
