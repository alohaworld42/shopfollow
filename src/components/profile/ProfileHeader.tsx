import { Trophy, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { Card } from '../common';
import type { User } from '../../types';

interface ProfileHeaderProps {
    user: User;
    productCount: number;
    totalSpending: number;
}

const ProfileHeader = ({ user, productCount, totalSpending }: ProfileHeaderProps) => {
    return (
        <div style={{ padding: '0 var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                <div style={{
                    padding: '3px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                }}>
                    <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid var(--bg-base)'
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {user.displayName}
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginTop: '4px'
                    }}>
                        <Trophy size={16} color="var(--color-primary-light)" />
                        <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                            {user.score} Style Score
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-3)'
            }}>
                <Card glass padding="md">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <ShoppingBag size={20} color="var(--color-primary-light)" />
                        <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {productCount}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Items</p>
                    </div>
                </Card>

                <Card glass padding="md">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <Users size={20} color="var(--color-secondary)" />
                        <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {user.followers.length}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Followers</p>
                    </div>
                </Card>

                <Card glass padding="md">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <Users size={20} color="var(--color-accent)" />
                        <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {user.following.length}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Following</p>
                    </div>
                </Card>
            </div>

            {/* Spending Widget */}
            <Card glass padding="md">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Total Spending
                        </p>
                        <p style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            €{totalSpending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <TrendingUp size={28} color="var(--color-primary-light)" />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProfileHeader;
