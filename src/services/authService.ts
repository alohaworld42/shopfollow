import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    score: number;
    isPrivate: boolean;
    createdAt: Date;
}

// Convert DB row to Profile
function toProfile(row: Record<string, unknown>): Profile {
    return {
        id: row.id as string,
        email: row.email as string,
        displayName: row.display_name as string,
        avatarUrl: row.avatar_url as string || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`,
        score: row.score as number || 0,
        isPrivate: row.is_private as boolean || false,
        createdAt: new Date(row.created_at as string)
    };
}

// Sign up with email and password
export async function signUp(email: string, password: string, displayName: string): Promise<Profile> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    // Profile is auto-created via trigger, fetch it
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) throw profileError;
    return toProfile(profile);
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<Profile> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) throw profileError;
    return toProfile(profile);
}

// Sign out
export async function signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent'
            }
        }
    });

    if (error) throw error;
}

// Sign in with Apple OAuth
export async function signInWithApple(): Promise<void> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: `${window.location.origin}/`
        }
    });

    if (error) throw error;
}

// Resend email verification
export async function resendVerificationEmail(): Promise<void> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('No user email found');

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
    });

    if (error) throw error;
}

// Check if email is verified
export async function isEmailVerified(): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    const { data: { user } } = await supabase.auth.getUser();
    return user?.email_confirmed_at != null;
}

// Get current user session
export async function getCurrentUser(): Promise<Profile | null> {
    if (!isSupabaseConfigured) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return null;
    return toProfile(profile);
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: Profile | null) => void) {
    if (!isSupabaseConfigured) {
        return { unsubscribe: () => { } };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const profile = await getCurrentUser();
            callback(profile);
        } else {
            callback(null);
        }
    });

    return { unsubscribe: () => subscription.unsubscribe() };
}

// Update user profile
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;

    // Optimization: Skip DB call if no profile fields to update
    // This prevents crashes when updating 'following' or 'groups' which are handled elsewhere
    if (Object.keys(dbUpdates).length === 0) {
        const current = await getCurrentUser();
        if (!current) throw new Error('Profile not found');
        return current;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Profile not found');
    return toProfile(data);
}

// Get followers for a user
export async function getFollowers(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', userId);

    if (error) return [];
    return data.map(row => row.follower_id);
}

// Get following for a user
export async function getFollowing(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

    if (error) return [];
    return data.map(row => row.following_id);
}

// Follow a user
export async function followUser(userId: string, targetUserId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
        .from('followers')
        .insert({ follower_id: userId, following_id: targetUserId });

    if (error && !error.message.includes('duplicate')) throw error;
}

// Unfollow a user
export async function unfollowUser(userId: string, targetUserId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

    if (error) throw error;
}
