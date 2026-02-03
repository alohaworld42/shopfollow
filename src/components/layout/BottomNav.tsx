import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useInbox } from '../../hooks';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useInbox();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/search', icon: Users, label: 'Find' }, // Changed to Find with Users icon
        { path: '/reviews', icon: MessageSquare, label: 'Discuss' }, // Changed Add to Discuss
        { path: '/purchases', icon: ShoppingBag, label: 'Orders', badge: unreadCount > 0 ? unreadCount : undefined },
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dash' }
    ];

    return (
        <nav className="app-bottom-nav">
            <div className="app-bottom-nav-inner">
                {navItems.map(({ path, icon: Icon, label, badge }) => {
                    const isActive = location.pathname === path;

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
                            <Icon size={24} strokeWidth={1.5} />
                            <span className="nav-item-label">{label}</span>
                            {badge && (
                                <span style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '4px',
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
