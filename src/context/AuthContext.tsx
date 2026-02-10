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

        if (!isSupabaseConfigured) {
            console.log('🎭 Demo Mode Available - Supabase not configured');
            setLoading(false);
            return;
        }

        // Safety: force loading=false after 5s no matter what
        const timeout = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 5000);

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
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('Auth init error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

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
                    if (isMounted) setUser(null);
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('Auth state change error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(timeout);
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
