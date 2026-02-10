import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, User, Settings } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/profile', icon: PlusCircle, label: 'Add', isAdd: true },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="app-bottom-nav">
            <div className="app-bottom-nav-inner">
                {navItems.map(({ path, icon: Icon, label, isAdd }, i) => {
                    const isActive = location.pathname === path && !isAdd;

                    return (
                        <button
                            key={`${path}-${i}`}
                            onClick={() => navigate(path)}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            style={isAdd ? {
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-primary)',
                            } : {
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <Icon size={isAdd ? 28 : 22} strokeWidth={isAdd ? 1.5 : 1.5} />
                            <span className="nav-item-label">{label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
