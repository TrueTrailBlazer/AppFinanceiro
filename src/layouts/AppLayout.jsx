import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Plus, Layers, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AppLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

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
              <Home size={22} /> Visão Geral
            </Link>
            <Link to="/extract" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/extract')}`}>
              <Layers size={22} /> Extrato
            </Link>
            <Link to="/settings" className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors hover:bg-white/5 ${isActive('/settings')}`}>
              <Settings size={22} /> Configurações
            </Link>
          </nav>
        </div>
        
        <button onClick={signOut} className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
          <LogOut size={22} /> Sair
        </button>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative scroll-smooth">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
           <Outlet />
        </div>
      </main>

      {/* --- BOTTOM BAR (Mobile - Thumb Zone) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-lg border-t border-[#222] px-6 py-2 flex justify-between items-end z-50 h-20 pb-4">
        
        <Link to="/" className={`flex flex-col items-center gap-1 w-16 ${isActive('/')}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium">Início</span>
        </Link>
        
        <Link to="/extract" className={`flex flex-col items-center gap-1 w-16 ${isActive('/extract')}`}>
          <Layers size={24} />
          <span className="text-[10px] font-medium">Extrato</span>
        </Link>

        {/* Botão Flutuante Central */}
        <Link to="/add" className="relative -top-5">
          <div className="bg-blue-600 rounded-full p-4 shadow-[0_0_20px_rgba(37,99,235,0.5)] border-4 border-[#050505] active:scale-95 transition-transform">
            <Plus size={28} color="white" />
          </div>
        </Link>

        <Link to="/settings" className={`flex flex-col items-center gap-1 w-16 ${isActive('/settings')}`}>
          <Settings size={24} />
          <span className="text-[10px] font-medium">Ajustes</span>
        </Link>

        <button onClick={signOut} className="flex flex-col items-center gap-1 w-16 text-gray-500 hover:text-red-500">
          <LogOut size={24} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>

      </nav>
    </div>
  );
}