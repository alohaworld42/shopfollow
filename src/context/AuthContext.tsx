import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    signIn as authSignIn,
    signUp as authSignUp,
    signOut as authSignOut,
    getCurrentUser,
    onAuthStateChange,
    updateProfile as authUpdateProfile,
    getFollowers,
    getFollowing,
    Profile
} from '../services/authService';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

// Convert Profile to User type
function profileToUser(profile: Profile, followers: string[] = [], following: string[] = []): User {
    return {
        uid: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        score: profile.score,
        following,
        followers,
        groups: [],
        createdAt: profile.createdAt
    };
}

// Demo user for demo mode
const DEMO_USER: User = {
    uid: 'demo-user-1',
    email: 'demo@cartconnect.app',
    displayName: 'Alex Demo',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user-1',
    score: 1250,
    following: ['user-2', 'user-3'],
    followers: ['user-2', 'user-4', 'user-5'],
    groups: [
        { id: 'group-1', name: 'Familie', members: ['user-2', 'user-3'] },
        { id: 'group-2', name: 'Beste Freunde', members: ['user-4', 'user-5'] }
    ],
    createdAt: new Date()
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If Supabase is not configured, we're in demo-capable mode
        // but we DON'T auto-login - user must explicitly choose demo
        if (!isSupabaseConfigured) {
            console.log('🎭 Demo Mode Available - Supabase not configured');
            setLoading(false);
            return;
        }

        // Check for existing session
        getCurrentUser().then(async (profile) => {
            if (profile) {
                const followers = await getFollowers(profile.id);
                const following = await getFollowing(profile.id);
                setUser(profileToUser(profile, followers, following));
            }
            setLoading(false);
        });

        // Subscribe to auth changes
        const { unsubscribe } = onAuthStateChange(async (profile) => {
            if (profile) {
                const followers = await getFollowers(profile.id);
                const following = await getFollowing(profile.id);
                setUser(profileToUser(profile, followers, following));
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        // Demo login check
        if (email === 'demo@cartconnect.app' || !isSupabaseConfigured) {
            console.log('🎭 Logging in as Demo User');
            setUser(DEMO_USER);
            return;
        }

        setLoading(true);
        try {
            const profile = await authSignIn(email, password);
            const followers = await getFollowers(profile.id);
            const following = await getFollowing(profile.id);
            setUser(profileToUser(profile, followers, following));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (email: string, password: string, displayName: string) => {
        // Demo mode - just use demo user with custom name
        if (!isSupabaseConfigured) {
            setUser({ ...DEMO_USER, displayName, email });
            return;
        }

        setLoading(true);
        try {
            const profile = await authSignUp(email, password, displayName);
            setUser(profileToUser(profile));
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (!isSupabaseConfigured) {
            setUser(null);
            return;
        }
        await authSignOut();
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;

        if (!isSupabaseConfigured) {
            setUser({ ...user, ...data });
            return;
        }

        await authUpdateProfile(user.uid, {
            displayName: data.displayName,
            avatarUrl: data.avatarUrl
        });
        setUser({ ...user, ...data });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn: handleSignIn,
                signUp: handleSignUp,
                signOut: handleSignOut,
                updateProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
