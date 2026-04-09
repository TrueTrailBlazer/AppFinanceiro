import { useNotifications } from '../../contexts/NotificationContext';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function CustomToaster() {
    const { toasts, removeToast } = useNotifications();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-[90vw] md:max-w-md space-y-3 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function Toast({ toast, onClose }) {
    const icons = {
        success: <CheckCircle2 className="text-green-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertCircle className="text-yellow-500" size={20} />
    };

    const colors = {
        success: 'border-green-500/20 shadow-green-500/5',
        error: 'border-red-500/20 shadow-red-500/5',
        info: 'border-blue-500/20 shadow-blue-500/5',
        warning: 'border-yellow-500/20 shadow-yellow-500/5'
    };

    return (
        <div className={`
            pointer-events-auto flex items-center gap-3 p-4 rounded-2xl bg-[#121212]/90 backdrop-blur-xl border ${colors[toast.type]} 
            shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300
        `}>
            <div className="shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium text-white">{toast.message}</p>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
                <X size={16} />
            </button>
        </div>
    );
}
