import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, DollarSign, Trash2, Calendar } from 'lucide-react';
import { CATEGORIES } from '../utils/constants.jsx';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Se veio dados pela navegação, é EDICÃO
  const editingTransaction = location.state?.transaction;

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('variable'); 
  const [category, setCategory] = useState('others');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  // Carregar dados se for edição
  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setName(editingTransaction.name);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category || 'others');
      // Ajuste seguro da data
      if(editingTransaction.created_at) {
        setDate(new Date(editingTransaction.created_at).toISOString().split('T')[0]);
      }
    }
  }, [editingTransaction]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || !name) return;
    setLoading(true);

    const transactionData = {
      user_id: user.id,
      name,
      amount: parseFloat(amount),
      type,
      category,
      created_at: new Date(date).toISOString() // Usa a data escolhida
    };

    try {
      if (editingTransaction) {
        // --- ATUALIZAR ---
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        if (error) throw error;
      } else {
        // --- CRIAR ---
        const { error } = await supabase
          .from('transactions')
          .insert([transactionData]);
        if (error) throw error;
      }
      navigate(-1);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      setLoading(true);
      await supabase.from('transactions').delete().eq('id', editingTransaction.id);
      navigate(-1);
    }
  };

  const TypeButton = ({ value, label, color }) => (
    <button
      type="button"
      onClick={() => {
        setType(value);
        // Sugere categoria padrão ao mudar tipo
        if (value === 'income') setCategory('salary');
        else if (category === 'salary' || category === 'investment') setCategory('food');
      }}
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
    <div className="min-h-screen bg-[#050505] pb-10">
      <div className="max-w-lg mx-auto p-4 flex flex-col min-h-screen">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
              <ArrowLeft className="text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h1>
          </div>
          {editingTransaction && (
            <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col gap-6">
          
          {/* Valor */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Valor (R$)</label>
            <div className="relative group">
              <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${amount ? 'text-blue-500' : 'text-gray-600'}`} size={24} />
              <input 
                type="number" 
                inputMode="decimal"
                step="0.01"
                autoFocus={!editingTransaction}
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#121212] border border-[#222] text-4xl font-bold text-white placeholder-gray-700 rounded-2xl py-6 pl-12 pr-4 focus:border-blue-500 focus:outline-none transition-all" 
              />
            </div>
          </div>

          {/* Tipo e Data */}
          <div className="flex gap-3">
             <div className="flex-1 space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tipo</label>
                <div className="flex bg-[#121212] p-1 rounded-xl border border-[#222]">
                  <button type="button" onClick={() => setType('variable')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type !== 'income' ? 'bg-[#222] text-white' : 'text-gray-500'}`}>Saída</button>
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'income' ? 'bg-[#222] text-green-400' : 'text-gray-500'}`}>Entrada</button>
                </div>
             </div>
             <div className="w-1/3 space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Data</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#121212] border border-[#222] text-white text-sm font-medium rounded-xl py-2.5 px-3 focus:border-blue-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
             </div>
          </div>

          {/* Categorias (Grid) */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Categoria</label>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(CATEGORIES).filter(([key]) => {
                 // Filtro simples: Se for Entrada, mostra só categorias de receita + outros
                 if (type === 'income') return ['salary', 'investment', 'extra', 'others'].includes(key);
                 return !['salary', 'investment', 'extra'].includes(key);
              }).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all ${
                    category === key 
                      ? `bg-[#1a1a1a] border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]` 
                      : 'bg-[#121212] border-[#222] hover:border-gray-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`p-2 rounded-full ${category === key ? cat.bg : 'bg-[#1a1a1a]'}`}>
                    <cat.icon size={20} className={category === key ? cat.color : 'text-gray-400'} />
                  </div>
                  <span className={`text-[10px] font-medium truncate w-full text-center ${category === key ? 'text-white' : 'text-gray-500'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Nome / Descrição</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Mercado, Uber..."
              className="w-full bg-[#121212] border border-[#222] text-base text-white p-4 rounded-2xl focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="flex-1" />

          {/* Botão Salvar */}
          <button 
            type="submit" 
            disabled={loading || !amount || !name}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all mb-4"
          >
            {loading ? 'Salvando...' : <><Check /> {editingTransaction ? 'Atualizar' : 'Confirmar'}</>}
          </button>

        </form>
      </div>
    </div>
  );
}