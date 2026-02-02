import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Users } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Feed' },
        { path: '/network', icon: Users, label: 'Netzwerk' },
        { path: '/dashboard', icon: User, label: 'Profil' }
    ];

    return (
        <nav className="app-bottom-nav">
            <div className="app-bottom-nav-inner">
                {navItems.map(({ path, icon: Icon, label }) => {
                    const isActive = location.pathname === path;
                    return (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className={`flex flex-col items-center gap-1.5 py-2 px-8 rounded-xl transition-all ${isActive
                                    ? 'text-primary-400 bg-primary-500/10'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`w-6 h-6 transition-all ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-xs font-medium">{label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
