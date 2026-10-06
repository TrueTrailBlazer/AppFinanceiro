import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDate } from '../contexts/DateContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { monthTitle, changeMonth } = useDate();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const getUserName = () => {
    if (!user) return 'Visitante';
    const meta = user.user_metadata || {};
    const name = meta.first_name || meta.name || meta.full_name?.split(' ')[0] || user.email?.split('@')[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Visitante';
  };

  // Touch Handlers for month navigation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 75;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      changeMonth(1);
    }
    if (isRightSwipe) {
      changeMonth(-1);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-surface text-on-surface font-sans overflow-hidden antialiased selection:bg-primary selection:text-white">

      {/* --- HEADER MOBILE (Topo Fixo) --- */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-white/90 backdrop-blur-md border-b border-border-subtle">
        <div className="h-16 px-4 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            {location.pathname === '/' ? (
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Olá, {getUserName()} 👋
              </h1>
            ) : (
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {location.pathname === '/bills' ? 'Contas a Pagar' : 
                 location.pathname === '/extract' ? 'Extrato Bancário' : 
                 location.pathname === '/analysis' ? 'Análise' : 'App Financeiro'}
              </h1>
            )}
          </div>

          {/* Settings Action Button */}
          <button onClick={() => navigate('/settings')} aria-label="Configurações" className="w-10 h-10 rounded-full bg-white border border-border-subtle flex items-center justify-center text-on-surface-variant hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm" type="button">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main 
        id="main-content" 
        className="flex-1 flex flex-col relative w-full pt-[4.75rem] pb-24 overflow-y-auto scroll-smooth"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndEvent}
      >
        <div className="w-full md:max-w-4xl mx-auto px-4">
          <Outlet />
        </div>
      </main>

      {/* --- MENU MOBILE (Barra Inferior) --- */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-white/95 backdrop-blur-md border-t border-border-subtle">
        <div className="flex justify-between items-center h-16 px-6">
          
          {/* 1. Home */}
          <Link to="/" className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 transition-colors ${isActive('/') ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "'FILL' 0" }}>home</span>
            <span className="text-[11px]">Home</span>
          </Link>
          
          {/* 2. A Pagar */}
          <Link to="/bills" className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 transition-colors ${isActive('/bills') ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/bills') ? "'FILL' 1" : "'FILL' 0" }}>calendar_today</span>
            <span className="text-[11px] font-medium">A pagar</span>
          </Link>
          
          {/* 3. Botão Central Adicionar */}
          <Link to="/add" aria-label="Add Transaction" className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-primary text-white shadow-lg shadow-emerald-600/30 hover:bg-primary-dark transition-all transform active:scale-95">
            <span className="material-symbols-outlined text-[26px]">add</span>
          </Link>
          
          {/* 4. Extrato Bancário */}
          <Link to="/extract" className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 transition-colors ${isActive('/extract') ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/extract') ? "'FILL' 1" : "'FILL' 0" }}>receipt_long</span>
            <span className="text-[11px] font-medium">Extrato</span>
          </Link>
          
          {/* 5. Análise */}
          <Link to="/analysis" className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 transition-colors ${isActive('/analysis') ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/analysis') ? "'FILL' 1" : "'FILL' 0" }}>analytics</span>
            <span className="text-[11px] font-medium">Análise</span>
          </Link>

        </div>
      </nav>

    </div>
  );
}