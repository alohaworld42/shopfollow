import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as productService from '../services/productService';
import type { Product, Visibility } from '../types';

// Demo products for development with multiple images and affiliate links
const DEMO_PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        userId: 'user-2',
        userName: 'Sarah Miller',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        name: 'Designer Sneakers Limited Edition',
        images: [
            'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80',
        price: 289.00,
        originalPrice: 350.00,
        currency: '€',
        storeName: 'Nike',
        storeUrl: 'https://nike.com',
        affiliateUrl: 'https://nike.com?ref=cartconnect',
        hasAffiliateLink: true,
        visibility: 'public',
        likes: ['demo-user-1', 'user-3', 'user-4'],
        comments: [
            { id: 'c1', userId: 'user-3', userName: 'Max', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max', text: 'These are amazing! 🔥', createdAt: new Date() }
        ],
        saves: ['user-3'],
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
        id: 'prod-2',
        userId: 'user-3',
        userName: 'Max Weber',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
        name: 'Premium Leather Crossbody Bag',
        images: [
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
        price: 245.00,
        currency: '€',
        storeName: 'Farfetch',
        storeUrl: 'https://farfetch.com',
        affiliateUrl: 'https://farfetch.com?ref=cartconnect',
        hasAffiliateLink: true,
        visibility: 'public',
        likes: ['user-2', 'demo-user-1'],
        comments: [],
        saves: ['demo-user-1', 'user-2'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
        id: 'prod-3',
        userId: 'user-2',
        userName: 'Sarah Miller',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        name: 'Apple AirPods Pro 2nd Gen',
        images: [
            'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
        price: 279.00,
        currency: '€',
        storeName: 'Apple',
        storeUrl: 'https://apple.com',
        hasAffiliateLink: false,
        visibility: 'public',
        likes: ['demo-user-1', 'user-3', 'user-4', 'user-5'],
        comments: [
            { id: 'c2', userId: 'demo-user-1', userName: 'Alex', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1', text: 'Best sound quality! 🎵', createdAt: new Date() }
        ],
        saves: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
    },
    {
        id: 'prod-4',
        userId: 'user-4',
        userName: 'Emma Schmidt',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
        name: 'Minimalist Gold Watch',
        images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
            'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        price: 320.00,
        originalPrice: 400.00,
        currency: '€',
        storeName: 'Nordstrom',
        storeUrl: 'https://nordstrom.com',
        affiliateUrl: 'https://nordstrom.com?ref=cartconnect',
        hasAffiliateLink: true,
        visibility: 'public',
        likes: ['demo-user-1'],
        comments: [],
        saves: ['user-2'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
    {
        id: 'prod-5',
        userId: 'user-5',
        userName: 'Luca Fischer',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luca',
        name: 'Vintage Denim Jacket',
        images: [
            'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80',
            'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&q=80',
            'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800&q=80'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80',
        price: 89.00,
        currency: '€',
        storeName: 'ASOS',
        storeUrl: 'https://asos.com',
        affiliateUrl: 'https://asos.com?ref=cartconnect',
        hasAffiliateLink: true,
        visibility: 'public',
        likes: ['user-2', 'user-3'],
        comments: [],
        saves: ['demo-user-1'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
    }
];

// Demo user products
const DEMO_USER_PRODUCTS: Product[] = [
    {
        id: 'my-prod-1',
        userId: 'demo-user-1',
        userName: 'Alex Demo',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1',
        name: 'Smart Home Hub',
        images: ['https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=80'],
        imageUrl: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=80',
        price: 129.00,
        currency: '€',
        storeName: 'Google Store',
        storeUrl: 'https://store.google.com',
        hasAffiliateLink: false,
        visibility: 'public',
        likes: ['user-2', 'user-3'],
        comments: [],
        saves: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
    },
    {
        id: 'my-prod-2',
        userId: 'demo-user-1',
        userName: 'Alex Demo',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1',
        name: 'Premium Travel Backpack',
        images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=80'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        price: 189.00,
        originalPrice: 229.00,
        currency: '€',
        storeName: 'Herschel',
        storeUrl: 'https://herschel.com',
        affiliateUrl: 'https://herschel.com?ref=cartconnect',
        hasAffiliateLink: true,
        visibility: 'private',
        likes: [],
        comments: [],
        saves: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    },
    {
        id: 'my-prod-3',
        userId: 'demo-user-1',
        userName: 'Alex Demo',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1',
        name: 'Running Shoes Ultra Boost',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        price: 179.00,
        currency: '€',
        storeName: 'Adidas',
        storeUrl: 'https://adidas.com',
        hasAffiliateLink: false,
        visibility: 'group',
        groupId: 'group-1',
        likes: ['user-2'],
        comments: [],
        saves: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
    }
];

export const useProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isDemoMode = !isSupabaseConfigured;

    // Fetch feed products
    const fetchFeedProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                await new Promise(r => setTimeout(r, 500));
                setProducts(DEMO_PRODUCTS);
            } else {
                const data = await productService.getFeedProducts(user?.uid);
                setProducts(data);
            }
        } catch {
            setError('Error loading products');
        } finally {
            setLoading(false);
        }
    }, [isDemoMode, user]);

    // Fetch user's own products
    const fetchUserProducts = useCallback(async (userId?: string) => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                await new Promise(r => setTimeout(r, 300));
                setProducts(userId === 'demo-user-1' || !userId ? DEMO_USER_PRODUCTS : []);
            } else if (userId) {
                const data = await productService.getUserProducts(userId);
                setProducts(data);
            }
        } catch {
            setError('Error loading products');
        } finally {
            setLoading(false);
        }
    }, [isDemoMode]);

    // Toggle like
    const toggleLike = useCallback(async (productId: string) => {
        if (!user) return;

        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const isLiked = p.likes.includes(user.uid);
                return {
                    ...p,
                    likes: isLiked
                        ? p.likes.filter(id => id !== user.uid)
                        : [...p.likes, user.uid]
                };
            }
            return p;
        }));

        if (!isDemoMode) {
            await productService.toggleLike(productId, user.uid);
        }
    }, [user, isDemoMode]);

    // Add comment
    const addComment = useCallback(async (productId: string, text: string) => {
        if (!user) return;

        const newComment = {
            id: crypto.randomUUID(),
            userId: user.uid,
            userName: user.displayName,
            userAvatar: user.avatarUrl,
            text,
            createdAt: new Date()
        };

        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return { ...p, comments: [...p.comments, newComment] };
            }
            return p;
        }));

        if (!isDemoMode) {
            await productService.addComment(productId, user.uid, text);
        }
    }, [user, isDemoMode]);

    // Create product
    const createProduct = useCallback(async (data: {
        name: string;
        images: string[];
        price: number;
        originalPrice?: number;
        currency?: string;
        storeName: string;
        storeUrl: string;
        affiliateUrl?: string;
        visibility: Visibility;
        groupId?: string;
    }) => {
        if (!user) return;

        const newProduct: Product = {
            id: crypto.randomUUID(),
            userId: user.uid,
            userName: user.displayName,
            userAvatar: user.avatarUrl,
            imageUrl: data.images[0] || '',
            hasAffiliateLink: !!data.affiliateUrl,
            ...data,
            likes: [],
            comments: [],
            saves: [],
            createdAt: new Date()
        };

        if (isDemoMode) {
            DEMO_USER_PRODUCTS.unshift(newProduct);
            setProducts(prev => [newProduct, ...prev]);
        } else {
            await productService.createProduct({
                userId: user.uid,
                userName: user.displayName,
                userAvatar: user.avatarUrl,
                imageUrl: data.images[0] || '',
                hasAffiliateLink: !!data.affiliateUrl,
                ...data
            });
        }

        return newProduct.id;
    }, [user, isDemoMode]);

    // Update product
    const updateProduct = useCallback(async (
        productId: string,
        data: { visibility?: Visibility; groupId?: string }
    ) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return { ...p, ...data };
            }
            return p;
        }));

        if (!isDemoMode) {
            await productService.updateProduct(productId, data);
        }
    }, [isDemoMode]);

    // Delete product
    const deleteProduct = useCallback(async (productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));

        if (!isDemoMode) {
            await productService.deleteProduct(productId);
        }
    }, [isDemoMode]);

    return {
        products,
        loading,
        error,
        fetchFeedProducts,
        fetchUserProducts,
        toggleLike,
        addComment,
        createProduct,
        updateProduct,
        deleteProduct
    };
};

export default useProducts;
