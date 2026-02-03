import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: ReactNode;
}

const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    className = '',
    disabled,
    style,
    ...props
}: ButtonProps) => {
    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
            border: 'none'
        },
        secondary: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: 'none'
        },
        danger: {
            background: 'linear-gradient(135deg, var(--color-error) 0%, #B91C1C 100%)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
            border: 'none'
        }
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: '8px 16px', fontSize: '13px', gap: '6px', minHeight: '36px' },
        md: { padding: '12px 20px', fontSize: '14px', gap: '8px', minHeight: '44px' },
        lg: { padding: '14px 24px', fontSize: '15px', gap: '10px', minHeight: '52px' }
    };

    return (
        <button
            className={className}
            disabled={disabled || loading}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s ease',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.5 : 1,
                ...variantStyles[variant],
                ...sizeStyles[size],
                ...style
            }}
            {...props}
        >
            {loading && (
                <svg
                    style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }}
                    viewBox="0 0 24 24"
                >
                    <circle
                        style={{ opacity: 0.25 }}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        style={{ opacity: 0.75 }}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;
