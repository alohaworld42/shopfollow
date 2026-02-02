import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Avatar } from '../common';
import type { Product } from '../../types';

interface FeedCardProps {
    product: Product;
    onLike: (productId: string) => void;
    onComment: () => void;
    onClick: () => void;
    currentUserId?: string;
}

const FeedCard = ({ product, onLike, onComment, onClick, currentUserId }: FeedCardProps) => {
    const [imageIndex, setImageIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    // Get all images (support both single imageUrl and images array)
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

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLike(product.id);
    };

    const handleSaveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSaved(!isSaved);
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
    };

    const handleShopNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = product.affiliateUrl || product.storeUrl;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return `${Math.floor(seconds / 604800)}w`;
    };

    const formatPrice = (price: number, currency = '€') => {
        return `${currency}${price.toFixed(2)}`;
    };

    return (
        <article className="feed-card">
            {/* User Header */}
            <div className="feed-card-header">
                <div className="feed-card-user">
                    <Avatar
                        src={product.userAvatar}
                        alt={product.userName}
                        size="md"
                    />
                    <div>
                        <p className="feed-card-user-name">{product.userName}</p>
                        <p className="feed-card-time">{timeAgo(product.createdAt)}</p>
                    </div>
                </div>
            </div>

            {/* Image Carousel */}
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

                {/* Image Navigation */}
                {hasMultipleImages && (
                    <>
                        <button
                            className="feed-card-image-nav prev"
                            onClick={handlePrevImage}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="feed-card-image-nav next"
                            onClick={handleNextImage}
                        >
                            <ChevronRight size={20} />
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

                {/* Heart Animation */}
                {showHeartAnimation && (
                    <div className="feed-card-heart-animation">
                        <Heart size={80} fill="white" color="white" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="feed-card-content">
                {/* Product Info */}
                <h3 className="feed-card-title">{product.name}</h3>
                <p className="feed-card-store">
                    {product.storeName}
                    {product.hasAffiliateLink && (
                        <span className="feed-card-affiliate-badge">Affiliate</span>
                    )}
                </p>

                {/* Price */}
                <div className="feed-card-price">
                    <span className="feed-card-price-current">
                        {formatPrice(product.price, product.currency)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="feed-card-price-original">
                            {formatPrice(product.originalPrice, product.currency)}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="feed-card-actions">
                    <button
                        onClick={handleLikeClick}
                        className={`feed-card-action ${isLiked ? 'liked' : ''}`}
                    >
                        <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                        <span>{product.likes.length}</span>
                    </button>
                    <button onClick={onComment} className="feed-card-action">
                        <MessageCircle size={22} />
                        <span>{product.comments.length}</span>
                    </button>
                    <button className="feed-card-action">
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={handleSaveClick}
                        className={`feed-card-action ${isSaved ? 'saved' : ''}`}
                    >
                        <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>

                    {/* Shop Now Button */}
                    <button
                        onClick={handleShopNow}
                        className="feed-card-shop-btn"
                    >
                        <ExternalLink size={16} />
                        Shop Now
                    </button>
                </div>
            </div>
        </article>
    );
};

export default FeedCard;
