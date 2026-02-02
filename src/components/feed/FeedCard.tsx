import { useState } from 'react';
import { Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import { Avatar, Badge } from '../common';
import type { Product } from '../../types';

interface FeedCardProps {
    product: Product;
    onLike: (productId: string) => void;
    onComment: () => void;
    onClick: () => void;
}

const FeedCard = ({ product, onLike, onComment, onClick }: FeedCardProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    const handleDoubleTap = () => {
        if (!isLiked) {
            setIsLiked(true);
            onLike(product.id);
        }
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    };

    const handleLikeClick = () => {
        setIsLiked(!isLiked);
        onLike(product.id);
    };

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'Gerade eben';
        if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
        if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
        return `vor ${Math.floor(seconds / 86400)} Tagen`;
    };

    return (
        <article className="feed-card animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <Avatar
                    src={product.userAvatar}
                    alt={product.userName}
                    size="md"
                />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                        {product.userName}
                    </p>
                    <p className="text-sm text-white/50">{product.storeName}</p>
                </div>
                <span className="text-xs text-white/40">{timeAgo(product.createdAt)}</span>
            </div>

            {/* Image */}
            <div
                className="relative cursor-pointer bg-dark-800"
                onDoubleClick={handleDoubleTap}
                onClick={onClick}
            >
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="feed-card-image"
                    loading="lazy"
                />

                {/* Price Badge */}
                <div className="absolute top-4 right-4">
                    <Badge variant="price">
                        €{product.price.toFixed(0)}
                    </Badge>
                </div>

                {/* Heart Animation */}
                {showHeartAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Heart
                            className="w-24 h-24 text-red-500 fill-current animate-heart-beat drop-shadow-lg"
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="feed-card-content">
                <div className="flex items-center gap-1 mb-3">
                    <button
                        onClick={handleLikeClick}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <Heart
                            className={`w-6 h-6 transition-all ${isLiked ? 'text-red-500 fill-current scale-110' : 'text-white'
                                }`}
                        />
                    </button>
                    <button
                        onClick={onComment}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <Share2 className="w-6 h-6 text-white" />
                    </button>

                    <a
                        href={product.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-5 h-5 text-white/50" />
                    </a>
                </div>

                {/* Likes & Caption */}
                <p className="font-semibold text-white mb-1">
                    {product.likes.length} Gefällt mir
                </p>
                <p className="text-white/80 leading-relaxed">
                    <span className="font-semibold text-white">{product.userName}</span>
                    {' '}
                    {product.name}
                </p>

                {product.comments.length > 0 && (
                    <button
                        onClick={onComment}
                        className="text-white/40 text-sm mt-2 hover:text-white/60 transition-colors"
                    >
                        Alle {product.comments.length} Kommentare anzeigen
                    </button>
                )}
            </div>
        </article>
    );
};

export default FeedCard;
