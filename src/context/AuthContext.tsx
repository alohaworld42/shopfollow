import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    signIn as authSignIn,
    signUp as authSignUp,
    signOut as authSignOut,
    signInWithGoogle as authSignInWithGoogle,
    signInWithApple as authSignInWithApple,
    getCurrentUser,
    onAuthStateChange,
    updateProfile as authUpdateProfile,
    getFollowers,
    getFollowing,
    Profile
} from '../services/authService';
import { matchOrdersToUser } from '../services/orderMatchingService';
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
        isPrivate: profile.isPrivate,
        createdAt: profile.createdAt
    };
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // If Supabase is not configured, we're in demo-capable mode
        // but we DON'T auto-login - user must explicitly choose demo
        if (!isSupabaseConfigured) {
            console.log('🎭 Demo Mode Available - Supabase not configured');
            setLoading(false);
            return;
        }

        // Check for existing session
        const initAuth = async () => {
            try {
                const profile = await getCurrentUser();
                if (!isMounted) return;

                if (profile) {
                    const followers = await getFollowers(profile.id);
                    const following = await getFollowing(profile.id);
                    if (isMounted) {
                        setUser(profileToUser(profile, followers, following));
                    }
                }
            } catch (err) {
                // Ignore abort errors on unmount
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                console.error('Auth init error:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Subscribe to auth changes
        const { unsubscribe } = onAuthStateChange(async (profile) => {
            if (!isMounted) return;

            try {
                if (profile) {
                    const followers = await getFollowers(profile.id);
                    const following = await getFollowing(profile.id);
                    if (isMounted) {
                        setUser(profileToUser(profile, followers, following));
                    }
                } else {
                    if (isMounted) {
                        setUser(null);
                    }
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                console.error('Auth state change error:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
            // Demo/Mock Login
            console.log('🎭 Performing Demo Login');
            setLoading(true);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const mockUser: User = {
                uid: 'demo-user-123',
                email: email,
                displayName: 'Demo User',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                score: 100,
                followers: [],
                following: [],
                groups: [],
                isPrivate: false,
                createdAt: new Date()
            };

            setUser(mockUser);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const profile = await authSignIn(email, password);
            const followers = await getFollowers(profile.id);
            const following = await getFollowing(profile.id);
            setUser(profileToUser(profile, followers, following));

            // Match any pending orders to this user by email
            const matchedCount = await matchOrdersToUser(profile.id, profile.email);
            if (matchedCount > 0) {
                console.log(`🎉 Matched ${matchedCount} orders to user ${profile.email}`);
            }
        } catch (error) {
            setLoading(false);
            throw error; // Re-throw so Login page can display error
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (email: string, password: string, displayName: string) => {
        if (!isSupabaseConfigured) {
            // Demo/Mock Signup
            console.log('🎭 Performing Demo Signup');
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockUser: User = {
                uid: `demo-user-${Date.now()}`,
                email: email,
                displayName: displayName,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                score: 0,
                followers: [],
                following: [],
                groups: [],
                isPrivate: false,
                createdAt: new Date()
            };

            setUser(mockUser);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const profile = await authSignUp(email, password, displayName);
            setUser(profileToUser(profile));

            // Match any pending orders to this new user by email
            const matchedCount = await matchOrdersToUser(profile.id, profile.email);
            if (matchedCount > 0) {
                console.log(`🎉 Matched ${matchedCount} orders to new user ${profile.email}`);
            }
        } catch (error) {
            setLoading(false);
            throw error; // Re-throw so Signup page can display error
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
            console.log('🎭 Demo Profile Update', data);
            setUser({ ...user, ...data });
            return;
        }

        await authUpdateProfile(user.uid, {
            displayName: data.displayName,
            avatarUrl: data.avatarUrl
        });
        setUser({ ...user, ...data });
    };

    const handleSignInWithGoogle = async () => {
        await authSignInWithGoogle();
    };

    const handleSignInWithApple = async () => {
        await authSignInWithApple();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn: handleSignIn,
                signUp: handleSignUp,
                signOut: handleSignOut,
                signInWithGoogle: handleSignInWithGoogle,
                signInWithApple: handleSignInWithApple,
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
