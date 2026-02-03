import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as userService from '../services/userService';
import type { User, Group } from '../types';

// Demo users for development
const DEMO_USERS: User[] = [
    {
        uid: 'user-2',
        email: 'sarah@example.com',
        displayName: 'Sarah Miller',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        score: 890,
        following: ['demo-user-1', 'user-3'],
        followers: ['demo-user-1', 'user-4'],
        groups: [],
        isPrivate: false,
        createdAt: new Date()
    },
    {
        uid: 'user-3',
        email: 'max@example.com',
        displayName: 'Max Weber',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
        score: 1540,
        following: ['user-2'],
        followers: ['demo-user-1', 'user-2'],
        groups: [],
        isPrivate: false,
        createdAt: new Date()
    },
    {
        uid: 'user-4',
        email: 'emma@example.com',
        displayName: 'Emma Schmidt',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
        score: 720,
        following: ['user-2', 'user-5'],
        followers: ['demo-user-1'],
        groups: [],
        isPrivate: false,
        createdAt: new Date()
    },
    {
        uid: 'user-5',
        email: 'luca@example.com',
        displayName: 'Luca Fischer',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luca',
        score: 450,
        following: [],
        followers: ['user-4'],
        groups: [],
        isPrivate: false,
        createdAt: new Date()
    },
    {
        uid: 'user-6',
        email: 'nina@example.com',
        displayName: 'Nina Braun',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina',
        score: 320,
        following: [],
        followers: [],
        groups: [],
        isPrivate: false,
        createdAt: new Date()
    }
];

export const useUsers = () => {
    const { user, updateProfile } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDemoMode = !isSupabaseConfigured || (user?.uid && (user.uid.startsWith('demo-') || user.uid.startsWith('user-')));

    // Fetch suggested users
    const fetchSuggestedUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                await new Promise(r => setTimeout(r, 300));
                const following = user?.following || [];
                const suggestions = DEMO_USERS.filter(u => !following.includes(u.uid));
                setUsers(suggestions);
            } else if (user) {
                const data = await userService.getSuggestedUsers(user.uid, user.following);
                setUsers(data);
            }
        } catch {
            setError('Fehler beim Laden der Vorschläge');
        } finally {
            setLoading(false);
        }
    }, [user, isDemoMode]);

    // Fetch following users
    const fetchFollowingUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                await new Promise(r => setTimeout(r, 300));
                const following = user?.following || [];
                const followingUsers = DEMO_USERS.filter(u => following.includes(u.uid));
                setUsers(followingUsers);
            } else if (user) {
                const data = await userService.getFollowingUsers(user.following);
                setUsers(data);
            }
        } catch {
            setError('Fehler beim Laden der Nutzer');
        } finally {
            setLoading(false);
        }
    }, [user, isDemoMode]);

    // Follow user
    const followUser = useCallback(async (targetUserId: string) => {
        if (!user) return;

        // Update local state
        const newFollowing = [...user.following, targetUserId];
        await updateProfile({ following: newFollowing });

        // Remove from suggestions
        setUsers(prev => prev.filter(u => u.uid !== targetUserId));

        if (!isDemoMode) {
            await userService.followUser(user.uid, targetUserId);
        }
    }, [user, updateProfile, isDemoMode]);

    // Unfollow user
    const unfollowUser = useCallback(async (targetUserId: string) => {
        if (!user) return;

        const newFollowing = user.following.filter(id => id !== targetUserId);
        await updateProfile({ following: newFollowing });

        setUsers(prev => prev.filter(u => u.uid !== targetUserId));

        if (!isDemoMode) {
            await userService.unfollowUser(user.uid, targetUserId);
        }
    }, [user, updateProfile, isDemoMode]);

    // Create group
    const createGroup = useCallback(async (name: string, members: string[] = []) => {
        if (!user) return;

        const newGroup: Group = {
            id: crypto.randomUUID(),
            name,
            members
        };

        const newGroups = [...user.groups, newGroup];
        await updateProfile({ groups: newGroups });

        if (!isDemoMode) {
            await userService.createGroup(user.uid, { name, members });
        }

        return newGroup;
    }, [user, updateProfile, isDemoMode]);

    // Update group
    const updateGroup = useCallback(async (groupId: string, data: Partial<Group>) => {
        if (!user) return;

        const newGroups = user.groups.map(g =>
            g.id === groupId ? { ...g, ...data } : g
        );
        await updateProfile({ groups: newGroups });

        if (!isDemoMode) {
            await userService.updateGroup(user.uid, newGroups);
        }
    }, [user, updateProfile, isDemoMode]);

    // Delete group
    const deleteGroup = useCallback(async (groupId: string) => {
        if (!user) return;

        const newGroups = user.groups.filter(g => g.id !== groupId);
        await updateProfile({ groups: newGroups });

        if (!isDemoMode) {
            // Fixed: deleteGroup only takes 2 arguments now
            await userService.deleteGroup(user.uid, groupId);
        }
    }, [user, updateProfile, isDemoMode]);

    return {
        users,
        loading,
        error,
        fetchSuggestedUsers,
        fetchFollowingUsers,
        followUser,
        unfollowUser,
        createGroup,
        updateGroup,
        deleteGroup
    };
};

export default useUsers;
