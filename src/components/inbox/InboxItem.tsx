import { Check, X, ExternalLink } from 'lucide-react';
import { Card, Badge, Button } from '../common';
import type { StagingOrder } from '../../types';

interface InboxItemProps {
    order: StagingOrder;
    onAccept: (orderId: string) => void;
    onReject: (orderId: string) => void;
}

const InboxItem = ({ order, onAccept, onReject }: InboxItemProps) => {
    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'Gerade eben';
        if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
        if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
        return `vor ${Math.floor(seconds / 86400)} Tagen`;
    };

    return (
        <Card glass padding="none" className="overflow-hidden animate-slide-up">
            <div className="flex gap-4 p-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                    <img
                        src={order.rawData.imageUrl}
                        alt={order.rawData.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1">
                        <Badge variant="price" size="sm">
                            €{order.rawData.price.toFixed(0)}
                        </Badge>
                    </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{order.rawData.name}</p>
                    <p className="text-sm text-white/50">{order.rawData.storeName}</p>
                    <p className="text-xs text-white/30 mt-1">{timeAgo(order.createdAt)}</p>

                    <a
                        href={order.rawData.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-2"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Im Shop ansehen
                    </a>
                </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-white/10">
                <button
                    onClick={() => onReject(order.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                    <span className="text-sm font-medium">Ablehnen</span>
                </button>
                <div className="w-px bg-white/10" />
                <button
                    onClick={() => onAccept(order.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-green-400 hover:bg-green-500/10 transition-colors"
                >
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Posten</span>
                </button>
            </div>
        </Card>
    );
};

export default InboxItem;
