import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as productService from '../services/productService';
import type { Product, Visibility } from '../types';

// Demo products for development
const DEMO_PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        userId: 'user-2',
        userName: 'Sarah Miller',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        name: 'Designer Sneakers Limited Edition',
        imageUrl: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80',
        price: 289.00,
        storeName: 'Nike',
        storeUrl: 'https://nike.com',
        visibility: 'public',
        likes: ['demo-user-1', 'user-3'],
        comments: [
            { id: 'c1', userId: 'user-3', userName: 'Max', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max', text: 'Diese sind unglaublich! 🔥', createdAt: new Date() }
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
        id: 'prod-2',
        userId: 'user-3',
        userName: 'Max Weber',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
        name: 'Vintage Polaroid Kamera',
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
        price: 149.00,
        storeName: 'eBay',
        storeUrl: 'https://ebay.com',
        visibility: 'public',
        likes: ['user-2'],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
        id: 'prod-3',
        userId: 'user-2',
        userName: 'Sarah Miller',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        name: 'Premium Wireless Earbuds',
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
        price: 199.00,
        storeName: 'Apple',
        storeUrl: 'https://apple.com',
        visibility: 'public',
        likes: ['demo-user-1', 'user-3', 'user-4'],
        comments: [
            { id: 'c2', userId: 'demo-user-1', userName: 'Alex', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1', text: 'Beste Soundqualität! 🎵', createdAt: new Date() }
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
    },
    {
        id: 'prod-4',
        userId: 'user-4',
        userName: 'Emma Schmidt',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
        name: 'Minimalist Gold Watch',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        price: 320.00,
        storeName: 'Nordstrom',
        storeUrl: 'https://nordstrom.com',
        visibility: 'public',
        likes: ['demo-user-1'],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
    {
        id: 'prod-5',
        userId: 'user-5',
        userName: 'Luca Fischer',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luca',
        name: 'Mechanical Keyboard RGB',
        imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80',
        price: 159.00,
        storeName: 'Amazon',
        storeUrl: 'https://amazon.com',
        visibility: 'public',
        likes: [],
        comments: [],
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
        imageUrl: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=80',
        price: 129.00,
        storeName: 'Google Store',
        storeUrl: 'https://store.google.com',
        visibility: 'public',
        likes: ['user-2', 'user-3'],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
    },
    {
        id: 'my-prod-2',
        userId: 'demo-user-1',
        userName: 'Alex Demo',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1',
        name: 'Premium Backpack',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        price: 89.00,
        storeName: 'Herschel',
        storeUrl: 'https://herschel.com',
        visibility: 'private',
        likes: [],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    },
    {
        id: 'my-prod-3',
        userId: 'demo-user-1',
        userName: 'Alex Demo',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1',
        name: 'Running Shoes Pro',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        price: 179.00,
        storeName: 'Adidas',
        storeUrl: 'https://adidas.com',
        visibility: 'group',
        groupId: 'group-1',
        likes: ['user-2'],
        comments: [],
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
                // Simulate network delay
                await new Promise(r => setTimeout(r, 500));
                setProducts(DEMO_PRODUCTS);
            } else {
                const data = await productService.getFeedProducts(user?.uid);
                setProducts(data);
            }
        } catch {
            setError('Fehler beim Laden der Produkte');
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
            setError('Fehler beim Laden der Produkte');
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
        imageUrl: string;
        price: number;
        storeName: string;
        storeUrl: string;
        visibility: Visibility;
        groupId?: string;
    }) => {
        if (!user) return;

        const newProduct: Product = {
            id: crypto.randomUUID(),
            userId: user.uid,
            userName: user.displayName,
            userAvatar: user.avatarUrl,
            ...data,
            likes: [],
            comments: [],
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
