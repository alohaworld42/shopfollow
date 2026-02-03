import { useState, useEffect } from 'react';
import { ArrowLeft, UserX, Shield, Bell, Lock, HelpCircle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/common';
import { useAuth, useToast } from '../hooks';
import { getBlockedUsers, unblockUser, type BlockedUser } from '../services/moderationService';
import { updateUser } from '../services/userService';

const Settings = () => {
    const { user, signOut } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loadingBlocks, setLoadingBlocks] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadBlockedUsers();
        }
    }, [user]);

    const loadBlockedUsers = async () => {
        if (!user) return;
        try {
            const users = await getBlockedUsers(user.uid);
            setBlockedUsers(users);
        } catch (error) {
            console.error('Failed to load blocked users:', error);
        } finally {
            setLoadingBlocks(false);
        }
    };

    const handleUnblock = async (blockedId: string) => {
        if (!user) return;
        try {
            await unblockUser(user.uid, blockedId);
            setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
            showToast('success', 'User unblocked');
        } catch (error) {
            showToast('error', 'Failed to unblock user');
        }
    };



    const updatePrivacy = async (isPrivate: boolean) => {
        if (!user) return;
        try {
            await updateUser(user.uid, { isPrivate });
            showToast('success', `Account is now ${isPrivate ? 'Private' : 'Public'}`);
        } catch (e) {
            console.error(e);
            showToast('error', 'Failed to update privacy settings');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/welcome');
    };

    const settingsSections = [
        { id: 'blocked', label: 'Blocked Users', icon: UserX, count: blockedUsers.length },
        { id: 'privacy', label: 'Privacy', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'help', label: 'Help & Support', icon: HelpCircle },
    ];

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <Link
                    to="/dashboard"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none'
                    }}
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Settings
                </h1>
            </div>

            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Settings Menu */}
                {settingsSections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                        <div key={section.id}>
                            <button
                                onClick={() => setActiveSection(isActive ? null : section.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--bg-glass)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Icon size={20} color="var(--text-secondary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {section.label}
                                    </p>
                                </div>
                                {section.count !== undefined && section.count > 0 && (
                                    <span style={{
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        {section.count}
                                    </span>
                                )}
                            </button>

                            {/* Blocked Users Section */}
                            {isActive && section.id === 'blocked' && (
                                <div style={{
                                    marginTop: 'var(--space-3)',
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    {loadingBlocks ? (
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                            Loading...
                                        </p>
                                    ) : blockedUsers.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                            You haven't blocked anyone
                                        </p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                            {blockedUsers.map(blocked => (
                                                <div
                                                    key={blocked.blocked_id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--space-3)',
                                                        padding: 'var(--space-3)',
                                                        background: 'var(--bg-elevated)',
                                                        borderRadius: 'var(--radius-sm)'
                                                    }}
                                                >
                                                    <img
                                                        src={blocked.blocked_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blocked.blocked_id}`}
                                                        alt=""
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                            {blocked.blocked_profile?.display_name || 'Unknown User'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleUnblock(blocked.blocked_id)}
                                                    >
                                                        Unblock
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Privacy Section */}
                            {isActive && section.id === 'privacy' && (
                                <div style={{
                                    marginTop: 'var(--space-3)',
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Account Privacy</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Private Account</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Only followers can see your posts and lists</p>
                                        </div>
                                        <div
                                            onClick={() => updatePrivacy(!user?.isPrivate)}
                                            style={{
                                                width: '48px',
                                                height: '24px',
                                                borderRadius: '12px',
                                                background: user?.isPrivate ? 'var(--color-primary)' : 'var(--bg-muted)',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                position: 'absolute',
                                                top: '2px',
                                                left: user?.isPrivate ? '26px' : '2px',
                                                transition: 'left 0.2s'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Placeholder for other sections */}
                            {isActive && section.id !== 'blocked' && section.id !== 'privacy' && (
                                <div style={{
                                    marginTop: 'var(--space-3)',
                                    padding: 'var(--space-6)',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        Coming soon
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Sign Out */}
                <div style={{ marginTop: 'var(--space-4)' }}>
                    <Button
                        variant="danger"
                        onClick={handleSignOut}
                        style={{ width: '100%' }}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
