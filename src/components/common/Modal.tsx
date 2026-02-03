import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'full';
}

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}: ModalProps) => {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { maxWidth: '380px' },
        md: { maxWidth: '480px' },
        lg: { maxWidth: '640px' },
        full: { maxWidth: 'calc(100% - 32px)', height: '90vh' }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-5)'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)'
                }}
            />

            {/* Modal Content */}
            <div style={{
                position: 'relative',
                width: '100%',
                ...sizeStyles[size],
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xl)',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                {/* Header */}
                {title && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-5) var(--space-6)',
                        borderBottom: '1px solid var(--border-subtle)'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                        }}>{title}</h2>
                        <button
                            onClick={onClose}
                            style={{
                                padding: 'var(--space-2)',
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div style={{
                    overflowY: size === 'full' ? 'auto' : undefined,
                    maxHeight: size === 'full' ? 'calc(90vh - 80px)' : undefined
                }}>
                    {!title && (
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: 'var(--space-4)',
                                right: 'var(--space-4)',
                                padding: 'var(--space-2)',
                                borderRadius: '50%',
                                background: 'var(--bg-glass)',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
