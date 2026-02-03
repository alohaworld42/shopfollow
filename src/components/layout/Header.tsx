import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Bell } from 'lucide-react';
import { useInbox } from '../../hooks';

const Header = () => {
    const navigate = useNavigate();
    const { unreadCount } = useInbox();

    return (
        <header className="app-header">
            <div className="app-header-inner">
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ShoppingBag size={20} color="white" />
                    </div>
                    <span style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        CartConnect
                    </span>
                </div>

                {/* Notification Bell */}
                <button
                    onClick={() => navigate('/inbox')}
                    style={{
                        position: 'relative',
                        width: '44px',
                        height: '44px',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                    }}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '18px',
                            height: '18px',
                            background: 'var(--color-error)',
                            borderRadius: '50%',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
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
