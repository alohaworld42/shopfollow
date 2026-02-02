import { useState } from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
    count: number;
    onClick: () => void;
}

const NotificationBell = ({ count, onClick }: NotificationBellProps) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        setIsAnimating(true);
        onClick();
        setTimeout(() => setIsAnimating(false), 500);
    };

    return (
        <button
            onClick={handleClick}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        >
            <Bell className={`w-6 h-6 text-white ${isAnimating ? 'animate-wiggle' : ''}`} />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;
