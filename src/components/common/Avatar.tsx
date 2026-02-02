interface AvatarProps {
    src?: string;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onClick?: () => void;
}

const Avatar = ({
    src,
    alt = 'Avatar',
    size = 'md',
    className = '',
    onClick
}: AvatarProps) => {
    const sizes = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-20 h-20'
    };

    const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${alt}`;

    return (
        <div
            className={`${sizes[size]} rounded-full overflow-hidden ring-2 ring-white/10 ring-offset-2 ring-offset-dark-900 flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            <img
                src={src || fallback}
                alt={alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = fallback;
                }}
            />
        </div>
    );
};

export default Avatar;
