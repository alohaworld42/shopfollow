// User Types
export interface User {
    uid: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
    score: number;
    totalEarnings?: number;
    following: string[];
    followers: string[];
    groups: Group[];
    affiliateNetworks?: string[];
    isPrivate: boolean;
    createdAt: Date;
}

export interface Group {
    id: string;
    name: string;
    members: string[];
}

// Product Types
export type Visibility = 'public' | 'private' | 'group';

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: Date;
}

export interface Product {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    name: string;
    description?: string;
    // Support multiple images from scraping
    images: string[];
    // Backward compatibility - primary image
    imageUrl: string;
    price: number;
    originalPrice?: number;
    currency?: string;
    storeName: string;
    storeUrl: string;
    // Affiliate link tracking
    affiliateUrl?: string;
    affiliateNetwork?: string;
    hasAffiliateLink: boolean;
    // Earnings from this product
    clickCount?: number;
    purchaseCount?: number;
    earnings?: number;
    // Metadata
    category?: string;
    brand?: string;
    visibility: Visibility;
    groupId?: string;
    likes: string[];
    comments: Comment[];
    saves: string[];
    createdAt: Date;
}

// Scraped Product Data (from URL scraper)
export interface ScrapedProduct {
    title: string;
    description?: string;
    images: string[];
    price: number;
    originalPrice?: number;
    currency: string;
    storeName: string;
    storeUrl: string;
    category?: string;
    brand?: string;
}

// Staging Order (Inbox) Types
export type OrderStatus = 'pending' | 'accepted' | 'rejected';
export type OrderSource = 'shopify' | 'woocommerce' | 'browser' | 'scraper' | 'manual';

export interface StagingOrder {
    id: string;
    userId: string;
    source: OrderSource;
    rawData: {
        name: string;
        description?: string;
        price: number;
        originalPrice?: number;
        currency?: string;
        storeName: string;
        storeUrl: string;
        images: string[];
        category?: string;
        brand?: string;
    };
    status: OrderStatus;
    createdAt: Date;
}

// Affiliate Types
export interface AffiliateClick {
    id: string;
    productId: string;
    userId: string;
    clickedBy: string;
    clickedAt: Date;
    converted: boolean;
    earnings?: number;
}

export interface EarningsSummary {
    totalClicks: number;
    totalPurchases: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
}

// UI Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// Context Types
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface ToastContextType {
    toasts: Toast[];
    showToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}
