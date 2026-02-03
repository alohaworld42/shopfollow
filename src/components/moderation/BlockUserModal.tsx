import { useState } from 'react';
import { UserX, UserCheck, AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../common';
import { useAuth } from '../../hooks';
import { blockUser, unblockUser } from '../../services/moderationService';

interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetUserName: string;
    targetUserAvatar?: string;
    isCurrentlyBlocked?: boolean;
    onBlockStatusChange?: (blocked: boolean) => void;
}

const BlockUserModal = ({
    isOpen,
    onClose,
    targetUserId,
    targetUserName,
    targetUserAvatar,
    isCurrentlyBlocked = false,
    onBlockStatusChange,
}: BlockUserModalProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (isCurrentlyBlocked) {
                await unblockUser(user.uid, targetUserId);
            } else {
                await blockUser(user.uid, targetUserId);
            }
            onBlockStatusChange?.(!isCurrentlyBlocked);
            onClose();
        } catch (err) {
            setError(`Failed to ${isCurrentlyBlocked ? 'unblock' : 'block'} user. Please try again.`);
            console.error('Block action error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isCurrentlyBlocked ? 'Unblock User' : 'Block User'}
        >
            <div style={{
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-5)',
                textAlign: 'center'
            }}>
                {/* User Avatar */}
                <div style={{
                    position: 'relative'
                }}>
                    <img
                        src={targetUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId}`}
                        alt={targetUserName}
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            opacity: isCurrentlyBlocked ? 0.5 : 1
                        }}
                    />
                    {isCurrentlyBlocked && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <UserX size={32} color="var(--color-error)" />
                        </div>
                    )}
                </div>

                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {targetUserName}
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-2)',
                        maxWidth: '280px'
                    }}>
                        {isCurrentlyBlocked
                            ? 'Unblocking will allow this user to see your content and interact with you again.'
                            : 'Blocking will hide their content from your feed and prevent them from interacting with you.'
                        }
                    </p>
                </div>

                {!isCurrentlyBlocked && (
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'start',
                        gap: 'var(--space-2)',
                        textAlign: 'left',
                        width: '100%'
                    }}>
                        <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            They won't be notified that you blocked them
                        </p>
                    </div>
                )}

                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)',
                        width: '100%'
                    }}>
                        <AlertTriangle size={16} />
                        <span style={{ fontSize: '13px' }}>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        style={{ flex: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={isCurrentlyBlocked ? 'primary' : 'danger'}
                        onClick={handleAction}
                        loading={loading}
                        style={{ flex: 1 }}
                    >
                        {isCurrentlyBlocked ? (
                            <>
                                <UserCheck size={16} />
                                Unblock
                            </>
                        ) : (
                            <>
                                <UserX size={16} />
                                Block
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default BlockUserModal;
