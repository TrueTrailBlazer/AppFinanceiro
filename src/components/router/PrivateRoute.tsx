import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Carregando...</div>;
  
  // Se não tem sessão, manda pro login
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}
