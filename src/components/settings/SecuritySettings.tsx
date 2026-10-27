import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Check, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { SettingsHeader } from './SettingsHeader';

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

  const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder-slate-400';

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 pt-1 pb-8">
      <SettingsHeader title={isRecovery ? 'Redefinir Senha' : 'Segurança'} onBack={onBack} />

      <div className="space-y-4">
        {/* Intro */}
        <div className="bg-white border border-border-subtle p-4 rounded-2xl flex gap-4 items-center shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isRecovery ? 'Redefinição de acesso' : 'Alterar senha de acesso'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRecovery
                ? 'Crie uma nova senha segura para redefinir o acesso à sua conta.'
                : 'Preencha os dados abaixo para atualizar sua senha.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="bg-white border border-border-subtle rounded-3xl p-5 shadow-sm space-y-5">

          {/* Senha Atual (apenas quando não estiver em fluxo de recuperação) */}
          {!isRecovery && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Senha atual</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma nova senha"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Checklist de Validação */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 gap-2">
            {validations.map((v, i) => {
              const isValid = v.test(password);
              return (
                <div key={i} className={`flex items-center gap-2 text-[12px] transition-colors ${isValid ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {isValid ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                  <span>{v.label}</span>
                </div>
              );
            })}
          </div>

          {/* Confirmar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Confirmar nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className={`${inputClass} ${confirmPassword && password !== confirmPassword ? '!border-rose-400' : ''}`}
              />
            </div>
          </div>

          {/* Feedback Final */}
          {message && (
            <div className={`p-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {message.type === 'success' ? <ShieldCheck size={18}/> : <AlertCircle size={18}/>}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isPasswordValid || password !== confirmPassword || (!isRecovery && !currentPassword)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
          >
            {loading ? 'Validando...' : (isRecovery ? 'Redefinir senha' : 'Salvar senha')}
          </button>
        </form>
      </div>
    </div>
  );
}
