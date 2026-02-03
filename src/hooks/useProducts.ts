import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as productService from '../services/productService';
import type { Product, Visibility } from '../types';

// Demo products disabled for production
const DEMO_PRODUCTS: Product[] = [];

// Demo user products disabled for production
const DEMO_USER_PRODUCTS: Product[] = [];

export const useProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isDemoMode = !isSupabaseConfigured || (user?.uid && (user.uid.startsWith('demo-') || user.uid.startsWith('user-')));

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

        const tempId = crypto.randomUUID();
        const newComment = {
            id: tempId,
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
            try {
                await productService.addComment(productId, user.uid, text);
            } catch (error) {
                // Revert optimistic update
                setProducts(prev => prev.map(p => {
                    if (p.id === productId) {
                        return { ...p, comments: p.comments.filter(c => c.id !== tempId) };
                    }
                    return p;
                }));
                throw error;
            }
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
        category?: string;
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
