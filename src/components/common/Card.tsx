import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    glass?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
};

const Card = ({
    children,
    className = '',
    glass = false,
    padding = 'md',
    hover = false,
    onClick
}: CardProps) => {
    const baseClasses = 'rounded-2xl overflow-hidden';
    const glassClasses = glass
        ? 'glass-card'
        : 'bg-dark-800 border border-white/6';
    const hoverClasses = hover ? 'card-hover cursor-pointer' : '';
    const paddingClass = paddingClasses[padding];

    return (
        <div
            className={`${baseClasses} ${glassClasses} ${hoverClasses} ${paddingClass} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
