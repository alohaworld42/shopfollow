import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { NotificationBell } from '../inbox';
import { useInbox } from '../../hooks';

const Header = () => {
    const navigate = useNavigate();
    const { unreadCount } = useInbox();

    return (
        <header className="app-header">
            <div className="app-header-inner">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold gradient-text">CartConnect</span>
                </div>

                {/* Notifications */}
                <NotificationBell
                    count={unreadCount}
                    onClick={() => navigate('/inbox')}
                />
            </div>
        </header>
    );
};

export default Header;
