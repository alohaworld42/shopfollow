import { useState, useEffect } from 'react';
import { UserCard, GroupManager } from '../components/network';
import { SkeletonList, Card } from '../components/common';
import { useAuth, useUsers, useToast } from '../hooks';
import { Users, UserPlus, Sparkles } from 'lucide-react';

type Tab = 'discover' | 'following' | 'groups';

const Network = () => {
    const { user } = useAuth();
    const {
        users,
        loading,
        fetchSuggestedUsers,
        fetchFollowingUsers,
        followUser,
        unfollowUser,
        createGroup,
        updateGroup,
        deleteGroup
    } = useUsers();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<Tab>('discover');

    useEffect(() => {
        if (activeTab === 'discover') {
            fetchSuggestedUsers();
        } else if (activeTab === 'following') {
            fetchFollowingUsers();
        }
    }, [activeTab, fetchSuggestedUsers, fetchFollowingUsers]);

    const handleFollow = async (userId: string) => {
        await followUser(userId);
        showToast('success', 'Du folgst jetzt diesem Nutzer!');
    };

    const handleUnfollow = async (userId: string) => {
        await unfollowUser(userId);
        showToast('info', 'Nutzer entfolgt');
    };

    const handleCreateGroup = (name: string, members: string[]) => {
        createGroup(name, members);
        showToast('success', 'Gruppe erstellt!');
    };

    const handleDeleteGroup = (groupId: string) => {
        deleteGroup(groupId);
        showToast('info', 'Gruppe gelöscht');
    };

    const tabs = [
        { id: 'discover', label: 'Entdecken', icon: Sparkles },
        { id: 'following', label: 'Following', icon: Users },
        { id: 'groups', label: 'Gruppen', icon: UserPlus }
    ] as const;

    return (
        <div className="p-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === id
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'bg-dark-800 text-white/50 border border-transparent hover:text-white/70'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'groups' ? (
                // Groups Tab
                <GroupManager
                    groups={user?.groups || []}
                    onCreate={handleCreateGroup}
                    onUpdate={(groupId, data) => updateGroup(groupId, data)}
                    onDelete={handleDeleteGroup}
                />
            ) : (
                // Discover / Following Tab
                <div className="space-y-3">
                    {loading ? (
                        <SkeletonList count={5} />
                    ) : users.length === 0 ? (
                        <Card glass className="text-center py-12">
                            {activeTab === 'discover' ? (
                                <>
                                    <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/50">Keine neuen Vorschläge</p>
                                    <p className="text-sm text-white/30 mt-1">
                                        Du folgst bereits allen verfügbaren Nutzern
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/50">Du folgst noch niemandem</p>
                                    <p className="text-sm text-white/30 mt-1">
                                        Entdecke neue Nutzer im "Entdecken" Tab
                                    </p>
                                </>
                            )}
                        </Card>
                    ) : (
                        users.map(u => (
                            <UserCard
                                key={u.uid}
                                user={u}
                                isFollowing={activeTab === 'following'}
                                onFollow={handleFollow}
                                onUnfollow={handleUnfollow}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Network;
