import { useState } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert(error.message);
    } else if (isSignUp) {
        alert("Verifique seu email para confirmar!");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#050505] text-white">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">Fluxo</h1>
          <p className="text-gray-500">Gerencie suas finanças em qualquer lugar.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500" size={20} />
            <input type="email" placeholder="Seu email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#121212] border border-[#222] rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 focus:outline-none transition-colors" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-500" size={20} />
            <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#121212] border border-[#222] rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 focus:outline-none transition-colors" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center shadow-lg shadow-blue-900/20">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta Grátis' : 'Entrar na Conta')}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm text-gray-500 hover:text-white transition-colors py-2">
          {isSignUp ? 'Já tem conta? Clique para entrar' : 'Não tem conta? Clique para criar'}
        </button>
      </div>
    </div>
  );
}