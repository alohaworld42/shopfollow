import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Star, ShoppingBag, Plus, ThumbsUp, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '../hooks';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Review {
    id: string;
    productName: string;
    productImage: string;
    storeName: string;
    rating: number;
    comment: string;
    likes: number;
    replies: number;
    createdAt: Date;
    author: {
        name: string;
        avatar: string;
    };
}

const Reviews = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Load reviews from database
    useEffect(() => {
        const loadReviews = async () => {
            if (!isSupabaseConfigured) {
                setLoading(false);
                return;
            }

            try {
                // TODO: Create reviews table and load from DB
                // For now, show empty state
                setReviews([]);
            } catch (err) {
                console.error('Error loading reviews:', err);
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, []);

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const handleStartReview = () => {
        navigate('/purchases');
        showToast('info', 'Select a product to review!');
    };

    const handleLike = (id: string) => {
        showToast('success', 'Liked! ❤️');
    };

    const handleReply = (id: string) => {
        showToast('info', 'Reply feature coming soon!');
    };

    return (
        <div className="feed-container" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div className="inbox-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageCircle size={28} className="text-primary-400" />
                        Discussions
                    </h1>
                    <p>Reviews and chats about products</p>
                </div>
                <button
                    onClick={handleStartReview}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Plus size={18} /> Review
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div className="loading-spinner" />
                </div>
            )}

            {/* Reviews List */}
            {!loading && reviews.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 16px' }}>
                    {reviews.map(review => (
                        <div key={review.id} className="glass-card" style={{ padding: '20px' }}>
                            {/* Author & Time */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <img
                                    src={review.author.avatar}
                                    alt={review.author.name}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                                        {review.author.name}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {timeAgo(review.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px',
                                background: 'var(--bg-glass)',
                                borderRadius: '12px',
                                marginBottom: '16px'
                            }}>
                                <img
                                    src={review.productImage}
                                    alt={review.productName}
                                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                                />
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>
                                        {review.productName}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        {review.storeName}
                                    </p>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={i < review.rating ? 'var(--color-warning)' : 'transparent'}
                                                stroke={i < review.rating ? 'var(--color-warning)' : 'var(--text-muted)'}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Comment */}
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
                                {review.comment}
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => handleLike(review.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ThumbsUp size={16} /> {review.likes}
                                </button>
                                <button
                                    onClick={() => handleReply(review.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <MessageSquare size={16} /> {review.replies}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && reviews.length === 0 && (
                <div className="empty-state glass-card" style={{ margin: '24px 16px', padding: '40px 24px' }}>
                    <div className="empty-state-icon" style={{ marginBottom: '16px' }}>
                        <MessageCircle size={40} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h3 style={{ marginBottom: '8px' }}>Start a Discussion</h3>
                    <p style={{ marginBottom: '24px', maxWidth: '280px' }}>
                        Share your thoughts on products you've purchased.
                    </p>
                    <button
                        onClick={handleStartReview}
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
                        <ShoppingBag size={18} /> Browse Purchases
                    </button>
                </div>
            )}
        </div>
    );
};

export default Reviews;
