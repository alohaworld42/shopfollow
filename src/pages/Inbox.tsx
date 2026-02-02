import { useEffect } from 'react';
import { Inbox as InboxIcon, Sparkles, RefreshCw } from 'lucide-react';
import { InboxItem } from '../components/inbox';
import { Card, Button, SkeletonList } from '../components/common';
import { useInbox, useProducts, useToast } from '../hooks';

const Inbox = () => {
    const { orders, loading, fetchOrders, acceptOrder, rejectOrder, simulateNewOrder } = useInbox();
    const { createProduct } = useProducts();
    const { showToast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleAccept = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Create product from order
        await createProduct({
            name: order.rawData.name,
            imageUrl: order.rawData.imageUrl,
            price: order.rawData.price,
            storeName: order.rawData.storeName,
            storeUrl: order.rawData.storeUrl,
            visibility: 'public'
        });

        await acceptOrder(orderId);
        showToast('success', 'Produkt wurde gepostet! 🎉');
    };

    const handleReject = async (orderId: string) => {
        await rejectOrder(orderId);
        showToast('info', 'Produkt abgelehnt');
    };

    const handleSimulate = () => {
        simulateNewOrder();
        showToast('info', 'Neues Produkt simuliert! 📦');
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
                        Automatisch erkannte Einkäufe
                    </p>
                </div>

                {/* Simulate Button (for demo) */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSimulate}
                    className="text-white/50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Simulieren
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
                            Diese Items wurden automatisch von deinen verknüpften Shops erkannt.
                            Bestätige sie, um sie in deinem Profil zu teilen.
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
                        <p className="text-white/50">Keine neuen Einkäufe</p>
                        <p className="text-sm text-white/30 mt-1">
                            Neue Items erscheinen hier automatisch
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
                    {orders.length} {orders.length === 1 ? 'Item' : 'Items'} warten auf Bestätigung
                </p>
            )}
        </div>
    );
};

export default Inbox;
