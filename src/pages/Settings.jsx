import { useAuth } from '../contexts/AuthContext';
import { User, Shield, LogOut, ChevronRight, Wallet } from 'lucide-react';

export default function Settings() {
  const { user, signOut } = useAuth();

  const MenuItem = ({ icon: Icon, label, subLabel, onClick, color = "text-white" }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-[#121212] border border-[#222] hover:border-gray-700 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b-0 last:border-b group">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-[#0a0a0a] ${color}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className={`font-medium ${color}`}>{label}</p>
          {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-600 group-hover:text-gray-400" />
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Cabeçalho do Perfil */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl mb-4">
          {user?.email?.[0].toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{user?.email?.split('@')[0]}</h2>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Menu de Opções */}
      <div className="flex flex-col rounded-2xl shadow-sm">
        <div className="text-xs font-bold text-gray-500 uppercase ml-4 mb-2 tracking-wider">Conta</div>
        <MenuItem icon={User} label="Dados Pessoais" subLabel="Nome, email e telefone" />
        <MenuItem icon={Wallet} label="Minhas Contas" subLabel="Gerenciar bancos e cartões" />
        <MenuItem icon={Shield} label="Segurança" subLabel="Senha e autenticação" />
      </div>

      <div className="flex flex-col">
        <button 
          onClick={signOut} 
          className="w-full p-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} /> Sair do App
        </button>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-700">Fluxo v1.2.0</p>
      </div>
    </div>
  );
}