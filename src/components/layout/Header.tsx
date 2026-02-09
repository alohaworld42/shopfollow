import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Bell } from 'lucide-react';
import { useInbox } from '../../hooks';

const Header = () => {
    const navigate = useNavigate();
    const { unreadCount } = useInbox();

    return (
        <header className="app-header glass-panel" style={{ borderBottom: 'none' }}>
            <div className="app-header-inner">
                {/* Logo - generous spacing */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                    }}>
                        <ShoppingBag size={22} color="white" strokeWidth={1.5} />
                    </div>
                    <span style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.8) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        ShopFollow
                    </span>
                </div>

                {/* Notification Bell */}
                <button
                    onClick={() => navigate('/inbox')}
                    className="glass-button"
                    style={{
                        position: 'relative',
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <Bell size={22} strokeWidth={1.5} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '18px',
                            height: '18px',
                            background: 'var(--color-error)',
                            borderRadius: '50%',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            border: '2px solid var(--bg-base)'
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
