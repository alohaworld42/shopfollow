// User Types
export interface User {
    uid: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    score: number;
    following: string[];
    followers: string[];
    groups: Group[];
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
    imageUrl: string;
    price: number;
    storeName: string;
    storeUrl: string;
    visibility: Visibility;
    groupId?: string;
    likes: string[];
    comments: Comment[];
    createdAt: Date;
}

// Staging Order (Inbox) Types
export type OrderStatus = 'pending' | 'accepted' | 'rejected';

export interface StagingOrder {
    id: string;
    userId: string;
    rawData: {
        name: string;
        price: number;
        storeName: string;
        storeUrl: string;
        imageUrl: string;
    };
    status: OrderStatus;
    createdAt: Date;
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
    updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface ToastContextType {
    toasts: Toast[];
    showToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}
