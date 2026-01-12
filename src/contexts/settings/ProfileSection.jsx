import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfileSection() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Card de Informação */}
      <div className="bg-[#121212] rounded-2xl border border-[#222] p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <User size={100} className="text-white"/>
        </div>
        
        <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            <Shield size={20} className="text-blue-500"/> Minha Conta
        </h2>

        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#222]">
                <div className="bg-[#222] p-3 rounded-full text-gray-400">
                    <Mail size={20} />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Email Cadastrado</p>
                    <p className="text-sm font-bold text-white break-all">{user?.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#222]">
                <div className="bg-[#222] p-3 rounded-full text-gray-400">
                    <User size={20} />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">ID do Usuário</p>
                    <p className="text-[10px] font-mono text-gray-400 break-all">{user?.id}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Zona de Perigo / Ações */}
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-900/30 text-red-500 hover:bg-red-900/10 active:scale-95 transition-all font-bold uppercase tracking-wider text-xs"
      >
        <LogOut size={18} /> Sair da conta
      </button>

      <p className="text-center text-[10px] text-gray-600 pt-4">
        Versão 1.0.0 • Fluxo Financeiro
      </p>
    </div>
  );
}