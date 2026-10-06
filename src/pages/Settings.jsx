import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { User, Zap, LogOut, ChevronRight, Shield, Wallet, FileSpreadsheet, Moon, Sun, ArrowLeft, Hammer, Building2 } from 'lucide-react';
import { RecurringExpenses } from '../components/settings/RecurringExpenses';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { FinancialGoals } from '../components/settings/FinancialGoals';
import { BankConnections } from '../components/settings/BankConnections';

function MenuItem({ icon: Icon, label, subLabel, onClick, color = "text-foreground", danger = false, customRight }) {
  return (
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
}

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
  if (currentView === 'banks') {
    return <BankConnections onBack={() => setCurrentView('menu')} />;
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

  const userName = user?.user_metadata?.first_name || user?.user_metadata?.name || user?.user_metadata?.full_name || 'Visitante';
  const userEmail = user?.email || 'email@exemplo.com';

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1 pb-6">
      
      {/* Perfil do Usuário Minimalista */}
      <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-border-subtle flex items-center justify-center">
             <span className="material-symbols-outlined text-[32px] text-slate-400">person</span>
             <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-600 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-slate-900 truncate">{userName}</span>
            </div>
            <span className="text-[12px] font-medium text-slate-500 truncate">{userEmail}</span>
            <div className="mt-1 flex items-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                <span className="material-symbols-outlined text-[13px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                Plano Pessoal
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setCurrentView('profile')} aria-label="Editar Perfil" className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95 shrink-0" type="button">
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
      </div>

      {/* Menu de Navegação / Hub de Configurações */}
      <div className="w-full bg-white rounded-3xl p-2 shadow-sm border border-border-subtle divide-y divide-slate-50">
        
        {/* 1. Preferências da Conta */}
        <button onClick={() => setCurrentView('profile')} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Preferências da Conta</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Moeda padrão (BRL), ciclo contábil</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400 shrink-0 pl-2">
            <span className="text-[12px] font-bold text-emerald-700">BRL</span>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </div>
        </button>

        {/* 2. Contas Bancárias (Pluggy) */}
        <button onClick={() => setCurrentView('banks')} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Contas Bancárias</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Sincronização via Open Finance</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 pl-2">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </div>
        </button>

        {/* 3. Segurança & Acesso */}
        <button onClick={() => setCurrentView('security')} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Segurança & Acesso</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Alteração de senha e privacidade</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400 shrink-0 pl-2">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </div>
        </button>

        {/* 4. Gerenciar Categorias & Recorrentes */}
        <button onClick={() => setCurrentView('recurring')} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">category</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Despesas Fixas</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Gerenciar assinaturas e contas mensais</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pl-2">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
          </div>
        </button>

        {/* 5. Metas Financeiras */}
        <button onClick={() => setCurrentView('goals')} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Metas Financeiras</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Planeje seu futuro</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 pl-2">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </div>
        </button>

        {/* 6. Aparência & Geral */}
        <button onClick={toggleTheme} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">palette</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Aparência & Geral</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Tema {isLightMode ? 'Claro' : 'Escuro'} e versão</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400 shrink-0 pl-2">
             <div className={`w-10 h-6 rounded-full border relative flex items-center px-1 shrink-0 transition-colors ${!isLightMode ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-200 border-slate-300'}`}>
                <div className={`w-4 h-4 rounded-full transition-transform ${!isLightMode ? 'bg-emerald-600 translate-x-4' : 'bg-white translate-x-0'}`} />
             </div>
          </div>
        </button>
      </div>

      {/* Ação Sutil de Sair */}
      <div className="pt-2 pb-6 px-1 flex flex-col items-center">
        <button onClick={handleLogout} className="w-full py-3.5 px-4 rounded-2xl bg-white text-rose-600 border border-border-subtle font-bold text-[16px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] hover:bg-rose-50 hover:border-rose-100" type="button">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sair da Conta
        </button>
        <p className="mt-4 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">
          App Financeiro • v1.0.4
        </p>
      </div>
    </div>
  );
}