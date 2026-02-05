import { useState, useEffect } from 'react';
import { FeedCard, ProductDetail } from '../components/feed';
import { SkeletonCard } from '../components/common';
import { useAuth, useProducts, useToast } from '../hooks';
import type { Product } from '../types';

const Feed = () => {
    const { user } = useAuth();
    const { products, loading, fetchFeedProducts, toggleLike, toggleSave, addComment } = useProducts();
    const { showToast } = useToast();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

    // Find updated product for detail modal
    const currentProduct = selectedProduct
        ? products.find(p => p.id === selectedProduct.id) || selectedProduct
        : null;

    return (
        <div className="feed-container">
            {/* Feed */}
            {loading ? (
                // Skeleton Loading
                Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))
            ) : products.length === 0 ? (
                // Empty State
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <span style={{ fontSize: '28px' }}>🛍️</span>
                    </div>
                    <h3 className="empty-state-title">Welcome to CartConnect!</h3>
                    <p className="empty-state-text">
                        Follow other users to see their purchases in your feed.
                    </p>
                </div>
            ) : (
                // Products
                products.map(product => (
                    <FeedCard
                        key={product.id}
                        product={product}
                        onLike={handleLike}
                        onSave={toggleSave}
                        onComment={() => handleProductClick(product)}
                        onClick={() => handleProductClick(product)}
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
