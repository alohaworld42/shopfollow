import { ReactNode, CSSProperties } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    glass?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
    style?: CSSProperties;
}

export type { CardProps };

const paddingStyles: Record<string, string> = {
    none: '0',
    sm: 'var(--space-3)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)'
};

const Card = ({
    children,
    className = '',
    glass = false,
    padding = 'md',
    hover = false,
    onClick,
    style
}: CardProps) => {
    return (
        <div
            className={className}
            onClick={onClick}
            style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: glass ? 'var(--bg-secondary)' : 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                backdropFilter: glass ? 'blur(16px)' : undefined,
                padding: paddingStyles[padding],
                cursor: hover || onClick ? 'pointer' : undefined,
                transition: hover ? 'all 0.2s ease' : undefined,
                ...style
            }}
        >
            {children}
        </div>
    );
};

export default Card;
