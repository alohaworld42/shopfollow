import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Users, User, Plus, Settings, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Explore' },
    { path: '/network', icon: Users, label: 'Network' },
    { path: '/profile', icon: User, label: 'Profile' },
];

export const Sidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <aside className="desktop-sidebar">
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo">
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ShoppingBag size={16} color="white" strokeWidth={2} />
                    </div>
                    <span>ShopFollow</span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`sidebar-nav-item ${location.pathname === path ? 'active' : ''}`}
                    >
                        <Icon size={20} strokeWidth={1.5} />
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-actions">
                <Link to="/profile" className="sidebar-create-btn">
                    <Plus size={18} />
                    <span>New Post</span>
                </Link>
            </div>

            {user && (
                <div className="sidebar-footer">
                    <Link to="/settings" className="sidebar-settings">
                        <Settings size={18} strokeWidth={1.5} />
                        <span>Settings</span>
                    </Link>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
