import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.js'; // Ajuste o caminho se necessário

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    // Escuta mudanças em tempo real (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);