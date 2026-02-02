import { UserPlus, UserMinus, Trophy } from 'lucide-react';
import { Avatar, Button } from '../common';
import type { User } from '../../types';

interface UserCardProps {
    user: User;
    isFollowing: boolean;
    onFollow: (userId: string) => void;
    onUnfollow: (userId: string) => void;
}

const UserCard = ({ user, isFollowing, onFollow, onUnfollow }: UserCardProps) => {
    return (
        <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-2xl border border-white/5 animate-fade-in">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" />

            <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{user.displayName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <Trophy className="w-3.5 h-3.5 text-primary-400" />
                    <span className="text-xs text-white/50">{user.score} Punkte</span>
                    <span className="text-xs text-white/30">•</span>
                    <span className="text-xs text-white/50">{user.followers.length} Follower</span>
                </div>
            </div>

            {isFollowing ? (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onUnfollow(user.uid)}
                >
                    <UserMinus className="w-4 h-4" />
                    Entfolgen
                </Button>
            ) : (
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onFollow(user.uid)}
                >
                    <UserPlus className="w-4 h-4" />
                    Folgen
                </Button>
            )}
        </div>
    );
};

export default UserCard;
