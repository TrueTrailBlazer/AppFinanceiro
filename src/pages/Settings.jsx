import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { User, Zap, LogOut, ChevronRight, Shield, Wallet, FileSpreadsheet, Moon, Sun, ArrowLeft, Hammer } from 'lucide-react';
import { RecurringExpenses } from '../components/settings/RecurringExpenses';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { FinancialGoals } from '../components/settings/FinancialGoals';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { showAlert } = useNotifications();
  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'profile' | 'recurring' | 'security' | 'goals' | 'csv'
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    setIsLightMode(document.documentElement.classList.contains('light'));
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login'; // Força refresh para limpar estados
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isLightMode) {
        root.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        setIsLightMode(false);
    } else {
        root.classList.add('light');
        localStorage.setItem('theme', 'light');
        setIsLightMode(true);
    }
  };

  const MenuItem = ({ icon: Icon, label, subLabel, onClick, color = "text-foreground", danger = false, customRight }) => (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center justify-between p-4 bg-card border border-border hover:bg-card-hover transition-all group first:rounded-t-2xl last:rounded-b-2xl border-b-0 last:border-b active:scale-[0.99]`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl transition-colors ${danger ? 'bg-red-500/10 text-red-500' : 'bg-card-alt text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-500/10'}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className={`font-semibold text-sm ${danger ? 'text-red-500' : 'text-foreground'}`}>{label}</p>
          {subLabel && <p className="text-[10px] text-gray-500 mt-0.5">{subLabel}</p>}
        </div>
      </div>
      {customRight ? customRight : (!danger && <ChevronRight size={16} className="text-gray-500 group-hover:text-gray-400" />)}
    </button>
  );

  if (currentView === 'profile') {
    return <ProfileSettings onBack={() => setCurrentView('menu')} />;
  }
  if (currentView === 'security') {
    return <SecuritySettings onBack={() => setCurrentView('menu')} />;
  }
  if (currentView === 'goals') {
    return <FinancialGoals onBack={() => setCurrentView('menu')} />;
  }
  if (currentView === 'recurring') {
    return <RecurringExpenses onBack={() => setCurrentView('menu')} />;
  }
  
  if (currentView === 'csv') {
    // Under construction modal view
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg mx-auto flex flex-col h-[80vh] justify-center items-center text-center p-6">
            <div className="w-20 h-20 bg-card rounded-full border border-border flex items-center justify-center mb-6 shadow-2xl">
                <Hammer size={32} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Em Construção</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-[250px]">
                A funcionalidade de importar extrato via arquivo CSV está passando por manutenção e melhorias. Em breve estará de volta!
            </p>
            <button 
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
                <ArrowLeft size={18} /> Voltar
            </button>
        </div>
    );
  }

  // --- MENU PRINCIPAL (CONFIGURAÇÕES) ---
  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-300 max-w-lg mx-auto space-y-6 md:pb-8">
      
      <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Configurações</h1>
      </div>

      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Conta e Preferências</h3>
        <div className="flex flex-col shadow-sm">
            <MenuItem 
                icon={User} 
                label="Meu Perfil" 
                subLabel="Edite seu nome, foto e dados"
                onClick={() => setCurrentView('profile')}
            />
            <MenuItem 
                icon={Shield} 
                label="Segurança" 
                subLabel="Alterar senha e privacidade"
                onClick={() => setCurrentView('security')}
            />
            <MenuItem 
                icon={isLightMode ? Sun : Moon} 
                label="Tema Visual" 
                subLabel={isLightMode ? 'Modo Claro ativado' : 'Modo Escuro ativado'}
                onClick={toggleTheme}
                customRight={
                    <div className={`w-10 h-6 rounded-full border border-border relative flex items-center px-1 shrink-0 transition-colors ${isLightMode ? 'bg-blue-100 border-blue-300' : 'bg-background'}`}>
                        <div className={`w-4 h-4 rounded-full transition-transform ${isLightMode ? 'bg-blue-500 translate-x-4' : 'bg-gray-500 translate-x-0'}`} />
                    </div>
                }
            />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gestão e Ferramentas</h3>
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
                subLabel="Planeje seu futuro"
                onClick={() => setCurrentView('goals')}
            />
            <MenuItem 
                icon={FileSpreadsheet} 
                label="Importar Extrato" 
                subLabel="Ferramenta em manutenção"
                onClick={() => setCurrentView('csv')}
            />
        </div>
      </div>

      <div className="pt-4 px-1">
        <MenuItem 
            icon={LogOut} 
            label="Sair da Conta" 
            danger={true}
            onClick={handleLogout}
            customRight={<div/>}
        />
      </div>

      <p className="text-center text-[10px] text-gray-500 font-medium pt-6 uppercase tracking-widest pb-8">Fluxo App • v1.0.3</p>
    </div>
  );
}