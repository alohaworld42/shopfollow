import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    limit,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Group } from '../types';

const USERS_COLLECTION = 'users';

// Get user by ID
export const getUser = async (uid: string): Promise<User | null> => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        } as User;
    }
    return null;
};

// Update user
export const updateUser = async (
    uid: string,
    data: Partial<User>
): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, data);
};

// Follow a user
export const followUser = async (
    currentUserId: string,
    targetUserId: string
): Promise<void> => {
    const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
    const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);

    await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
    });

    await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId)
    });
};

// Unfollow a user
export const unfollowUser = async (
    currentUserId: string,
    targetUserId: string
): Promise<void> => {
    const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
    const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);

    await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
    });

    await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId)
    });
};

// Get suggested users (users not followed yet)
export const getSuggestedUsers = async (
    currentUserId: string,
    following: string[],
    limitCount: number = 10
): Promise<User[]> => {
    const q = query(
        collection(db, USERS_COLLECTION),
        where('uid', '!=', currentUserId),
        limit(limitCount + following.length)
    );

    const snapshot = await getDocs(q);
    const users = snapshot.docs
        .map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            } as User;
        })
        .filter(user => !following.includes(user.uid));

    return users.slice(0, limitCount);
};

// Get following users
export const getFollowingUsers = async (following: string[]): Promise<User[]> => {
    if (following.length === 0) return [];

    const users: User[] = [];
    for (const uid of following) {
        const user = await getUser(uid);
        if (user) users.push(user);
    }
    return users;
};

// Create a group
export const createGroup = async (
    userId: string,
    group: Omit<Group, 'id'>
): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const newGroup: Group = {
        ...group,
        id: crypto.randomUUID()
    };

    await updateDoc(userRef, {
        groups: arrayUnion(newGroup)
    });
};

// Update a group
export const updateGroup = async (
    userId: string,
    groups: Group[]
): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { groups });
};

// Delete a group
export const deleteGroup = async (
    userId: string,
    groupId: string,
    currentGroups: Group[]
): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updatedGroups = currentGroups.filter(g => g.id !== groupId);
    await updateDoc(userRef, { groups: updatedGroups });
};

// Update user score
export const updateScore = async (
    userId: string,
    points: number
): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        const currentScore = userDoc.data().score || 0;
        await updateDoc(userRef, {
            score: currentScore + points
        });
    }
};
