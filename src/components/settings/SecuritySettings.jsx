import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export function SecuritySettings({ onBack }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-white">Segurança</h1>
      </div>

      {/* Card Principal */}
      <div className="bg-[#121212] rounded-2xl border border-[#222] overflow-hidden p-6 relative">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <KeyRound size={120} />
        </div>

        <div className="relative z-10 max-w-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Lock size={16} className="text-blue-500"/> Alterar Senha
            </h2>
            <p className="text-xs text-gray-500 mb-6">
                Crie uma nova senha forte para proteger sua conta financeira.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:bg-[#222] transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:bg-[#222] transition-all"
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                        {message.text}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading || !password}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all mt-2"
                >
                    {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}