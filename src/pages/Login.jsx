import { useState } from 'react';
import { supabase } from '../services/supabase.js';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Estados para feedback visual
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, digite um e-mail válido.');
      return false;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return false;
    }
    setError('');
    return true;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      if (isSignUp) {
        // --- FLUXO DE CADASTRO ---
        const { error: signUpError, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin // Redireciona de volta pro site após confirmar
          }
        });
        
        if (signUpError) throw signUpError;

        // Se o cadastro deu certo mas o usuário não veio logado,
        // significa que precisa confirmar o email.
        if (data.user && !data.session) {
          setSuccess("Conta criada com sucesso! Verifique sua caixa de entrada (e spam) para confirmar seu e-mail antes de entrar.");
          setIsSignUp(false); // Volta para a tela de login
          setEmail(''); 
          setPassword('');
        } else {
          // Caso raro onde o email confirm não é obrigatório no Supabase
          setSuccess("Conta criada! Você já pode entrar.");
        }

      } else {
        // --- FLUXO DE LOGIN ---
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (signInError) throw signInError;
        // Se der certo, o AuthContext vai detectar a sessão automaticamente e redirecionar
      }
    } catch (err) {
      let msg = err.message;
      if (msg.includes("Invalid login credentials")) msg = "E-mail ou senha incorretos.";
      if (msg.includes("User already registered")) msg = "Este e-mail já está cadastrado.";
      setError(msg);
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
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-gray-500">
            {isSignUp ? 'Comece a controlar suas finanças hoje.' : 'Acesse seus dados de qualquer lugar.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* MENSAGEM DE ERRO */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MENSAGEM DE SUCESSO */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-400 text-sm animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="email" 
                placeholder="Seu e-mail" 
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
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-[#121212] border border-[#222] rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all" 
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {isSignUp ? 'Cadastrar' : 'Entrar'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-gray-500 text-sm mb-2">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </p>
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }} 
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors text-sm uppercase tracking-wide"
          >
            {isSignUp ? 'Fazer Login' : 'Criar Conta Grátis'}
          </button>
        </div>
      </div>
    </div>
  );
}