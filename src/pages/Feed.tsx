import { useState, useEffect } from 'react';
import { FeedCard, ProductDetail } from '../components/feed';
import { SkeletonCard } from '../components/common';
import { useProducts, useToast } from '../hooks';
import type { Product } from '../types';

const Feed = () => {
    const { products, loading, fetchFeedProducts, toggleLike, addComment } = useProducts();
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
        showToast('success', 'Kommentar hinzugefügt!');
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
    };

    // Find updated product for detail modal
    const currentProduct = selectedProduct
        ? products.find(p => p.id === selectedProduct.id) || selectedProduct
        : null;

    return (
        <div className="py-2">
            {/* Feed */}
            {loading ? (
                // Skeleton Loading
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                // Empty State
                <div className="text-center py-16 px-4">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                        <span className="text-4xl">🛍️</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Willkommen bei CartConnect!</h2>
                    <p className="text-white/50 max-w-xs mx-auto leading-relaxed">
                        Folge anderen Nutzern, um ihre Einkäufe in deinem Feed zu sehen.
                    </p>
                </div>
            ) : (
                // Products
                <div>
                    {products.map(product => (
                        <FeedCard
                            key={product.id}
                            product={product}
                            onLike={handleLike}
                            onComment={() => setSelectedProduct(product)}
                            onClick={() => handleProductClick(product)}
                        />
                    ))}
                </div>
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
