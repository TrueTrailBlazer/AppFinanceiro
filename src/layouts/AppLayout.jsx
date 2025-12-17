import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Plus, Layers, User, BarChart3 } from 'lucide-react';

export function AppLayout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path 
    ? "text-blue-500" 
    : "text-gray-500 hover:text-gray-300";

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white md:flex-row overflow-hidden">
      
      {/* --- SIDEBAR (PC) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#121212] border-r border-[#222] p-6 justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-10">
            Fluxo
          </h1>
          <nav className="space-y-4">
            <Link to="/" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/')}`}>
              <Home size={22} /> Visão Mensal
            </Link>
            <Link to="/extract" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/extract')}`}>
              <Layers size={22} /> Extrato
            </Link>
            <Link to="/analysis" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/analysis')}`}>
              <BarChart3 size={22} /> Análise
            </Link>
            <Link to="/settings" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/settings')}`}>
              <User size={22} /> Perfil
            </Link>
          </nav>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative scroll-smooth">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
           <Outlet />
        </div>
      </main>

      {/* --- MENU MOBILE (Compacto) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#222] px-4 pb-4 pt-2 flex justify-between items-end z-50">
        
        <Link to="/" className={`flex flex-col items-center gap-1 w-14 active:scale-95 transition-transform ${isActive('/')}`}>
          <Home size={20} />
          <span className="text-[10px] font-medium">Mês</span>
        </Link>
        
        <Link to="/extract" className={`flex flex-col items-center gap-1 w-14 active:scale-95 transition-transform ${isActive('/extract')}`}>
          <Layers size={20} />
          <span className="text-[10px] font-medium">Extrato</span>
        </Link>

        {/* Botão Flutuante Central (Mais compacto) */}
        <Link to="/add" className="relative -top-5">
          <div className="bg-blue-600 rounded-full p-3.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] border-4 border-[#050505] active:scale-90 transition-transform">
            <Plus size={24} color="white" />
          </div>
        </Link>

        <Link to="/analysis" className={`flex flex-col items-center gap-1 w-14 active:scale-95 transition-transform ${isActive('/analysis')}`}>
          <BarChart3 size={20} />
          <span className="text-[10px] font-medium">Análise</span>
        </Link>
        
        <Link to="/settings" className={`flex flex-col items-center gap-1 w-14 active:scale-95 transition-transform ${isActive('/settings')}`}>
          <User size={20} />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>

      </nav>
    </div>
  );
}