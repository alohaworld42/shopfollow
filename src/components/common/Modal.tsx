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

    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        full: 'max-w-full mx-4 h-[90vh]'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`relative w-full ${sizeStyles[size]} bg-dark-800 rounded-2xl border border-white/10 shadow-2xl animate-scale-in overflow-hidden`}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-white/60" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={`${size === 'full' ? 'overflow-y-auto max-h-[calc(90vh-80px)]' : ''}`}>
                    {!title && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-white/60" />
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
