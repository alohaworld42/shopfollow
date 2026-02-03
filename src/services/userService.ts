/**
 * User Service - Supabase implementation
 * Handles user profiles, following/followers, and groups
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Group } from '../types';

// Helper to get groups for a user (owned and joined)
async function getGroupsForUser(userId: string): Promise<Group[]> {
    if (!isSupabaseConfigured) return [];

    // Get owned groups
    const { data: owned } = await supabase.from('groups').select('*').eq('owner_id', userId);

    // Get joined groups
    const { data: joined } = await supabase.from('group_members').select('group_id, groups(*)').eq('user_id', userId);

    const allGroups = [...(owned || [])];

    if (joined) {
        joined.forEach(j => {
            if (j.groups && !allGroups.find(g => g.id === (j.groups as any).id)) {
                allGroups.push(j.groups as any);
            }
        });
    }

    // Hydrate members
    const groupsWithMembers = await Promise.all(allGroups.map(async g => {
        const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', g.id);
        const memberIds = members?.map(m => m.user_id) || [];
        if (!memberIds.includes(g.owner_id)) memberIds.push(g.owner_id);
        return {
            id: g.id,
            name: g.name,
            members: memberIds
        };
    }));

    return groupsWithMembers;
}

// Convert DB row to User
function toUser(row: Record<string, unknown>, followers: string[] = [], following: string[] = [], groups: Group[] = []): User {
    return {
        uid: row.id as string,
        email: row.email as string,
        displayName: row.display_name as string,
        avatarUrl: row.avatar_url as string || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`,
        score: row.score as number || 0,
        following,
        followers,
        groups,
        isPrivate: row.is_private as boolean || false,
        createdAt: new Date(row.created_at as string)
    };
}

// Get user by ID
export async function getUser(uid: string): Promise<User | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

    if (error || !data) return null;

    const [followers, following, groups] = await Promise.all([
        getFollowerIds(uid),
        getFollowingIds(uid),
        getGroupsForUser(uid)
    ]);

    return toUser(data, followers, following, groups);
}

// Get follower IDs
async function getFollowerIds(userId: string): Promise<string[]> {
    const { data } = await supabase.from('followers').select('follower_id').eq('following_id', userId);
    return data?.map(row => row.follower_id) || [];
}

// Get following IDs
async function getFollowingIds(userId: string): Promise<string[]> {
    const { data } = await supabase.from('followers').select('following_id').eq('follower_id', userId);
    return data?.map(row => row.following_id) || [];
}

// Update user
export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const updates: Record<string, unknown> = {};
    if (data.displayName) updates.display_name = data.displayName;
    if (data.avatarUrl) updates.avatar_url = data.avatarUrl;
    if (data.score !== undefined) updates.score = data.score;
    if (data.isPrivate !== undefined) updates.is_private = data.isPrivate;

    await supabase.from('profiles').update(updates).eq('id', uid);
}

// Follow a user (handles privacy)
export async function followUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Check if target is private
    const { data: target } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', targetUserId)
        .single();

    if (target?.is_private) {
        // Create follow request
        await supabase
            .from('follow_requests')
            .upsert({
                requester_id: currentUserId,
                target_id: targetUserId,
                status: 'pending'
            });
    } else {
        // Direct follow
        await supabase
            .from('followers')
            .upsert({ follower_id: currentUserId, following_id: targetUserId });
    }
}

// Unfollow a user
export async function unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

    // Also delete any pending requests
    await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_id', currentUserId)
        .eq('target_id', targetUserId);
}

// Get Follow Requests
export async function getFollowRequests(userId: string): Promise<User[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
        .from('follow_requests')
        .select('requester_id, profiles!follow_requests_requester_id_fkey(*)')
        .eq('target_id', userId)
        .eq('status', 'pending');

    if (error || !data) return [];

    // Map profiles
    return data.map(row => toUser(row.profiles as any));
}

// Accept Follow Request
export async function acceptFollowRequest(currentUserId: string, requesterId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    // 1. Add to followers
    await supabase.from('followers').insert({ follower_id: requesterId, following_id: currentUserId });

    // 2. Update request status
    await supabase.from('follow_requests').update({ status: 'approved', responded_at: new Date().toISOString() })
        .eq('requester_id', requesterId)
        .eq('target_id', currentUserId);
}

// Reject Follow Request
export async function rejectFollowRequest(currentUserId: string, requesterId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase.from('follow_requests').update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('requester_id', requesterId)
        .eq('target_id', currentUserId);
}

// Get suggested users
export async function getSuggestedUsers(currentUserId: string, following: string[], limitCount: number = 10): Promise<User[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .limit(limitCount + following.length + 5);

    if (error || !data) return [];

    const users = await Promise.all(
        data
            .filter(row => !following.includes(row.id))
            .slice(0, limitCount)
            .map(async row => {
                const [followers, followingList] = await Promise.all([
                    getFollowerIds(row.id),
                    getFollowingIds(row.id)
                ]);
                return toUser(row, followers, followingList);
            })
    );
    return users;
}

// Get following users
export async function getFollowingUsers(following: string[]): Promise<User[]> {
    if (!isSupabaseConfigured || following.length === 0) return [];
    const { data, error } = await supabase.from('profiles').select('*').in('id', following);
    if (error || !data) return [];
    return Promise.all(data.map(async row => {
        const [followers, followingList] = await Promise.all([getFollowerIds(row.id), getFollowingIds(row.id)]);
        return toUser(row, followers, followingList);
    }));
}

// Create a group
export async function createGroup(userId: string, group: Omit<Group, 'id'>): Promise<string> {
    if (!isSupabaseConfigured) return crypto.randomUUID();

    const { data, error } = await supabase.from('groups').insert({ owner_id: userId, name: group.name }).select().single();
    if (error) throw error;

    if (group.members.length > 0) {
        const membersToAdd = group.members.filter(m => m !== userId);
        if (membersToAdd.length > 0) {
            await supabase.from('group_members').insert(membersToAdd.map(memberId => ({ group_id: data.id, user_id: memberId })));
        }
    }
    await supabase.from('group_members').insert({ group_id: data.id, user_id: userId });
    return data.id;
}

// Group helpers
export async function updateGroup(userId: string, groups: Group[]): Promise<void> {
    if (!isSupabaseConfigured) return;
    console.warn('Bulk updateGroup not optimized. Use granular updates.');
}
export async function updateGroupDetails(groupId: string, name: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('groups').update({ name }).eq('id', groupId);
}
export async function addGroupMember(groupId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
}
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
}
export async function deleteGroup(userId: string, groupId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('groups').delete().eq('id', groupId).eq('owner_id', userId);
}
export async function updateScore(userId: string, points: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { data: current } = await supabase.from('profiles').select('score').eq('id', userId).single();
    const newScore = (current?.score || 0) + points;
    await supabase.from('profiles').update({ score: newScore }).eq('id', userId);
}
export async function searchUsers(query: string, limitCount: number = 20): Promise<User[]> {
    if (!isSupabaseConfigured || !query.trim()) return [];
    const { data, error } = await supabase.from('profiles').select('*').ilike('display_name', `%${query}%`).limit(limitCount);
    if (error || !data) return [];
    return Promise.all(data.map(async row => {
        const followers = await getFollowerIds(row.id);
        const followingList = await getFollowingIds(row.id);
        return toUser(row, followers, followingList);
    }));
}
