import { useState } from 'react';
import { Heart, MessageCircle, ExternalLink, Send } from 'lucide-react';
import { Modal } from '../common';
import { useAuth } from '../../hooks';
import type { Product } from '../../types';

interface ProductDetailProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onLike: (productId: string) => void;
    onComment: (productId: string, text: string) => void;
}

const ProductDetail = ({
    product,
    isOpen,
    onClose,
    onLike,
    onComment
}: ProductDetailProps) => {
    const { user } = useAuth();
    const [commentText, setCommentText] = useState('');

    if (!product) return null;

    const isLiked = user ? product.likes.includes(user.uid) : false;

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onComment(product.id, commentText.trim());
        setCommentText('');
    };

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
                {/* Image Section */}
                <div style={{ position: 'relative' }}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                            width: '100%',
                            aspectRatio: '4/5',
                            objectFit: 'cover'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: 'var(--space-4)',
                        right: 'var(--space-4)',
                        background: 'var(--bg-secondary)',
                        backdropFilter: 'blur(10px)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        color: 'white'
                    }}>
                        €{product.price.toFixed(2)}
                    </div>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-4)',
                        padding: 'var(--space-5)',
                        borderBottom: '1px solid var(--border-primary)'
                    }}>
                        <img
                            src={product.userAvatar}
                            alt={product.userName}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <p style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '2px'
                            }}>{product.userName}</p>
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)'
                            }}>{product.storeName}</p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 'var(--space-5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-5)',
                        maxHeight: '240px'
                    }}>
                        {/* Product Description */}
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <img
                                src={product.userAvatar}
                                alt={product.userName}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                            <div>
                                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                    <span style={{ fontWeight: 600 }}>{product.userName}</span>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>{product.name}</span>
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {timeAgo(product.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* Comments List */}
                        {product.comments.map(comment => (
                            <div key={comment.id} style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <img
                                    src={comment.userAvatar}
                                    alt={comment.userName}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div>
                                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                        <span style={{ fontWeight: 600 }}>{comment.userName}</span>{' '}
                                        <span style={{ color: 'var(--text-secondary)' }}>{comment.text}</span>
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {timeAgo(comment.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {product.comments.length === 0 && (
                            <p style={{
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '14px',
                                padding: 'var(--space-6) 0'
                            }}>
                                No comments yet. Be the first!
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{
                        padding: 'var(--space-5)',
                        borderTop: '1px solid var(--border-primary)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-5)',
                            marginBottom: 'var(--space-4)'
                        }}>
                            <button
                                onClick={() => onLike(product.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                <Heart
                                    size={24}
                                    strokeWidth={1.5}
                                    fill={isLiked ? 'var(--color-error)' : 'none'}
                                    color={isLiked ? 'var(--color-error)' : 'var(--text-primary)'}
                                />
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    {product.likes.length}
                                </span>
                            </button>
                            <MessageCircle size={24} strokeWidth={1.5} color="var(--text-primary)" />
                        </div>

                        {/* Shop Button */}
                        <a
                            href={product.affiliateUrl || product.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="feed-card-shop-btn"
                            style={{ textDecoration: 'none', display: 'block' }}
                        >
                            <ExternalLink size={18} />
                            Shop Now
                        </a>

                        {/* Comment Input */}
                        <form
                            onSubmit={handleSubmitComment}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                marginTop: 'var(--space-4)'
                            }}
                        >
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                style={{
                                    flex: 1,
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-3) var(--space-4)',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim()}
                                style={{
                                    padding: 'var(--space-3)',
                                    background: 'none',
                                    border: 'none',
                                    color: commentText.trim() ? 'var(--color-primary)' : 'var(--text-muted)',
                                    cursor: commentText.trim() ? 'pointer' : 'default'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetail;
