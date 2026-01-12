import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Lock, Check, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export function SecuritySettings({ onBack }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);

  // Requisitos da Senha
  const validations = [
    { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
    { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
    { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
    { label: "Número", test: (p) => /[0-9]/.test(p) },
    { label: "Caractere especial (@#$%)", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const isPasswordValid = validations.every(v => v.test(password));

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!isPasswordValid) return;

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-white">Segurança</h1>
      </div>

      <div className="space-y-6">
        
        {/* Intro */}
        <div className="bg-blue-900/10 border border-blue-900/20 p-4 rounded-2xl flex gap-3 items-start">
            <ShieldCheck size={24} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
                <h3 className="text-sm font-bold text-white">Proteja sua conta</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Use uma senha forte e única. A senha deve cumprir todos os requisitos abaixo.
                </p>
            </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
            
            {/* Campo Nova Senha */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
                <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nova senha forte"
                        className="w-full bg-[#121212] border border-[#222] rounded-xl pl-10 pr-10 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder-gray-700"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-white"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* Checklist de Validação */}
            <div className="grid grid-cols-1 gap-2 pl-1">
                {validations.map((v, i) => {
                    const isValid = v.test(password);
                    return (
                        <div key={i} className={`flex items-center gap-2 text-xs transition-colors ${isValid ? 'text-green-500' : 'text-gray-600'}`}>
                            {isValid ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-700" />}
                            <span className={isValid ? 'font-medium' : ''}>{v.label}</span>
                        </div>
                    )
                })}
            </div>

            {/* Campo Confirmar */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
                <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className={`w-full bg-[#121212] border border-[#222] rounded-xl pl-10 pr-10 py-3 text-sm text-white outline-none transition-all placeholder-gray-700
                            ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'focus:border-blue-500'}
                        `}
                    />
                </div>
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-red-500 pl-1">As senhas não coincidem.</p>
                )}
            </div>

            {/* Mensagem de Sucesso/Erro */}
            {message && (
                <div className={`p-3 rounded-xl text-center text-xs font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading || !isPasswordValid || password !== confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all mt-4"
            >
                {loading ? 'Salvando...' : 'Atualizar Senha'}
            </button>
        </form>
      </div>
    </div>
  );
}