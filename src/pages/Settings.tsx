import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RecurringExpenses } from '../components/settings/RecurringExpenses';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { FinancialGoals } from '../components/settings/FinancialGoals';
import { BankConnections } from '../components/settings/BankConnections';
import { CSVImport } from '../components/settings/CSVImport';

type SettingsView = 'menu' | 'profile' | 'recurring' | 'security' | 'goals' | 'csv' | 'banks';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [isRecovery, setIsRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
  });
  const [currentView, setCurrentView] = useState<SettingsView>(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery'))) {
      return 'security';
    }
    return 'menu';
  });
  const [isLightMode, setIsLightMode] = useState<boolean>(() => 
    typeof document !== 'undefined' ? !document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentView('security');
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login'; // Força refresh para limpar estados
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isLightMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsLightMode(false);
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsLightMode(true);
    }
  };

  if (currentView === 'profile') {
    return <ProfileSettings onBack={() => setCurrentView('menu')} />;
  }
  if (currentView === 'security') {
    return <SecuritySettings onBack={() => { setCurrentView('menu'); setIsRecovery(false); }} isRecovery={isRecovery} />;
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
    return <CSVImport onBack={() => setCurrentView('menu')} />;
  }

  const meta = user?.user_metadata || {};
  const userName = (meta.display_name as string | undefined) ||
                   (meta.first_name as string | undefined) || 
                   (meta.name as string | undefined) || 
                   (typeof meta.full_name === 'string' ? meta.full_name : undefined) || 
                   'Visitante';
  const userEmail = user?.email || 'email@exemplo.com';
  const avatarUrl = meta.avatar_url as string | undefined;

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1 pb-6">
      
      {/* Perfil do Usuário Minimalista */}
      <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-border-subtle flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[32px] text-slate-400">person</span>
            )}
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

        {/* 6. Importar CSV */}
        <button onClick={() => setCurrentView('csv')} className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 truncate">Importar Extrato (CSV)</p>
              <p className="text-[12px] font-medium text-slate-500 truncate">Adicione transações em lote</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 pl-2">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </div>
        </button>

        {/* 7. Aparência & Geral */}
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
