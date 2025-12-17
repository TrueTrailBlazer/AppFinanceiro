import { useState } from 'react';
import { supabase } from '../services/supabase'; // Removida a extensão .js para padrão Vite
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, DollarSign } from 'lucide-react';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('variable'); // variable, fixed, income

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || !name) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        name,
        amount: parseFloat(amount),
        type,
        created_at: new Date()
      }]);

      if (error) throw error;
      navigate(-1); // Volta para a tela anterior com sucesso
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const TypeButton = ({ value, label, color }) => (
    <button
      type="button"
      onClick={() => setType(value)}
      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
        type === value 
          ? `bg-${color}-500/10 border-${color}-500 text-${color}-500 shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
          : 'bg-[#121212] border-[#222] text-gray-500 hover:bg-[#1a1a1a]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-[80vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
      
      {/* Header Simples */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Nova Transação</h1>
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col gap-6">
        
        {/* Valor Gigante (Foco Principal) */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Valor (R$)</label>
          <div className="relative group">
            <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${amount ? 'text-white' : 'text-gray-600'}`} size={28} />
            <input 
              type="number" 
              inputMode="decimal"
              step="0.01"
              autoFocus
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-5xl font-bold text-white placeholder-gray-700 border-b-2 border-[#222] focus:border-blue-500 py-4 pl-14 outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Tipo de Gasto (Botões Grandes) */}
        <div className="space-y-2">
           <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Categoria</label>
           <div className="flex gap-3">
             <TypeButton value="variable" label="Variável" color="blue" />
             <TypeButton value="fixed" label="Fixo" color="purple" />
             <TypeButton value="income" label="Entrada" color="green" />
           </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Descrição</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Mercado, Aluguel, Salário..."
            className="w-full bg-[#121212] border border-[#222] text-lg text-white p-5 rounded-2xl focus:border-blue-500 outline-none transition-all" 
          />
        </div>

        {/* Espaço Flexível para empurrar botão para baixo */}
        <div className="flex-1" />

        {/* Botão Salvar (Fácil acesso) */}
        <button 
          type="submit" 
          disabled={loading || !amount || !name}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all mb-4"
        >
          {loading ? 'Salvando...' : <><Check /> Confirmar</>}
        </button>

      </form>
    </div>
  );
}