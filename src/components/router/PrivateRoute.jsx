import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Carregando...</div>;
  
  // Se não tem sessão, manda pro login
  return session ? children : <Navigate to="/login" replace />;
}
