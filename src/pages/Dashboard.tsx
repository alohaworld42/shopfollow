import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Grid3X3, Bookmark } from 'lucide-react';
import { ProductGrid, EditProductModal, ImportProductForm } from '../components/profile';
import { useAuth, useProducts, useToast } from '../hooks';
import type { Product, Visibility } from '../types';

const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { products, loading, fetchUserProducts, updateProduct, deleteProduct, createProduct } = useProducts();
    const { showToast } = useToast();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showImportForm, setShowImportForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/welcome', { replace: true });
        }
    }, [authLoading, user, navigate]);

    useEffect(() => {
        if (user) {
            fetchUserProducts(user.uid);
        }
    }, [user, fetchUserProducts]);

    const handleUpdateVisibility = (productId: string, data: { visibility: Visibility; groupId?: string }) => {
        updateProduct(productId, data);
        showToast('success', 'Visibility updated');
    };

    const handleDeleteProduct = (productId: string) => {
        deleteProduct(productId);
        showToast('info', 'Product deleted');
    };

    const handleImportProduct = async (data: {
        name: string;
        images: string[];
        price: number;
        storeName: string;
        storeUrl: string;
        category?: string;
        categoryId?: string;
        visibility: Visibility;
        groupId?: string;
        affiliateUrl?: string;
    }) => {
        try {
            await createProduct(data);
            showToast('success', 'Product added!');
            if (user) {
                fetchUserProducts(user.uid);
            }
            setShowImportForm(false);
        } catch (error) {
            console.error('Failed to create product:', error);
            showToast('error', (error as Error).message || 'Failed to create product');
            throw error; // Re-throw so form stays open
        }
    };

    if (authLoading || !user) {
        return (
            <div className="loading-screen" style={{ minHeight: '50vh' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="profile-page">
            {loading ? (
                <div className="loading-screen" style={{ minHeight: '50vh' }}>
                    <div className="loading-spinner" />
                </div>
            ) : (
                <>
                    {/* Creator Stats Card */}
                    <div className="feed-card" style={{
                        padding: 'var(--space-6)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                My Products
                            </h2>
                            <span style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-secondary)',
                                padding: '4px 8px',
                                borderRadius: '8px'
                            }}>
                                {products.length} items
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            <button
                                className="profile-action-btn primary"
                                onClick={() => setShowImportForm(true)}
                            >
                                <Plus size={18} /> Create Post
                            </button>
                        </div>
                    </div>

                    {/* Profile Minimal Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                        <img src={user.avatarUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--color-primary)' }} />
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.displayName}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{user.displayName?.toLowerCase().replace(/\s+/g, '_')}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="profile-tabs">
                        <button
                            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            <Grid3X3 size={16} /> Posts
                        </button>
                        <button
                            className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
                            onClick={() => setActiveTab('saved')}
                        >
                            <Bookmark size={16} /> Saved
                        </button>
                    </div>

                    {/* Product Grid or Empty State */}
                    {products.length === 0 ? (
                        <div className="empty-state feed-card" style={{ margin: '24px 16px', padding: '40px 24px' }}>
                            <div className="empty-state-icon" style={{ marginBottom: '16px' }}>
                                <Plus size={40} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <h3 style={{ marginBottom: '8px' }}>Start Sharing</h3>
                            <p style={{ marginBottom: '24px', maxWidth: '280px' }}>
                                Add your first product to start earning from your recommendations.
                            </p>
                            <button
                                className="profile-action-btn primary"
                                onClick={() => setShowImportForm(true)}
                                style={{ minWidth: '180px' }}
                            >
                                <Plus size={18} /> Add First Product
                            </button>
                        </div>
                    ) : (
                        <ProductGrid
                            products={products}
                            onProductClick={setSelectedProduct}
                        />
                    )}

                    {/* Edit Product Modal */}
                    <EditProductModal
                        product={selectedProduct}
                        isOpen={!!selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        onUpdate={handleUpdateVisibility}
                        onDelete={handleDeleteProduct}
                        groups={user.groups}
                    />

                    {/* Import Product Form */}
                    <ImportProductForm
                        isOpen={showImportForm}
                        onClose={() => setShowImportForm(false)}
                        onSubmit={handleImportProduct}
                        groups={user.groups}
                    />
                </>
            )}
        </div>
    );
};

export default Dashboard;
