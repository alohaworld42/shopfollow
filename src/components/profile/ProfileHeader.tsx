import { Trophy, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { Avatar, Card } from '../common';
import type { User } from '../../types';

interface ProfileHeaderProps {
    user: User;
    productCount: number;
    totalSpending: number;
}

const ProfileHeader = ({ user, productCount, totalSpending }: ProfileHeaderProps) => {
    return (
        <div className="px-4 space-y-6">
            {/* Profile Info */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="p-1 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                        <Avatar src={user.avatarUrl} alt={user.displayName} size="xl" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white truncate">{user.displayName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Trophy className="w-4 h-4 text-primary-400" />
                        <span className="text-primary-400 font-medium">{user.score} Style Score</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
                <Card glass padding="sm" className="text-center">
                    <div className="flex flex-col items-center gap-1">
                        <ShoppingBag className="w-5 h-5 text-primary-400" />
                        <p className="text-xl font-bold text-white">{productCount}</p>
                        <p className="text-xs text-white/50">Items</p>
                    </div>
                </Card>

                <Card glass padding="sm" className="text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Users className="w-5 h-5 text-secondary-500" />
                        <p className="text-xl font-bold text-white">{user.followers.length}</p>
                        <p className="text-xs text-white/50">Follower</p>
                    </div>
                </Card>

                <Card glass padding="sm" className="text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Users className="w-5 h-5 text-accent-500" />
                        <p className="text-xl font-bold text-white">{user.following.length}</p>
                        <p className="text-xs text-white/50">Following</p>
                    </div>
                </Card>
            </div>

            {/* Spending Widget */}
            <Card glass padding="md" className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-white/50 mb-1">Gesamtausgaben</p>
                    <p className="text-2xl font-bold gradient-text">
                        €{totalSpending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500/30 to-secondary-500/30 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-primary-400" />
                </div>
            </Card>
        </div>
    );
};

export default ProfileHeader;
