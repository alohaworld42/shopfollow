import { useState } from 'react';
import { Heart, MessageCircle, ExternalLink, Send } from 'lucide-react';
import { Modal, Avatar, Badge, Button } from '../common';
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
        if (seconds < 60) return 'Jetzt';
        if (seconds < 3600) return `vor ${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)}h`;
        return `vor ${Math.floor(seconds / 86400)}d`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex flex-col md:flex-row max-h-[85vh]">
                {/* Image Section */}
                <div className="md:w-1/2 relative">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full aspect-4-5 md:aspect-auto md:h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                        <Badge variant="price" size="md">
                            €{product.price.toFixed(2)}
                        </Badge>
                    </div>
                </div>

                {/* Details Section */}
                <div className="md:w-1/2 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-white/10">
                        <Avatar src={product.userAvatar} alt={product.userName} size="md" />
                        <div className="flex-1">
                            <p className="font-semibold text-white">{product.userName}</p>
                            <p className="text-xs text-white/50">{product.storeName}</p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64 md:max-h-none">
                        {/* Product Description */}
                        <div className="flex gap-3">
                            <Avatar src={product.userAvatar} alt={product.userName} size="sm" />
                            <div>
                                <p className="text-sm text-white">
                                    <span className="font-semibold">{product.userName}</span>{' '}
                                    <span className="text-white/80">{product.name}</span>
                                </p>
                                <p className="text-xs text-white/50 mt-1">{timeAgo(product.createdAt)}</p>
                            </div>
                        </div>

                        {/* Comments List */}
                        {product.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar src={comment.userAvatar} alt={comment.userName} size="sm" />
                                <div>
                                    <p className="text-sm text-white">
                                        <span className="font-semibold">{comment.userName}</span>{' '}
                                        <span className="text-white/80">{comment.text}</span>
                                    </p>
                                    <p className="text-xs text-white/50 mt-1">{timeAgo(comment.createdAt)}</p>
                                </div>
                            </div>
                        ))}

                        {product.comments.length === 0 && (
                            <p className="text-center text-white/40 text-sm py-8">
                                Noch keine Kommentare. Sei der Erste!
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => onLike(product.id)}
                                className="flex items-center gap-1.5"
                            >
                                <Heart
                                    className={`w-6 h-6 transition-all ${isLiked
                                            ? 'text-red-500 fill-red-500'
                                            : 'text-white hover:text-red-400'
                                        }`}
                                />
                                <span className="text-sm text-white/70">{product.likes.length}</span>
                            </button>
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>

                        {/* Shop Button */}
                        <a
                            href={product.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                        >
                            <Button variant="primary" className="w-full">
                                <ExternalLink className="w-4 h-4" />
                                Zum Shop
                            </Button>
                        </a>

                        {/* Comment Input */}
                        <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-4">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Kommentar hinzufügen..."
                                className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/40 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim()}
                                className="p-2 text-primary-400 disabled:text-white/20 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetail;
