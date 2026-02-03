import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Inbox, User } from 'lucide-react';
import { useInbox } from '../../hooks';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useInbox();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/add', icon: Plus, label: 'Add', special: true },
        { path: '/inbox', icon: Inbox, label: 'Inbox', badge: unreadCount > 0 ? unreadCount : undefined },
        { path: '/dashboard', icon: User, label: 'Profile' }
    ];

    return (
        <nav className="app-bottom-nav">
            <div className="app-bottom-nav-inner">
                {navItems.map(({ path, icon: Icon, label, special, badge }) => {
                    const isActive = location.pathname === path;

                    if (special) {
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                                    borderRadius: '14px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                                }}
                            >
                                <Icon size={24} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            style={{
                                position: 'relative',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Icon size={24} />
                            <span className="nav-item-label">{label}</span>
                            {badge && (
                                <span style={{
                                    position: 'absolute',
                                    top: '0',
                                    right: '0',
                                    width: '18px',
                                    height: '18px',
                                    background: 'var(--color-error)',
                                    borderRadius: '50%',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    {badge > 9 ? '9+' : badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
