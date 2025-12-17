import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

// Páginas
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import Extract from './pages/Extract.jsx';
import Settings from './pages/Settings.jsx';
import Analysis from './pages/Analysis.jsx'; // <--- Nova Importação

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando Fluxo...</div>;
  return session ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/extract" element={<Extract />} />
            <Route path="/analysis" element={<Analysis />} /> {/* <--- Nova Rota */}
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}