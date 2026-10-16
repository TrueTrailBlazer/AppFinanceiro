import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  
  // Estados para feedback visual
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validate = (): boolean => {
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, digite um e-mail válido.');
      return false;
    }
    if (!isForgotPassword && password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, informe um e-mail válido para recuperação.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });

      if (resetError) throw resetError;

      setSuccess('Enviamos um link de redefinição para o seu e-mail. Verifique sua caixa de entrada e spam.');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || 'Erro ao solicitar redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isForgotPassword) {
      return handleResetPassword(e);
    }

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
          setSuccess('Conta criada com sucesso! Verifique sua caixa de entrada (e spam) para confirmar seu e-mail antes de entrar.');
          setIsSignUp(false); // Volta para a tela de login
          setEmail(''); 
          setPassword('');
        } else {
          // Caso raro onde o email confirm não é obrigatório no Supabase
          setSuccess('Conta criada! Você já pode entrar.');
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
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      let msg = errMsg;
      if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos.';
      if (msg.includes('User already registered')) msg = 'Este e-mail já está cadastrado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-surface text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* LOGO & BOAS-VINDAS */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4 text-white">
            <span className="material-symbols-outlined text-[30px]">account_balance_wallet</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isForgotPassword 
              ? 'Recuperar senha' 
              : isSignUp 
                ? 'Crie sua conta' 
                : 'Bem-vindo de volta'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isForgotPassword
              ? 'Informe seu e-mail cadastrado para receber as instruções de recuperação.'
              : isSignUp 
                ? 'Comece a controlar suas finanças hoje com o AppFinanceiro.' 
                : 'Acesse seu painel financeiro de qualquer lugar.'}
          </p>
        </div>

        {/* CARD DO FORMULÁRIO */}
        <div className="bg-white border border-border-subtle rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* MENSAGEM DE ERRO */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* MENSAGEM DE SUCESSO */}
            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs font-semibold animate-in slide-in-from-top-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  value={email} 
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all text-sm font-medium" 
                  required 
                />
              </div>
              
              {!isForgotPassword && (
                <div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha" 
                      value={password} 
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all text-sm font-medium" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {!isSignUp && (
                    <div className="flex justify-end mt-1.5 px-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError('');
                          setSuccess('');
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-sm cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {isForgotPassword 
                    ? 'Enviar link de recuperação' 
                    : isSignUp 
                      ? 'Cadastrar' 
                      : 'Entrar'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* TOGGLE MODO LOGIN / SIGNUP / FORGOT PASSWORD */}
        <div className="text-center pt-1">
          {isForgotPassword ? (
            <button 
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }} 
              className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors text-xs uppercase tracking-wider inline-flex items-center gap-1 active:scale-95 cursor-pointer"
              type="button"
            >
              <ArrowLeft size={14} />
              <span>Voltar para o Login</span>
            </button>
          ) : (
            <>
              <p className="text-slate-500 text-xs mb-1.5 font-medium">
                {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
              </p>
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }} 
                className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors text-xs uppercase tracking-wider active:scale-95 cursor-pointer"
                type="button"
              >
                {isSignUp ? 'Fazer Login' : 'Criar Conta Grátis'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
