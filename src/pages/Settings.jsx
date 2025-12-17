import { useAuth } from '../contexts/AuthContext';
import { User, Shield, LogOut } from 'lucide-react';

export default function Settings() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="bg-[#121212] border border-[#222] rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
          {user?.email?.[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm text-gray-500">Conta conectada</p>
          <p className="font-bold text-lg">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-500 uppercase ml-2">Geral</p>
        <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center gap-3 text-gray-300">
            <User size={20} /> Editar Perfil <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded ml-auto">Em breve</span>
          </div>
          <div className="p-4 flex items-center gap-3 text-gray-300">
            <Shield size={20} /> Segurança <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded ml-auto">Em breve</span>
          </div>
        </div>
      </div>

      <button onClick={signOut} className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors">
        <LogOut size={20} /> Desconectar da conta
      </button>

      <p className="text-center text-xs text-gray-600 mt-10">
        Versão 1.0.0 • FluxoApp
      </p>
    </div>
  );
}