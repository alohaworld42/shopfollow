import { useState, useEffect } from 'react';
import { FeedCard, ProductDetail } from '../components/feed';
import { SkeletonCard } from '../components/common';
import { useAuth, useProducts, useToast } from '../hooks';
import type { Product } from '../types';

const CATEGORIES = ['All', 'Fashion', 'Tech', 'Home', 'Beauty'];

const Feed = () => {
    const { user } = useAuth();
    const { products, loading, fetchFeedProducts, toggleLike, toggleSave, addComment } = useProducts();
    const { showToast } = useToast();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        fetchFeedProducts();
    }, [fetchFeedProducts]);

    const handleLike = (productId: string) => {
        toggleLike(productId);
    };

    const handleComment = (productId: string, text: string) => {
        addComment(productId, text);
        showToast('success', 'Comment added!');
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleShare = (product: Product) => {
        const shareUrl = `${window.location.origin}/product/${product.id}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('success', 'Link copied to clipboard! 📋');
    };

    // Filter products by category
    const filteredProducts = activeCategory === 'All'
        ? products
        : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

    // Find updated product for detail modal
    const currentProduct = selectedProduct
        ? products.find(p => p.id === selectedProduct.id) || selectedProduct
        : null;

    return (
        <div className="feed-container">
            {/* Category Filters */}
            <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '16px',
                marginBottom: '8px',
                scrollbarWidth: 'none'
            }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            background: activeCategory === cat
                                ? 'var(--color-primary)'
                                : 'var(--bg-secondary)',
                            color: activeCategory === cat
                                ? 'white'
                                : 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Feed */}
            {loading ? (
                // Skeleton Loading
                Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))
            ) : filteredProducts.length === 0 ? (
                // Empty State
                <div className="empty-state" style={{ margin: '16px', padding: '40px 24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <div className="empty-state-icon">
                        <span style={{ fontSize: '40px' }}>🛍️</span>
                    </div>
                    <h3 className="empty-state-title" style={{ marginBottom: '8px' }}>
                        {activeCategory === 'All' ? 'Welcome to ShopFollow!' : `No ${activeCategory} products yet`}
                    </h3>
                    <p className="empty-state-text" style={{ maxWidth: '280px' }}>
                        {activeCategory === 'All'
                            ? 'Follow other users to see their purchases in your feed.'
                            : 'Check back later or browse other categories.'
                        }
                    </p>
                </div>
            ) : (
                // Products
                filteredProducts.map(product => (
                    <FeedCard
                        key={product.id}
                        product={product}
                        onLike={handleLike}
                        onSave={toggleSave}
                        onComment={() => handleProductClick(product)}
                        onShare={() => handleShare(product)}
                        onClick={() => handleProductClick(product)}
                        onUserClick={() => showToast('info', 'User profiles coming soon!')}
                        currentUserId={user?.uid}
                    />
                ))
            )}

            {/* Product Detail Modal */}
            <ProductDetail
                product={currentProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onLike={handleLike}
                onComment={handleComment}
            />
        </div>
    );
};

export default Feed;
