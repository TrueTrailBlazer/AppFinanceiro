import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Check, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export interface SecuritySettingsProps {
  onBack: () => void;
  isRecovery?: boolean;
}

interface ValidationRule {
  label: string;
  test: (p: string) => boolean;
}

interface FeedbackMessage {
  type: 'success' | 'error';
  text: string;
}

export function SecuritySettings({ onBack, isRecovery = false }: SecuritySettingsProps) {
  const { user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  // Regras de Validação
  const validations: ValidationRule[] = [
    { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
    { label: 'Letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Letra minúscula', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Número', test: (p: string) => /[0-9]/.test(p) },
    { label: 'Símbolo (!@#$)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const isPasswordValid = validations.every(v => v.test(password));

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!isPasswordValid) return;
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }
    if (!user?.email) {
      setMessage({ type: 'error', text: 'Usuário sem e-mail cadastrado.' });
      return;
    }

    setLoading(true);

    try {
      // 1. Se não for recuperação, valida a senha antiga para autoria
      if (!isRecovery) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) throw new Error('A senha atual está incorreta.');
      }

      // 2. Atualiza para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({ password: password });

      if (updateError) throw updateError;

      setMessage({ 
        type: 'success', 
        text: isRecovery 
          ? 'Senha redefinida com sucesso! Você já está conectado.' 
          : 'Senha atualizada com sucesso!' 
      });
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');

      // Limpa hashes da URL se estiver em recuperação
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background animate-in slide-in-from-right-4 duration-300 flex flex-col md:relative md:inset-auto md:z-auto md:overflow-visible">
      
      {/* Header Minimalista S/ Botão */}
      <div className="py-5 px-1 bg-card border-b border-border shrink-0 text-center">
        <h1 className="text-lg font-bold text-foreground">
          {isRecovery ? 'Redefinir Senha' : 'Alterar Senha'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-2 space-y-6">
        
        {/* Intro */}
        <div className="bg-card border border-border p-5 rounded-2xl flex gap-4 items-center">
          <div className="p-3 bg-blue-900/10 text-blue-500 rounded-full shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isRecovery ? 'Redefinição de Acesso' : 'Segurança Forte'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRecovery 
                ? 'Crie uma nova senha segura para redefinir o acesso à sua conta.' 
                : 'Preencha os dados abaixo para atualizar sua credencial de acesso.'}
            </p>
          </div>
        </div>

        <form id="security-form" onSubmit={handleUpdatePassword} className="space-y-5 pb-8">
          
          {/* Senha Atual (apenas quando não estiver em fluxo de recuperação) */}
          {!isRecovery && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Senha Atual</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-3.5 text-gray-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="w-full bg-card-hover border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                  />
                </div>
              </div>

              <div className="h-px bg-border my-2"></div>
            </>
          )}

          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma nova senha"
                className="w-full bg-card-hover border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground outline-none focus:border-blue-500 transition-all placeholder-gray-600"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="absolute right-3 top-3 text-gray-500 hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Checklist de Validação (Feedback Visual) */}
          <div className="bg-card p-3 rounded-xl border border-border grid grid-cols-1 gap-2">
            {validations.map((v, i) => {
              const isValid = v.test(password);
              return (
                <div key={i} className={`flex items-center gap-2 text-[11px] transition-colors ${isValid ? 'text-green-500 font-bold' : 'text-gray-500'}`}>
                  {isValid ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />}
                  <span>{v.label}</span>
                </div>
              );
            })}
          </div>

          {/* Confirmar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className={`w-full bg-card-hover border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground outline-none transition-all placeholder-gray-600
                  ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'focus:border-blue-500'}
                `}
              />
            </div>
          </div>

          {/* Feedback Final */}
          {message && (
            <div className={`p-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {message.type === 'success' ? <ShieldCheck size={18}/> : <AlertCircle size={18}/>}
              {message.text}
            </div>
          )}
        </form>
      </div>

      {/* FOOTER LISTA - Thumb Zone */}
      <div className="p-4 pb-8 md:pb-4 border-t border-border bg-card shrink-0 flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-10 sticky bottom-0">
        <button 
          type="button" 
          onClick={onBack} 
          className="px-5 py-3.5 rounded-xl border border-border-strong text-gray-300 font-bold hover:bg-border active:scale-95 transition-all text-center flex-1 md:flex-none"
        >
          Voltar
        </button>
        
        <button 
          type="submit" 
          form="security-form"
          disabled={loading || !isPasswordValid || password !== confirmPassword || (!isRecovery && !currentPassword)}
          className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
        >
          {loading ? 'Validando...' : (isRecovery ? 'Redefinir Senha' : 'Salvar Senha')}
        </button>
      </div>
    </div>
  );
}
