import { Check, X, ExternalLink } from 'lucide-react';
import { Card, Badge } from '../common';
import type { StagingOrder } from '../../types';

interface InboxItemProps {
    order: StagingOrder;
    onAccept: (orderId: string) => void;
    onReject: (orderId: string) => void;
}

const InboxItem = ({ order, onAccept, onReject }: InboxItemProps) => {
    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Get primary image from images array
    const primaryImage = order.rawData.images?.[0] || 'https://via.placeholder.com/200';

    return (
        <Card glass padding="none" className="overflow-hidden animate-slide-up">
            <div className="inbox-item">
                {/* Product Image */}
                <img
                    src={primaryImage}
                    alt={order.rawData.name}
                    className="inbox-item-image"
                />

                {/* Product Info */}
                <div className="inbox-item-content">
                    <p className="inbox-item-title">{order.rawData.name}</p>
                    <p className="inbox-item-store">{order.rawData.storeName}</p>
                    <p className="inbox-item-price">
                        {order.rawData.currency || '€'}{order.rawData.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/30 mt-1">{timeAgo(order.createdAt)}</p>

                    {order.rawData.storeUrl && (
                        <a
                            href={order.rawData.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-2"
                        >
                            <ExternalLink className="w-3 h-3" />
                            View in store
                        </a>
                    )}
                </div>

                {/* Actions */}
                <div className="inbox-item-actions">
                    <button
                        onClick={() => onAccept(order.id)}
                        className="inbox-btn inbox-btn-accept"
                        title="Accept and post"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onReject(order.id)}
                        className="inbox-btn inbox-btn-reject"
                        title="Reject"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default InboxItem;
