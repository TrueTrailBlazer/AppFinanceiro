import { useNotifications } from '../../contexts/NotificationContext';
import { AlertTriangle } from 'lucide-react';

export function CustomConfirm() {
    const { confirmState, handleConfirm } = useNotifications();

    if (!confirmState) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#121212] border border-[#222] rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-top-4 duration-300">
                
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">{confirmState.title}</h3>
                    <p className="text-sm text-gray-400">{confirmState.message}</p>
                </div>

                <div className="flex border-t border-[#222]">
                    <button 
                        onClick={() => handleConfirm(false)}
                        className="flex-1 px-4 py-4 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors border-r border-[#222]"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => handleConfirm(true)}
                        className="flex-1 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-500/5 transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
