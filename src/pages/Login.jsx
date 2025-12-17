import { useState } from 'react';
import { supabase } from '../services/supabase.js';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.includes('@') || !email.includes('.')) {
      setError('Digite um email válido.');
      return false;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    setError('');
    return true;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error: authError } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        throw authError;
      } else if (isSignUp) {
        alert("Sucesso! Verifique seu email para confirmar o cadastro.");
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Email ou senha incorretos." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#050505] text-white">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/20 mb-6">
            <span className="text-3xl font-bold">F</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Bem-vindo</h1>
          <p className="text-gray-500">Gerencie suas finanças com inteligência.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="email" 
                placeholder="Seu melhor email" 
                value={email} 
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full bg-[#121212] border border-[#222] rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all" 
                required 
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="Sua senha secreta" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-[#121212] border border-[#222] rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {isSignUp ? 'Criar Conta' : 'Acessar Conta'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }} 
            className="text-sm text-gray-500 hover:text-white transition-colors py-2"
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Crie uma agora'}
          </button>
        </div>
      </div>
    </div>
  );
}