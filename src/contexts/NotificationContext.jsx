import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null); // { message, title, resolve }

    const showAlert = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        
        // Remove toast automaticamente após 4 segundos
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const showConfirm = useCallback((message, title = 'Confirmação') => {
        return new Promise((resolve) => {
            setConfirmState({ message, title, resolve });
        });
    }, []);

    const handleConfirm = (value) => {
        if (confirmState?.resolve) {
            confirmState.resolve(value);
        }
        setConfirmState(null);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showAlert, showConfirm, toasts, removeToast, confirmState, handleConfirm }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
    }
    return context;
}
