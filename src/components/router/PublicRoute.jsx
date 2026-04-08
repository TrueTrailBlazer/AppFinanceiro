import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function PublicRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Carregando...</div>;

  // Se tem sessão, não deixa ver rotas públicas (como login), manda pra Home
  return session ? <Navigate to="/" replace /> : children;
}
