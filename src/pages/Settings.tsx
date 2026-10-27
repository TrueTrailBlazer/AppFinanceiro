import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RecurringExpenses } from '../components/settings/RecurringExpenses';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { FinancialGoals } from '../components/settings/FinancialGoals';
import { BankConnections } from '../components/settings/BankConnections';

type SettingsView = 'menu' | 'profile' | 'recurring' | 'security' | 'goals' | 'banks';

interface MenuItem {
  view: Exclude<SettingsView, 'menu'>;
  icon: string;
  title: string;
  subtitle: string;
}

const MENU_ITEMS: MenuItem[] = [
  { view: 'profile', icon: 'person', title: 'Meu Perfil', subtitle: 'Alterar nome e foto de perfil' },
  { view: 'banks', icon: 'account_balance', title: 'Contas Bancárias', subtitle: 'Sincronização via Open Finance' },
  { view: 'recurring', icon: 'repeat', title: 'Despesas Fixas', subtitle: 'Contas que se repetem todo mês' },
  { view: 'goals', icon: 'flag', title: 'Metas Financeiras', subtitle: 'Seus objetivos de economia' },
  { view: 'security', icon: 'lock', title: 'Segurança', subtitle: 'Alterar senha de acesso' },
];

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

  const backToMenu = () => setCurrentView('menu');

  if (currentView === 'profile') return <ProfileSettings onBack={backToMenu} />;
  if (currentView === 'security') {
    return <SecuritySettings onBack={() => { backToMenu(); setIsRecovery(false); }} isRecovery={isRecovery} />;
  }
  if (currentView === 'goals') return <FinancialGoals onBack={backToMenu} />;
  if (currentView === 'recurring') return <RecurringExpenses onBack={backToMenu} />;
  if (currentView === 'banks') return <BankConnections onBack={backToMenu} />;

  const meta = user?.user_metadata || {};
  const userName = (meta.display_name as string | undefined) ||
                   (meta.first_name as string | undefined) ||
                   (meta.name as string | undefined) ||
                   (typeof meta.full_name === 'string' ? meta.full_name : undefined) ||
                   'Visitante';
  const userEmail = user?.email || '';
  const avatarUrl = meta.avatar_url as string | undefined;

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1 pb-6">

      {/* Perfil do Usuário */}
      <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-border-subtle flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[32px] text-slate-400">person</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[18px] font-bold text-slate-900 truncate">{userName}</span>
            <span className="text-[12px] font-medium text-slate-500 truncate">{userEmail}</span>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('profile')}
          aria-label="Editar Perfil"
          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95 shrink-0"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
      </div>

      {/* Menu de Navegação */}
      <div className="w-full bg-white rounded-3xl p-2 shadow-sm border border-border-subtle divide-y divide-slate-50">
        {MENU_ITEMS.map(item => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className="w-full py-3.5 px-3 flex items-center justify-between text-left rounded-2xl transition-colors hover:bg-slate-50 active:bg-slate-100"
            type="button"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 shrink-0">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-slate-900 truncate">{item.title}</p>
                <p className="text-[12px] font-medium text-slate-500 truncate">{item.subtitle}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0 pl-2">chevron_right</span>
          </button>
        ))}
      </div>

      {/* Sair */}
      <div className="pt-2 pb-6 px-1 flex flex-col items-center">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 px-4 rounded-2xl bg-white text-rose-600 border border-border-subtle font-bold text-[16px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] hover:bg-rose-50 hover:border-rose-100"
          type="button"
        >
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
