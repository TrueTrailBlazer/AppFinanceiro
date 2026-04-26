import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Plus, Layers, User, BarChart3, Settings } from 'lucide-react';

export function AppLayout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path
    ? "text-blue-500"
    : "text-gray-500 hover:text-gray-300";

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground md:flex-row overflow-hidden">

      {/* --- SIDEBAR (PC) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-6 justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8">
            Fluxo
          </h1>

          {/* NOVO BOTÃO DE ADICIONAR (PC) */}
          <Link to="/add" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-foreground text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 mb-6">
            <Plus size={18} /> Nova Transação
          </Link>

          <nav className="space-y-4">
            <Link to="/" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/')}`}>
              <Home size={20} /> Visão Mensal
            </Link>
            <Link to="/extract" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/extract')}`}>
              <Layers size={20} /> Extrato
            </Link>
            <Link to="/analysis" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/analysis')}`}>
              <BarChart3 size={20} /> Análise
            </Link>
            <Link to="/settings" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${isActive('/settings')}`}>
              <Settings size={20} /> Configurações
            </Link>
          </nav>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main id="main-content" className="flex-1 overflow-y-auto pb-24 md:pb-8 relative scroll-smooth bg-background">
        <div className="w-full md:max-w-4xl mx-auto px-4 py-8 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* --- MENU MOBILE --- */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-1 pb-4 pt-4 grid grid-cols-5 items-center justify-items-center z-50 transition-shadow duration-300"
        style={{ boxShadow: 'var(--nav-shadow, 0 -5px 20px rgba(0,0,0,0.8))' }}
      >

        <Link to="/" className={`flex flex-col items-center gap-1 w-full active:scale-95 transition-transform ${isActive('/')}`}>
          <Home size={22} />
          <span className="text-[9px] font-medium leading-none">Home</span>
        </Link>

        <Link to="/extract" className={`flex flex-col items-center gap-1 w-full active:scale-95 transition-transform ${isActive('/extract')}`}>
          <Layers size={22} />
          <span className="text-[9px] font-medium leading-none">Extrato</span>
        </Link>

        {/* Botão Central (Mobile) */}
        <div className="relative -top-6 flex justify-center w-full">
          <Link to="/add">
            <div className="bg-blue-600 rounded-full p-4 shadow-[0_0_15px_rgba(37,99,235,0.4)] border-[4px] border-background active:scale-90 transition-transform flex items-center justify-center">
              <Plus size={24} color="white" className="stroke-[3px]" />
            </div>
          </Link>
        </div>

        <Link to="/analysis" className={`flex flex-col items-center gap-1 w-full active:scale-95 transition-transform ${isActive('/analysis')}`}>
          <BarChart3 size={22} />
          <span className="text-[9px] font-medium leading-none">Análise</span>
        </Link>

        <Link to="/settings" className={`flex flex-col items-center gap-1 w-full active:scale-95 transition-transform ${isActive('/settings')}`}>
          <Settings size={22} />
          <span className="text-[9px] font-medium leading-none">Config.</span>
        </Link>

      </nav>

    </div>
  );
}