import { UserPlus, UserMinus, Trophy, Users } from 'lucide-react';
import type { User } from '../../types';

interface UserCardProps {
    user: User;
    isFollowing: boolean;
    onFollow: (userId: string) => void;
    onUnfollow: (userId: string) => void;
}

const UserCard = ({ user, isFollowing, onFollow, onUnfollow }: UserCardProps) => {
    return (
        <div className="feed-card" style={{ padding: 'var(--space-4)' }}>
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="feed-card-user-avatar"
                    style={{ width: '56px', height: '56px' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p className="feed-card-title" style={{ fontSize: '16px', marginBottom: 0 }}>
                        {user.displayName}
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Trophy size={14} className="text-primary-400" />
                            <span>{user.score}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Users size={14} />
                            <span>{user.followers.length} Followers</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                {isFollowing ? (
                    <button
                        onClick={() => onUnfollow(user.uid)}
                        className="feed-card-action"
                        style={{
                            width: 'auto',
                            height: '36px',
                            minHeight: '36px',
                            padding: '0 16px',
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '10px'
                        }}
                    >
                        Following
                    </button>
                ) : (
                    <button
                        onClick={() => onFollow(user.uid)}
                        className="feed-card-shop-btn"
                        style={{
                            width: 'auto',
                            height: '36px',
                            minHeight: '36px',
                            padding: '0 20px',
                            marginBottom: 0,
                            fontSize: '13px',
                            boxShadow: 'none'
                        }}
                    >
                        Follow
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserCard;
