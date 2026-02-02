import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { Toast as ToastType } from '../../types';

const Toast = ({ toast }: { toast: ToastType }) => {
    const { removeToast } = useToast();

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />
    };

    const backgrounds = {
        success: 'bg-green-500/10 border-green-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20'
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg animate-slide-up ${backgrounds[toast.type]}`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm text-white">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
                <X className="w-4 h-4 text-white/60" />
            </button>
        </div>
    );
};

export const ToastContainer = () => {
    const { toasts } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
};

export default Toast;
