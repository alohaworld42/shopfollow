import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { Product } from '../../types';

interface FeedCardProps {
    product: Product;
    onLike: (productId: string) => void;
    onSave: (productId: string) => void;
    onComment: () => void;
    onShare?: () => void;
    onClick: () => void;
    onUserClick?: () => void;
    currentUserId?: string;
}

const FeedCard = ({ product, onLike, onSave, onComment, onShare, onClick, onUserClick, currentUserId }: FeedCardProps) => {
    const [imageIndex, setImageIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(currentUserId ? product.saves.includes(currentUserId) : false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    // Get all images
    const images = product.images?.length > 0 ? product.images : [product.imageUrl];
    const hasMultipleImages = images.length > 1;

    const isLiked = currentUserId ? product.likes.includes(currentUserId) : false;

    const handleDoubleTap = () => {
        if (!isLiked) {
            onLike(product.id);
        }
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    };

    const handleShare = async () => {
        const shareUrl = product.affiliateUrl || product.storeUrl;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: `Check out ${product.name} at ${product.storeName}`,
                    url: shareUrl
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
        }
    };

    const handleShopNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = product.affiliateUrl || product.storeUrl;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    return (
        <article className="feed-card">
            {/* Header - Creator info with generous spacing */}
            <div
                className="feed-card-header"
                onClick={(e) => {
                    if (onUserClick) {
                        e.stopPropagation();
                        onUserClick();
                    }
                }}
                style={{ cursor: onUserClick ? 'pointer' : 'default' }}
            >
                <div className="feed-card-user">
                    <img
                        src={product.userAvatar}
                        alt={product.userName}
                        className="feed-card-user-avatar"
                    />
                    <div className="feed-card-user-info">
                        <p className="feed-card-user-name">{product.userName}</p>
                        <span className="feed-card-time">{timeAgo(product.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Image Carousel - Large hero style */}
            <div
                className="feed-card-images"
                onDoubleClick={handleDoubleTap}
                onClick={onClick}
            >
                <div
                    className="feed-card-images-track"
                    style={{ transform: `translateX(-${imageIndex * 100}%)` }}
                >
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`${product.name} ${idx + 1}`}
                            className="feed-card-image"
                            loading="lazy"
                        />
                    ))}
                </div>

                {/* Heart Animation */}
                {showHeartAnimation && (
                    <div className="feed-card-heart-animation">
                        <Heart size={88} fill="white" color="white" />
                    </div>
                )}

                {/* Image Navigation */}
                {hasMultipleImages && (
                    <>
                        <button
                            className="feed-card-image-nav prev"
                            onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex(prev => Math.max(0, prev - 1));
                            }}
                            disabled={imageIndex === 0}
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            className="feed-card-image-nav next"
                            onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex(prev => Math.min(images.length - 1, prev + 1));
                            }}
                            disabled={imageIndex === images.length - 1}
                        >
                            <ChevronRight size={22} />
                        </button>
                        <div className="feed-card-image-indicators">
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`feed-card-image-dot ${idx === imageIndex ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Content - Spacious layout */}
            <div className="feed-card-content">
                <h3 className="feed-card-title">{product.name}</h3>
                <p className="feed-card-store">
                    {product.storeName}
                    {product.hasAffiliateLink && (
                        <span className="feed-card-affiliate-badge">Affiliate</span>
                    )}
                </p>

                <div className="feed-card-price">
                    <span className="feed-card-price-current">
                        {product.currency || '€'}{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                        <span className="feed-card-price-original">
                            {product.currency || '€'}{product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Shop Button - Full width, prominent */}
                <button
                    onClick={handleShopNow}
                    className="feed-card-shop-btn"
                >
                    <ExternalLink size={18} strokeWidth={1.5} />
                    Shop Now
                </button>

                {/* Actions - Subtle row */}
                <div className="feed-card-actions">
                    <button
                        className={`feed-card-action ${isLiked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onLike(product.id); }}
                    >
                        <Heart size={22} strokeWidth={1.5} fill={isLiked ? 'currentColor' : 'none'} />
                        {product.likes.length > 0 && <span>{product.likes.length}</span>}
                    </button>

                    <button
                        className="feed-card-action"
                        onClick={(e) => { e.stopPropagation(); onComment(); }}
                    >
                        <MessageCircle size={22} strokeWidth={1.5} />
                        {product.comments.length > 0 && <span>{product.comments.length}</span>}
                    </button>

                    <button
                        className="feed-card-action"
                        onClick={(e) => { e.stopPropagation(); onShare ? onShare() : handleShare(); }}
                    >
                        <Share2 size={22} strokeWidth={1.5} />
                    </button>

                    <button
                        className={`feed-card-action ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                        style={{ marginLeft: 'auto' }}
                    >
                        {isSaved ? <BookmarkCheck size={22} strokeWidth={1.5} /> : <Bookmark size={22} strokeWidth={1.5} />}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default FeedCard;
