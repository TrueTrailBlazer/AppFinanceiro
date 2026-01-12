import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Zap, LogOut, ChevronRight, Shield, Wallet } from 'lucide-react';
import { RecurringExpenses } from '../components/settings/RecurringExpenses';
import { SecuritySettings } from '../components/settings/SecuritySettings';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'recurring' | 'security'

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login'; // Força refresh para limpar estados
  };

  const MenuItem = ({ icon: Icon, label, subLabel, onClick, color = "text-white", danger = false }) => (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center justify-between p-4 bg-[#121212] border border-[#222] hover:bg-[#1a1a1a] transition-all group first:rounded-t-2xl last:rounded-b-2xl border-b-0 last:border-b active:scale-[0.99]`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${danger ? 'bg-red-500/10 text-red-500' : 'bg-[#1a1a1a] text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors'}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className={`font-semibold text-sm ${danger ? 'text-red-500' : 'text-white'}`}>{label}</p>
          {subLabel && <p className="text-[10px] text-gray-500 mt-0.5">{subLabel}</p>}
        </div>
      </div>
      {!danger && <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400" />}
    </button>
  );

  // --- ROTEAMENTO INTERNO ---
  if (currentView === 'recurring') {
    return <RecurringExpenses onBack={() => setCurrentView('menu')} />;
  }
  if (currentView === 'security') {
    return <SecuritySettings onBack={() => setCurrentView('menu')} />;
  }

  // --- MENU PRINCIPAL ---
  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-300 pb-24 max-w-lg mx-auto space-y-6">
      
      {/* Hero Profile */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px] shadow-2xl shadow-blue-900/20 mb-4">
            <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center text-3xl font-bold text-white uppercase">
                {user?.email?.[0]}
            </div>
        </div>
        <h2 className="text-lg font-bold text-white">{user?.email?.split('@')[0]}</h2>
        <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
      </div>

      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gestão</h3>
        <div className="flex flex-col shadow-sm">
            <MenuItem 
                icon={Zap} 
                label="Despesas Fixas" 
                subLabel="Gerencie suas contas recorrentes"
                onClick={() => setCurrentView('recurring')}
            />
            <MenuItem 
                icon={Wallet} 
                label="Metas Financeiras" 
                subLabel="Planeje seu futuro (Em breve)"
                onClick={() => alert('Em desenvolvimento')}
            />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Conta</h3>
        <div className="flex flex-col shadow-sm">
            <MenuItem 
                icon={Shield} 
                label="Segurança" 
                subLabel="Alterar senha e privacidade"
                onClick={() => setCurrentView('security')}
            />
        </div>
      </div>

      <div className="pt-4 px-1">
        <MenuItem 
            icon={LogOut} 
            label="Sair da Conta" 
            danger={true}
            onClick={handleLogout}
        />
      </div>

      <p className="text-center text-[10px] text-gray-700 pt-6">Versão 1.0.3 • Fluxo</p>
    </div>
  );
}