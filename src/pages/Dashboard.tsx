import { useState, useEffect } from 'react';
import { Plus, Grid3X3, Bookmark, BarChart2, DollarSign, MousePointer2 } from 'lucide-react';
import { ProductGrid, EditProductModal, ImportProductForm } from '../components/profile';
import { useAuth, useProducts, useToast } from '../hooks';
import { getDashboardStats, type DashboardStats } from '../services/analyticsService';
import type { Product, Visibility } from '../types';

const Dashboard = () => {
    const { user } = useAuth();
    const { products, loading, fetchUserProducts, updateProduct, deleteProduct, createProduct } = useProducts();
    const { showToast } = useToast();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showImportForm, setShowImportForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
    const [stats, setStats] = useState<DashboardStats>({
        earnings: 0,
        clicks: 0,
        orders: 0,
        reach: 0,
        totalProducts: 0,
        totalLikes: 0,
        totalComments: 0,
        followers: 0,
        following: 0
    });

    useEffect(() => {
        if (user) {
            fetchUserProducts(user.uid);
            getDashboardStats(user.uid).then(setStats);
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
        visibility: Visibility;
        groupId?: string;
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
                    {/* Creator Stats Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)',
                        padding: 'var(--space-6)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Business Dashboard
                            </h2>
                            <span style={{
                                fontSize: '13px',
                                color: 'var(--color-success)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '8px'
                            }}>
                                +12% this week
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                            <div style={{ flex: 1, minWidth: '100px', background: 'var(--bg-glass)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                                <div style={{ color: 'var(--color-primary-light)', marginBottom: '8px' }}><DollarSign size={20} /></div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>${stats.earnings.toFixed(0)}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earnings</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '100px', background: 'var(--bg-glass)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                                <div style={{ color: 'var(--color-accent)', marginBottom: '8px' }}><MousePointer2 size={20} /></div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.clicks}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Link Clicks</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '100px', background: 'var(--bg-glass)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                                <div style={{ color: 'var(--color-secondary)', marginBottom: '8px' }}><BarChart2 size={20} /></div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.reach}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mthly Reach</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            <button
                                className="profile-action-btn primary"
                                onClick={() => setShowImportForm(true)}
                            >
                                <Plus size={18} /> Create Post
                            </button>
                            <button className="profile-action-btn secondary">
                                Manage Links
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
