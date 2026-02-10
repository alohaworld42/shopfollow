import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search as SearchIcon, TrendingUp, Sparkles, UserPlus, Store } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useProducts, useAuth } from '../hooks';
import { FeedCard } from '../components/feed';
import { UserCard } from '../components/network';
import * as searchService from '../services/searchService';
import { toggleSave as toggleSaveService, toggleLike as toggleLikeService } from '../services/productService';
import type { Product, User } from '../types';

// Demo users disabled - using real Supabase data
const DEMO_USERS: User[] = [];

const Search = () => {
    const { user } = useAuth();
    const { products: demoProducts, fetchFeedProducts } = useProducts();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'people'>('products');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [userResults, setUserResults] = useState<User[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const isDemoMode = !isSupabaseConfigured;

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    // Load trending products on mount or category change
    useEffect(() => {
        if (isDemoMode) {
            fetchFeedProducts();
        } else {
            // If we have a category but no search term, fetch trending for that category
            searchService.getTrendingProducts(selectedCategory, 20).then(setTrendingProducts);
        }
    }, [isDemoMode, fetchFeedProducts, selectedCategory]);

    // Debounced search
    const handleSearch = useCallback(async (query: string, category: string | null) => {
        if (!query.trim() && !category) {
            setSearchResults([]);
            setUserResults([]);
            return;
        }

        setLoading(true);
        try {
            if (isDemoMode) {
                // Demo mode filtering
                if (activeTab === 'products') {
                    const filtered = demoProducts.filter(p => {
                        const matchesText = p.name.toLowerCase().includes(query.toLowerCase()) ||
                            p.storeName.toLowerCase().includes(query.toLowerCase());
                        return matchesText;
                    });
                    setSearchResults(filtered);
                } else {
                    const filtered = DEMO_USERS.filter(u =>
                        u.displayName.toLowerCase().includes(query.toLowerCase())
                    );
                    setUserResults(filtered);
                }
            } else {
                // Real search
                if (activeTab === 'products') {
                    const results = await searchService.searchProducts(query, category); // Support category
                    setSearchResults(results);
                } else {
                    const results = await searchService.searchUsers(query);
                    setUserResults(results);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [isDemoMode, activeTab, demoProducts]);

    // Trigger search on term change or category change
    useEffect(() => {
        const timer = setTimeout(() => {
            // Don't auto-search if empty query AND empty category (unless browsing trending)
            if (searchTerm || selectedCategory) {
                handleSearch(searchTerm, selectedCategory);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedCategory, handleSearch]);

    const handleCategoryClick = (cat: string) => {
        if (selectedCategory === cat) {
            setSelectedCategory(null); // toggle off
        } else {
            setSelectedCategory(cat);
        }
    };

    const finalDisplayProducts = (searchTerm || selectedCategory) ? searchResults : trendingProducts;

    const categories = ['Fashion', 'Beauty', 'Home', 'Fitness', 'Family', 'Sale'];

    const handleSave = async (productId: string) => {
        if (!user) return;

        const updateList = (list: Product[]) => list.map(p => {
            if (p.id === productId) {
                const isSaved = p.saves.includes(user.uid);
                return {
                    ...p,
                    saves: isSaved ? p.saves.filter(id => id !== user.uid) : [...p.saves, user.uid]
                };
            }
            return p;
        });

        setSearchResults(prev => updateList(prev));
        setTrendingProducts(prev => updateList(prev));

        if (!isDemoMode) {
            await toggleSaveService(productId, user.uid);
        }
    };

    const handleLike = async (productId: string) => {
        if (!user) return;

        const updateList = (list: Product[]) => list.map(p => {
            if (p.id === productId) {
                const isLiked = p.likes.includes(user.uid);
                return {
                    ...p,
                    likes: isLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid]
                };
            }
            return p;
        });

        setSearchResults(prev => updateList(prev));
        setTrendingProducts(prev => updateList(prev));

        if (!isDemoMode) {
            await toggleLikeService(productId, user.uid);
        }
    };

    return (
        <div className="feed-container">
            {/* Search Bar */}
            <div style={{ position: 'sticky', top: '72px', padding: '0 2px', zIndex: 10 }}>
                <div style={{
                    position: 'relative',
                    borderRadius: '16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <SearchIcon
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder={activeTab === 'products' ? "Find brands, items..." : "Find people..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            height: '52px',
                            padding: '0 16px 0 52px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Sub-tabs for Find context */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: activeTab === 'products' ? 'var(--bg-secondary)' : 'transparent',
                        borderRadius: '12px',
                        border: activeTab === 'products' ? '1px solid var(--border-primary)' : 'none',
                        color: activeTab === 'products' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <Store size={16} /> Shop
                </button>
                <button
                    onClick={() => setActiveTab('people')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: activeTab === 'people' ? 'var(--bg-secondary)' : 'transparent',
                        borderRadius: '12px',
                        border: activeTab === 'people' ? '1px solid var(--border-primary)' : 'none',
                        color: activeTab === 'people' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <UserPlus size={16} /> People
                </button>
            </div>

            {/* Categories - Only show for Products tab */}
            {activeTab === 'products' && (
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    marginTop: '12px'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '24px',
                                background: selectedCategory === cat ? 'var(--color-primary)' : 'var(--bg-card)',
                                border: selectedCategory === cat ? 'none' : '1px solid var(--border-primary)',
                                color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Trending Header - Only if no specific search/filter active */}
            {!searchTerm && !selectedCategory && activeTab === 'products' && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px'
                }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <TrendingUp size={20} className="text-primary-400" />
                        Trending Now
                    </h2>
                </div>
            )}

            {/* Category Header - If category selected */}
            {!searchTerm && selectedCategory && activeTab === 'products' && (
                <div style={{ marginTop: '16px' }}>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>
                        {selectedCategory}
                    </h2>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="loading-screen" style={{ minHeight: '200px', background: 'transparent' }}>
                    <div className="loading-spinner" />
                </div>
            )}

            {/* Results Grid / Feed */}
            {!loading && activeTab === 'products' ? (
                <div style={{ display: 'grid', gap: 'var(--card-gap)', marginTop: '16px' }}>
                    {finalDisplayProducts.map(product => (
                        <FeedCard
                            key={product.id}
                            product={product}
                            onLike={() => handleLike(product.id)}
                            onSave={() => handleSave(product.id)}
                            onComment={() => { }}
                            onClick={() => { }}
                            currentUserId={user?.uid}
                        />
                    ))}
                    {finalDisplayProducts.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Sparkles size={32} />
                            </div>
                            <h3>No items found</h3>
                            <p>Try searching for specific brands like "Nike" or "Sephora".</p>
                        </div>
                    )}
                </div>
            ) : !loading && activeTab === 'people' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: '16px' }}>
                    {userResults.length > 0 ? (
                        userResults.map(u => (
                            <UserCard
                                key={u.uid}
                                user={u}
                                isFollowing={user?.following?.includes(u.uid) || false}
                                onFollow={() => { }}
                                onUnfollow={() => { }}
                            />
                        ))
                    ) : searchTerm ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <UserPlus size={32} />
                            </div>
                            <h3>No users found</h3>
                            <p>Try searching for a different name.</p>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <UserPlus size={32} />
                            </div>
                            <h3>Find Friends</h3>
                            <p>Search for people to follow and see their shopping activity.</p>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default Search;
