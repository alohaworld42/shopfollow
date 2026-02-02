import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    score: number;
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

    const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
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
