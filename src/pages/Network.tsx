import { useState } from 'react';
import {
    Users,
    Search as SearchIcon,
    UserPlus,
    UserMinus,
    ExternalLink,
    Filter,
    Plus,
    X,
    Settings,
    Share2,
    MoreVertical
} from 'lucide-react';
import { useAuth, useUsers } from '../hooks';
import { UserCard } from '../components/network';
import { Avatar, Button, Modal } from '../components/common';
import * as userService from '../services/userService';

// Helper component for Group Card
const GroupCard = ({ group, onManage, onDelete }: { group: any, onManage: (g: any) => void, onDelete: (id: string) => void }) => {
    return (
        <div style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)'
                    }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            {group.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                            {group.members?.length || 0} members
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => onManage(group)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <Button variant="secondary" size="sm" onClick={() => onManage(group)} style={{ flex: 1 }}>
                    Manage
                </Button>
                {group.owner_id === undefined && ( // If we had owner info in Group type. For now, try delete
                    <Button variant="secondary" size="sm" onClick={() => onDelete(group.id)} style={{ width: '40px', padding: 0 }}>
                        <UserMinus size={16} color="var(--color-error)" />
                    </Button>
                )}
            </div>
        </div>
    );
};

// Create Group Modal
const CreateGroupModal = ({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (name: string) => void }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        await onCreate(name);
        setLoading(false);
        setName('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Group Name</label>
                    <div style={{ position: 'relative' }}>
                        <Users size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Close Friends, Fashion Lovers"
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                </div>
                <Button type="submit" variant="primary" loading={loading} disabled={!name.trim()}>Create Group</Button>
            </form>
        </Modal>
    );
};

const Network = () => {
    const { user } = useAuth();
    const {
        users: suggestedUsers,
        loading,
        followUser,
        fetchSuggestedUsers,
        createGroup,
        deleteGroup
    } = useUsers();

    // We need to fetch 'following' users too for the "Following" tab
    const [followingUsers, setFollowingUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'groups'>('discover');
    const [searchQuery, setSearchQuery] = useState('');

    // Group State
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null); // For managing

    // Fetch following logic should be in useUsers or here?
    // userService.getFollowingUsers(user.following)
    const loadFollowing = async () => {
        if (user?.following?.length) {
            const users = await userService.getFollowingUsers(user.following);
            setFollowingUsers(users);
        } else {
            setFollowingUsers([]);
        }
    };

    // Refresh handler
    const handleRefresh = () => {
        if (activeTab === 'discover') fetchSuggestedUsers();
        if (activeTab === 'following') loadFollowing();
        // Groups are in user object, so they update automatically via AuthContext? 
        // No, AuthContext user object doesn't auto-update deep props unless we call reload.
        // But useUsers createGroup updates local state.
    };

    // Initial load
    useState(() => {
        handleRefresh();
    });

    const handleFollow = async (targetId: string) => {
        await followUser(targetId);
        // Optimistic update handled in hook?
    };

    const handleUnfollow = async (targetId: string) => {
        await userService.unfollowUser(user!.uid, targetId);
        // Refresh
        handleRefresh();
    };

    const handleCreateGroup = async (name: string) => {
        await createGroup(name, []); // Start empty
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (window.confirm('Delete this group?')) {
            await deleteGroup(groupId);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '16px 20px 0',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #FF3366 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Network
                    </h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            <UserPlus size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '24px' }}>
                    {[
                        { id: 'discover', label: 'Discover' },
                        { id: 'following', label: 'Following' },
                        { id: 'groups', label: 'Groups' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); handleRefresh(); }}
                            style={{
                                padding: '0 0 12px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontSize: '15px',
                                fontWeight: activeTab === tab.id ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
                {activeTab === 'discover' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div className="loading-spinner" />
                        ) : suggestedUsers.length > 0 ? (
                            suggestedUsers.map(u => (
                                <UserCard
                                    key={u.uid}
                                    user={u}
                                    isFollowing={false}
                                    onFollow={() => handleFollow(u.uid)}
                                    onUnfollow={() => { }}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <SearchIcon size={48} />
                                <p>No suggestions right now.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'following' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {followingUsers.length > 0 ? (
                            followingUsers.map(u => (
                                <UserCard
                                    key={u.uid}
                                    user={u}
                                    isFollowing={true}
                                    onFollow={() => { }} // Already following
                                    onUnfollow={() => handleUnfollow(u.uid)}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <UserPlus size={48} />
                                <p>You aren't following anyone yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Button variant="primary" onClick={() => setIsCreateGroupOpen(true)} style={{ alignSelf: 'flex-start' }}>
                            <Plus size={18} /> Create Group
                        </Button>

                        {user?.groups && user.groups.length > 0 ? (
                            user.groups.map(g => (
                                <GroupCard
                                    key={g.id}
                                    group={g}
                                    onManage={(h) => setSelectedGroup(h)}
                                    onDelete={handleDeleteGroup}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>No groups yet. Create one to share products with close friends!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateGroupModal
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                onCreate={handleCreateGroup}
            />

            {/* Placeholder for Manage Group Modal */}
            {selectedGroup && (
                <Modal isOpen={!!selectedGroup} onClose={() => setSelectedGroup(null)} title={`Manage ${selectedGroup.name}`}>
                    <div style={{ padding: '24px' }}>
                        <p>Members: {selectedGroup.members?.length || 0}</p>
                        <p style={{ color: 'var(--text-secondary)' }}>Member management coming soon.</p>
                        <Button variant="secondary" onClick={() => setSelectedGroup(null)}>Close</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Network;
