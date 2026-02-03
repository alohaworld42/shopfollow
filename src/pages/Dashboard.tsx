import { useState, useEffect, useMemo } from 'react';
import { Plus, Grid3X3, Bookmark } from 'lucide-react';
import { ProductGrid, EditProductModal, ImportProductForm } from '../components/profile';
import { useAuth, useProducts, useToast } from '../hooks';
import type { Product, Visibility } from '../types';

const Dashboard = () => {
    const { user } = useAuth();
    const { products, loading, fetchUserProducts, updateProduct, deleteProduct, createProduct } = useProducts();
    const { showToast } = useToast();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showImportForm, setShowImportForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

    useEffect(() => {
        if (user) {
            fetchUserProducts(user.uid);
        }
    }, [user, fetchUserProducts]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalSpending = products.reduce((sum, p) => sum + p.price, 0);
        return {
            posts: products.length,
            followers: user?.followers?.length || 0,
            following: user?.following?.length || 0,
            spending: totalSpending
        };
    }, [products, user]);

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
        visibility: Visibility;
        groupId?: string;
    }) => {
        await createProduct(data);
        showToast('success', 'Product added!');
        if (user) {
            fetchUserProducts(user.uid);
        }
    };

    if (!user) {
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
                    {/* Profile Header Card */}
                    <div className="profile-header">
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="profile-avatar"
                        />
                        <h1 className="profile-name">{user.displayName}</h1>
                        <p className="profile-username">@{user.displayName?.toLowerCase().replace(/\s+/g, '_')}</p>
                        <p className="profile-bio">Curating the best finds 🛍️</p>

                        {/* Stats */}
                        <div className="profile-stats">
                            <div className="profile-stat">
                                <span className="profile-stat-value">{stats.posts}</span>
                                <span className="profile-stat-label">Posts</span>
                            </div>
                            <div className="profile-stat">
                                <span className="profile-stat-value">{stats.followers}</span>
                                <span className="profile-stat-label">Followers</span>
                            </div>
                            <div className="profile-stat">
                                <span className="profile-stat-value">{stats.following}</span>
                                <span className="profile-stat-label">Following</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            <button
                                className="profile-action-btn primary"
                                onClick={() => setShowImportForm(true)}
                            >
                                <Plus size={16} /> Add Product
                            </button>
                            <button className="profile-action-btn secondary">
                                Edit Profile
                            </button>
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

                    {/* Product Grid */}
                    <ProductGrid
                        products={products}
                        onProductClick={setSelectedProduct}
                    />

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
