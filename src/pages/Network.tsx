import { useState, useEffect } from 'react';
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
    MoreVertical,
    Heart,
    MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUsers, useToast } from '../hooks';
import { UserCard } from '../components/network';
import { Avatar, Button, Modal } from '../components/common';
import * as userService from '../services/userService';

// --- Styled Components (Inline for now, moving to CSS modules recommended later) ---

const GlassCard = ({ children, style, onClick }: any) => (
    <div
        onClick={onClick}
        style={{
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            ...style
        }}
    >
        {children}
    </div>
);

const TabButton = ({ active, onClick, children }: any) => (
    <button
        onClick={onClick}
        style={{
            flex: 1,
            padding: '12px 16px',
            background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        }}
    >
        {children}
    </button>
);

// Helper component for Group Card
const GroupCard = ({ group, onManage, onDelete }: { group: any, onManage: (g: any) => void, onDelete: (id: string) => void }) => {
    return (
        <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                    }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                            {group.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            {group.members?.length || 0} members
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onManage(group)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                >
                    <Settings size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <Button variant="secondary" size="sm" onClick={() => onManage(group)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: 'none' }}>
                    Manage Group
                </Button>
                {group.owner_id === undefined && (
                    <Button variant="secondary" size="sm" onClick={() => onDelete(group.id)} style={{ width: '44px', padding: 0, background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none' }}>
                        <UserMinus size={18} />
                    </Button>
                )}
            </div>
        </GlassCard>
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
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>Group Name</label>
                    <div style={{ position: 'relative' }}>
                        <Users size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Close Friends"
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--bg-base)', // Darker input bg
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '16px'
                            }}
                            autoFocus
                        />
                    </div>
                </div>
                <Button type="submit" variant="primary" loading={loading} disabled={!name.trim()} style={{ height: '52px', fontSize: '16px' }}>
                    Create Group
                </Button>
            </form>
        </Modal>
    );
};

const Network = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const {
        users: suggestedUsers,
        loading,
        followUser,
        fetchSuggestedUsers,
        createGroup,
        deleteGroup
    } = useUsers();

    const [followingUsers, setFollowingUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'groups'>('discover');

    // Group State
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);

    // Search State
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSuggested = suggestedUsers.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFollowing = followingUsers.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = user?.groups?.filter((g: any) =>
        g.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const loadFollowing = async () => {
        if (user?.following?.length) {
            const users = await userService.getFollowingUsers(user.following);
            setFollowingUsers(users);
        } else {
            setFollowingUsers([]);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'discover') fetchSuggestedUsers();
        if (activeTab === 'following') loadFollowing();
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    const handleFollow = async (targetId: string) => {
        await followUser(targetId);
    };

    const handleUnfollow = async (targetId: string) => {
        await userService.unfollowUser(user!.uid, targetId);
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
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', minHeight: '100vh' }}>
            {/* Header / Backdrop */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '300px',
                background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.08), transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Sticky Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 20,
                background: 'rgba(12, 12, 12, 0.85)',
                backdropFilter: 'blur(20px)',
                padding: '20px 20px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', height: '40px' }}>
                    {isSearchActive ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <SearchIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-full)',
                                        padding: '10px 10px 10px 36px',
                                        color: 'white',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '8px'
                            }}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: 800,
                                margin: 0,
                                letterSpacing: '-0.02em',
                                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                Network
                            </h1>
                            <button
                                onClick={() => setIsSearchActive(true)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}>
                                <SearchIcon size={20} />
                            </button>
                        </>
                    )}
                </div>

                {/* Glass Tabs */}
                <div style={{
                    display: 'flex',
                    padding: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-full)',
                    marginBottom: '10px'
                }}>
                    <TabButton active={activeTab === 'discover'} onClick={() => { setActiveTab('discover'); handleRefresh(); }}>
                        Discover
                    </TabButton>
                    <TabButton active={activeTab === 'following'} onClick={() => { setActiveTab('following'); handleRefresh(); }}>
                        Following
                    </TabButton>
                    <TabButton active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); handleRefresh(); }}>
                        Groups
                    </TabButton>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>

                {activeTab === 'discover' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Featured / Hero Section could go here */}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Suggested for you</h2>
                            <button
                                onClick={() => navigate('/search', { state: { activeTab: 'people' } })}
                                style={{ color: 'var(--color-primary-light)', background: 'none', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                            >
                                See all
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-spinner" style={{ margin: '40px auto' }} />
                        ) : filteredSuggested.length > 0 ? (
                            filteredSuggested.map(u => (
                                <UserCard
                                    key={u.uid}
                                    user={u}
                                    isFollowing={false}
                                    onFollow={() => handleFollow(u.uid)}
                                    onUnfollow={() => { }}
                                    onClick={() => showToast('info', 'User profiles coming soon!')}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <SearchIcon size={48} style={{ opacity: 0.5 }} />
                                <p>No suggestions right now.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'following' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredFollowing.length > 0 ? (
                            filteredFollowing.map(u => (
                                <UserCard
                                    key={u.uid}
                                    user={u}
                                    isFollowing={true}
                                    onFollow={() => { }}
                                    onUnfollow={() => handleUnfollow(u.uid)}
                                    onClick={() => showToast('info', 'User profiles coming soon!')}
                                />
                            ))
                        ) : (
                            <div className="empty-state" style={{ padding: '60px 20px' }}>
                                <UserPlus size={56} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                                <p style={{ fontSize: '16px', fontWeight: 500 }}>Your network is quiet.</p>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Start following people to see them here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Button variant="primary" onClick={() => setIsCreateGroupOpen(true)} style={{
                            width: '100%',
                            justifyContent: 'center',
                            height: '56px',
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                            marginTop: '10px'
                        }}>
                            <Plus size={20} /> Create New Group
                        </Button>

                        {user?.groups && user.groups.length > 0 ? (
                            <div style={{ display: 'grid', gap: '16px', marginTop: '10px' }}>
                                {filteredGroups.map((g: any) => (
                                    <GroupCard
                                        key={g.id}
                                        group={g}
                                        onManage={(h) => setSelectedGroup(h)}
                                        onDelete={handleDeleteGroup}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px border var(--border-primary)', borderRadius: '20px' }}>
                                <Users size={48} style={{ color: 'var(--color-primary-light)' }} />
                                <p>Create circles for your close friends.</p>
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
