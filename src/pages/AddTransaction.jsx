import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Trash2, Calendar, Tag, Type, CheckCircle2, XCircle } from 'lucide-react';
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
  const [isPaid, setIsPaid] = useState(true);

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
      is_paid: isPaid,
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
    <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:justify-center md:items-center">
      
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-[#222] md:shadow-2xl overflow-hidden relative">
        
        {/* Header Elegante Minimalista (Sem Botões inalcançáveis no topo) */}
        <div className="px-5 py-4 text-center bg-[#121212] border-b border-[#222] shrink-0">
          <h1 className="font-bold text-white text-lg">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h1>
        </div>

        {/* --- CONTEÚDO SCROLLÁVEL --- */}
        <div className="flex-1 overflow-y-auto p-5 pb-8">
          <form id="transaction-form" onSubmit={handleSave} className="flex flex-col gap-6">
            
            {/* Valor */}
            <div className="relative bg-[#1a1a1a] rounded-2xl p-4 border border-[#222] focus-within:border-blue-500/50 transition-colors shadow-inner">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block">Valor da Transação</label>
              <div className="flex items-center">
                <span className={`text-xl mr-2 font-medium ${amount ? 'text-blue-500' : 'text-gray-600'}`}>R$</span>
                <input 
                  type="number" inputMode="decimal" step="0.01" autoFocus={!editingTransaction}
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-transparent text-4xl font-bold text-white placeholder-gray-800 outline-none" 
                />
              </div>
            </div>

            {/* Status de Pagamento */}
            <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${isPaid ? 'bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-[#121212] border-[#222] text-gray-500 hover:border-[#333]'}`}
                >
                  <CheckCircle2 size={24} /> <span className="text-[10px] font-bold uppercase tracking-wide">Efetivado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${!isPaid ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-[#121212] border-[#222] text-gray-500 hover:border-[#333]'}`}
                >
                  <XCircle size={24} /> <span className="text-[10px] font-bold uppercase tracking-wide">Pendente</span>
                </button>
            </div>

            {/* Descrição e Data */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-[#121212] rounded-xl px-4 py-3 border border-[#222] flex items-center gap-3 focus-within:border-gray-500 transition-colors">
                <Type size={18} className="text-gray-500 shrink-0" />
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase">Descrição O que foi?</label>
                  <input 
                    type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Conta de Luz"
                    className="w-full bg-transparent text-sm text-white placeholder-gray-700 outline-none font-medium mt-0.5" 
                  />
                </div>
              </div>

              <div className="flex gap-3">
                  <div className="flex-1 bg-[#121212] rounded-xl px-4 py-3 border border-[#222] flex items-center gap-3">
                    <Calendar size={18} className="text-gray-500 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase">Data</label>
                      <input 
                        type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none font-medium [&::-webkit-calendar-picker-indicator]:invert opacity-90 mt-0.5"
                      />
                    </div>
                  </div>
                  
                  {/* Tipo Switch */}
                  <div className="flex bg-[#121212] p-1.5 rounded-xl border border-[#222] w-36 overflow-hidden">
                    <button type="button" onClick={() => { setType('variable'); if(['salary','investment'].includes(category)) setCategory('food'); }} 
                      className={`flex-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center ${type !== 'income' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 opacity-60'}`}>Saída</button>
                    <button type="button" onClick={() => { setType('income'); setCategory('salary'); }} 
                      className={`flex-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center ${type === 'income' ? 'bg-[#222] text-green-400 shadow-sm' : 'text-gray-500 opacity-60'}`}>Entrada</button>
                  </div>
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                <Tag size={14} className="text-gray-500" />
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Selecione uma Categoria</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(CATEGORIES).filter(([key]) => {
                    if (type === 'income') return ['salary', 'investment', 'extra', 'others'].includes(key);
                    return !['salary', 'investment', 'extra'].includes(key);
                }).map(([key, cat]) => (
                  <button
                    key={key} type="button" onClick={() => setCategory(key)}
                    className={`relative p-2.5 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      category === key 
                        ? `bg-[#1a1a1a] border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]` 
                        : 'bg-[#121212] border-[#222] opacity-60 hover:opacity-100 hover:border-[#333]'
                    }`}
                  >
                    <cat.icon size={20} className={category === key ? cat.color : 'text-gray-400'} />
                    <span className={`text-[9px] font-bold uppercase truncate max-w-full px-1 ${category === key ? 'text-white' : 'text-gray-600'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* --- BOTTOM ACTION BAR (THUMB ZONE) --- */}
        <div className="p-4 pb-8 md:pb-4 border-t border-[#222] bg-[#121212] shrink-0 flex gap-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <button 
                type="button" 
                onClick={() => navigate(-1)} 
                className="px-5 py-3.5 rounded-xl border border-[#333] text-gray-300 font-bold text-sm hover:bg-[#222] active:scale-95 transition-all text-center flex-1 md:flex-none"
            >
                Cancelar
            </button>
            
            {editingTransaction && (
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="px-5 py-3.5 rounded-xl bg-[#222] border border-[#333] text-red-500 font-bold hover:bg-red-500/10 hover:border-red-500/50 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 size={20}/>
                </button>
            )}
            
            <button 
                type="submit" 
                form="transaction-form"
                disabled={loading || !amount || !name}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Check size={18} /> Salvar</>}
            </button>
        </div>

      </div>
    </div>
  );
}