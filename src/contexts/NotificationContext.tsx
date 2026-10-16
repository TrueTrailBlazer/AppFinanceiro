import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export interface ConfirmState {
    message: string;
    title: string;
    resolve: (value: boolean) => void;
}

export interface NotificationContextType {
    showAlert: (message: string, type?: ToastType) => void;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
    confirmState: ConfirmState | null;
    handleConfirm: (value: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const showAlert = useCallback((message: string, type: ToastType = 'info') => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        setToasts(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const showConfirm = useCallback((message: string, title: string = 'Confirmação') => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({ message, title, resolve });
        });
    }, []);

    const handleConfirm = useCallback((value: boolean) => {
        if (confirmState?.resolve) {
            confirmState.resolve(value);
        }
        setConfirmState(null);
    }, [confirmState]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value = useMemo<NotificationContextType>(() => ({
        showAlert,
        showConfirm,
        toasts,
        removeToast,
        confirmState,
        handleConfirm
    }), [showAlert, showConfirm, toasts, removeToast, confirmState, handleConfirm]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextType {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
    }
    return context;
}
