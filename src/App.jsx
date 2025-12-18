import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

// Páginas
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import Extract from './pages/Extract.jsx';
import Settings from './pages/Settings.jsx';
import Analysis from './pages/Analysis.jsx';

// Componente para proteger rotas privadas (Home, Extrato, etc)
function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando...</div>;
  
  // Se não tem sessão, manda pro login
  return session ? children : <Navigate to="/login" replace />;
}

// Componente para proteger rotas públicas (Login)
// Se já estiver logado, não deixa ver a tela de login, manda pra Home
function PublicRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando...</div>;

  // Se tem sessão, manda pra Home
  return session ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública (Login) */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* Rotas Privadas (App) */}
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/extract" element={<Extract />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Qualquer rota desconhecida manda pro Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}