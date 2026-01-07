import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, Calendar, Tag, Type, CheckCircle2, XCircle } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingTransaction = location.state?.transaction;

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('variable'); 
  const [category, setCategory] = useState('others');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(true); // Novo estado

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setName(editingTransaction.name);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category || 'others');
      setIsPaid(editingTransaction.is_paid !== undefined ? editingTransaction.is_paid : true);
      
      if(editingTransaction.created_at) {
        const dbDate = new Date(editingTransaction.created_at);
        setDate(dbDate.toISOString().split('T')[0]);
      }
    }
  }, [editingTransaction]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || !name) return;
    setLoading(true);

    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const transactionData = {
      user_id: user.id,
      name,
      amount: parseFloat(amount),
      type,
      category,
      is_paid: isPaid, // Salva o status
      created_at: selectedDate.toISOString()
    };

    try {
      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        if (error) throw error;
      } else {
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
    if (confirm('Tem certeza que deseja apagar?')) {
      setLoading(true);
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', editingTransaction.id);
        if (error) throw error;
        navigate(-1);
      } catch (error) {
        alert('Erro ao apagar: ' + error.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-[#050505] sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <span className="font-bold text-white text-sm">
          {editingTransaction ? 'Editar' : 'Nova Transação'}
        </span>
        {editingTransaction ? (
          <button onClick={handleDelete} className="p-2 -mr-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
            <Trash2 size={20} />
          </button>
        ) : <div className="w-8" />} 
      </div>

      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-md mx-auto">
          
          {/* Valor */}
          <div className="relative bg-[#121212] rounded-2xl p-4 border border-[#222] focus-within:border-blue-500/50 transition-colors">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block">Valor</label>
            <div className="flex items-center">
              <span className={`text-xl mr-2 font-medium ${amount ? 'text-blue-500' : 'text-gray-600'}`}>R$</span>
              <input 
                type="number" inputMode="decimal" step="0.01" autoFocus={!editingTransaction}
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-700 outline-none" 
              />
            </div>
          </div>

          {/* Status de Pagamento (Novo) */}
          <div className="flex gap-3">
             <button
               type="button"
               onClick={() => setIsPaid(true)}
               className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isPaid ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-[#121212] border-[#222] text-gray-500'}`}
             >
               <CheckCircle2 size={18} /> <span className="text-xs font-bold">Pago / Recebido</span>
             </button>
             <button
               type="button"
               onClick={() => setIsPaid(false)}
               className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${!isPaid ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[#121212] border-[#222] text-gray-500'}`}
             >
               <XCircle size={18} /> <span className="text-xs font-bold">Pendente</span>
             </button>
          </div>

          {/* Nome e Data */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-[#121212] rounded-xl px-3 py-2.5 border border-[#222] flex items-center gap-3">
              <Type size={18} className="text-gray-500" />
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-gray-500 uppercase">Descrição</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Mercado"
                  className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none font-medium" 
                />
              </div>
            </div>

            <div className="flex gap-3">
               <div className="flex-1 bg-[#121212] rounded-xl px-3 py-2.5 border border-[#222] flex items-center gap-3">
                 <Calendar size={18} className="text-gray-500" />
                 <div className="flex-1">
                   <label className="block text-[9px] font-bold text-gray-500 uppercase">Data</label>
                   <input 
                     type="date" value={date} onChange={e => setDate(e.target.value)}
                     className="w-full bg-transparent text-xs text-white outline-none font-medium [&::-webkit-calendar-picker-indicator]:invert opacity-90"
                   />
                 </div>
               </div>
               
               <div className="flex bg-[#121212] p-1 rounded-xl border border-[#222] w-36">
                  <button type="button" onClick={() => { setType('variable'); if(['salary','investment'].includes(category)) setCategory('food'); }} 
                    className={`flex-1 rounded-lg text-[10px] font-bold transition-all ${type !== 'income' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500'}`}>Saída</button>
                  <button type="button" onClick={() => { setType('income'); setCategory('salary'); }} 
                    className={`flex-1 rounded-lg text-[10px] font-bold transition-all ${type === 'income' ? 'bg-[#222] text-green-400 shadow-sm' : 'text-gray-500'}`}>Entrada</button>
               </div>
            </div>
          </div>

          {/* Categorias (Mantido igual) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={14} className="text-gray-500" />
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Categoria</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CATEGORIES).filter(([key]) => {
                 if (type === 'income') return ['salary', 'investment', 'extra', 'others'].includes(key);
                 return !['salary', 'investment', 'extra'].includes(key);
              }).map(([key, cat]) => (
                <button
                  key={key} type="button" onClick={() => setCategory(key)}
                  className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all ${
                    category === key 
                      ? `bg-[#1a1a1a] border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]` 
                      : 'bg-[#121212] border-[#222] opacity-60'
                  }`}
                >
                  <cat.icon size={18} className={`mb-1.5 ${category === key ? cat.color : 'text-gray-400'}`} />
                  <span className={`text-[9px] font-medium truncate w-full text-center leading-none ${category === key ? 'text-white' : 'text-gray-500'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button 
              type="submit" disabled={loading || !amount || !name}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {loading ? '...' : <><Check size={18} /> Salvar</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}