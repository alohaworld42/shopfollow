import { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'price';
    size?: 'sm' | 'md';
    className?: string;
}

const variantClasses = {
    default: 'bg-white/10 text-white',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    price: 'price-badge text-white'
};

const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
};

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    className = ''
}: BadgeProps) => {
    return (
        <span
            className={`
        inline-flex items-center justify-center
        font-semibold rounded-lg
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
};

export default Badge;
