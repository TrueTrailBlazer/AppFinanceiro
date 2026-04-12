import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { Check, Trash2, Calendar, Tag, Type, CheckCircle2, XCircle } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingTransaction = location.state?.transaction;
  const { showAlert, showConfirm } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('variable');
  const [category, setCategory] = useState('others');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(true);

  // Installment states
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentType, setInstallmentType] = useState('divide_total');

  const getInstallmentInfo = (txName) => {
    if (!txName) return null;
    const match = txName.match(/^(.*?) \((\d+)\/(\d+)\)$/);
    if (match) {
      return { baseName: match[1], current: parseInt(match[2]), total: parseInt(match[3]) };
    }
    return null;
  };

  const instInfo = useMemo(() => getInstallmentInfo(editingTransaction?.name), [editingTransaction]);
  const [applyToFuture, setApplyToFuture] = useState(true);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(Number(editingTransaction.amount).toFixed(2));
      setName(editingTransaction.name);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category || 'others');
      setIsPaid(editingTransaction.is_paid !== undefined ? editingTransaction.is_paid : true);

      if (editingTransaction.created_at) {
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
    const baseDate = new Date(date);
    baseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const baseAmount = parseFloat(Number(amount).toFixed(2));

    try {
      if (editingTransaction) {
        if (instInfo && applyToFuture) {
          const { data: futureTxs } = await supabase.from('transactions')
            .select('id, name, created_at')
            .eq('user_id', user.id)
            .like('name', `${instInfo.baseName} (%/${instInfo.total})`)
            .gte('created_at', editingTransaction.created_at);

          if (futureTxs && futureTxs.length > 0) {
            const baseNameInput = name.replace(/\s\(\d+\/\d+\)$/, '');

            for (const fTx of futureTxs) {
              const txInstInfo = getInstallmentInfo(fTx.name);
              let newName = fTx.name;
              if (txInstInfo) {
                newName = `${baseNameInput} (${txInstInfo.current}/${instInfo.total})`;
              }
              const updateData = {
                name: newName,
                amount: baseAmount,
                type,
                category,
              };
              if (fTx.id === editingTransaction.id) {
                updateData.is_paid = isPaid; // Atualiza status apenas da atual, as futuras preservam ou seguem
                if (date !== new Date(editingTransaction.created_at).toISOString().split('T')[0]) {
                  updateData.created_at = baseDate.toISOString();
                }
              }
              await supabase.from('transactions').update(updateData).eq('id', fTx.id);
            }
          }
        } else {
          const transactionData = {
            user_id: user.id,
            name,
            amount: baseAmount,
            type,
            category,
            is_paid: isPaid
          };
          if (date !== new Date(editingTransaction.created_at).toISOString().split('T')[0]) {
            transactionData.created_at = baseDate.toISOString();
          }
          const { error } = await supabase.from('transactions').update(transactionData).eq('id', editingTransaction.id);
          if (error) throw error;
        }
      } else {
        if (isInstallment && installmentsCount > 1 && type !== 'income') {
          const txs = [];
          let pieceAmount = baseAmount;
          if (installmentType === 'divide_total') {
            const count = parseInt(installmentsCount) || 2;
            pieceAmount = parseFloat((baseAmount / count).toFixed(2));
          }

          const count = parseInt(installmentsCount) || 2;
          for (let i = 0; i < count; i++) {
            const stepDate = new Date(baseDate);
            stepDate.setMonth(stepDate.getMonth() + i);

            const count = parseInt(installmentsCount) || 2;
            const txName = `${name} (${i + 1}/${count})`;
            // Primeira parcela pode ser efetivada, mas as demais entram sempre como pendentes
            const txIsPaid = i === 0 ? isPaid : false;

            txs.push({
              user_id: user.id,
              name: txName,
              amount: pieceAmount,
              type,
              category,
              is_paid: txIsPaid,
              created_at: stepDate.toISOString()
            });
          }
          const { error } = await supabase.from('transactions').insert(txs);
          if (error) throw error;
        } else {
          const transactionData = {
            user_id: user.id,
            name,
            amount: baseAmount,
            type,
            category,
            is_paid: isPaid,
            created_at: baseDate.toISOString()
          };
          const { error } = await supabase.from('transactions').insert([transactionData]);
          if (error) throw error;
        }
      }
      navigate(-1);
    } catch (error) {
      showAlert('Erro ao salvar: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      (instInfo && applyToFuture) ? `Apagar ESTA e as PRÓXIMAS parcelas restantes?` : `Tem certeza que deseja apagar?`,
      'Excluir Lançamento'
    );
    if (confirmed) {
      setLoading(true);
      try {
        if (instInfo && applyToFuture) {
          const { error } = await supabase.from('transactions')
            .delete()
            .eq('user_id', user.id)
            .like('name', `${instInfo.baseName} (%/${instInfo.total})`)
            .gte('created_at', editingTransaction.created_at);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('transactions').delete().eq('id', editingTransaction.id);
          if (error) throw error;
        }
        navigate(-1);
      } catch (error) {
        showAlert('Erro ao apagar: ' + error.message, 'error');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:justify-center md:items-center">

      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-[#222] md:shadow-2xl overflow-hidden relative">

        {/* Header Elegante Minimalista */}
        <div className="px-5 py-4 text-center bg-[#121212] border-b border-[#222] shrink-0">
          <h1 className="font-bold text-white text-lg">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h1>
        </div>

        {/* --- CONTEÚDO SCROLLÁVEL --- */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <form id="transaction-form" onSubmit={handleSave} className="flex flex-col gap-4">

            {/* Valor */}
            <div className="relative bg-[#1a1a1a] rounded-xl p-3 border border-[#222] focus-within:border-blue-500/50 shadow-inner">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block">Valor da Transação</label>
              <div className="flex items-center">
                <span className={`text-xl mr-2 font-medium ${amount ? 'text-blue-500' : 'text-gray-600'}`}>R$</span>
                <input
                  type="number" pattern="\d*" inputMode="decimal" step="0.01" autoFocus={!editingTransaction}
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-4xl font-bold text-white placeholder-gray-800 outline-none"
                />
              </div>
            </div>

            {/* Status de Pagamento */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${isPaid ? 'bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-[#1a1a1a] border-[#222] text-gray-500'}`}
              >
                <CheckCircle2 size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wide">Efetivado</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${!isPaid ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-[#1a1a1a] border-[#222] text-gray-500'}`}
              >
                <XCircle size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wide">Pendente</span>
              </button>
            </div>

            {/* Descrição e Data */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-[#121212] rounded-xl px-4 py-3 border border-[#222] flex items-center gap-3 focus-within:border-gray-500 transition-colors">
                <Type size={18} className="text-gray-500 shrink-0" />
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase">Descrição O que foi?</label>
                  <input
                    type="text" enterKeyHint="done" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Conta de Luz"
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
                  <button type="button" onClick={() => { setType('variable'); setIsInstallment(false); if (['salary', 'investment'].includes(category)) setCategory('food'); }}
                    className={`flex-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center ${type !== 'income' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 opacity-60'}`}>Saída</button>
                  <button type="button" onClick={() => { setType('income'); setIsInstallment(false); setCategory('salary'); }}
                    className={`flex-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center ${type === 'income' ? 'bg-[#222] text-green-400 shadow-sm' : 'text-gray-500 opacity-60'}`}>Entrada</button>
                </div>
              </div>
            </div>

            {/* Installments Option (Apenas se for novo e Saída) */}
            {!editingTransaction && type !== 'income' && (
              <div className="bg-[#121212] rounded-xl p-4 border border-[#222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Compra Parcelada?</span>
                  </div>
                  <button type="button" onClick={() => setIsInstallment(!isInstallment)} className={`w-12 h-6 rounded-full transition-colors relative ${isInstallment ? 'bg-blue-600' : 'bg-[#333]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isInstallment ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                {isInstallment && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-3 border-t border-[#222] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Qtd. Parcelas</label>
                        <input type="number" pattern="\d*" inputMode="numeric" min="2" max="72" value={installmentsCount} onChange={e => {
                          const val = e.target.value;
                          setInstallmentsCount(val === '' ? '' : parseInt(val));
                        }}
                          className="w-full bg-[#1a1a1a] border border-[#222] text-white text-sm font-bold px-3 py-2 rounded-lg outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase">Como calcular?</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setInstallmentType('divide_total')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${installmentType === 'divide_total' ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-[#1a1a1a] border-[#222] opacity-70 hover:opacity-100'}`}>
                          <span className={`text-[11px] font-bold ${installmentType === 'divide_total' ? 'text-blue-400' : 'text-gray-400'}`}>Dividir o Total</span>
                          <span className="text-[8px] text-gray-500 mt-1 line-clamp-1 leading-tight">Divide para as parcelas</span>
                        </button>
                        <button type="button" onClick={() => setInstallmentType('multiply_parcel')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${installmentType === 'multiply_parcel' ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-[#1a1a1a] border-[#222] opacity-70 hover:opacity-100'}`}>
                          <span className={`text-[11px] font-bold ${installmentType === 'multiply_parcel' ? 'text-blue-400' : 'text-gray-400'}`}>É da Parcela</span>
                          <span className="text-[8px] text-gray-500 mt-1 line-clamp-1 leading-tight">Valor é vezes meses</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Opções de Edição para Conta Parcelada */}
            {instInfo && (
              <div className="bg-[#121212] rounded-xl p-4 border border-[#222] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><Calendar size={12} /> Conta Parcelada ({instInfo.current}/{instInfo.total})</p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase">Aplicar nas próximas parcelas?</p>
                </div>
                <button type="button" onClick={() => setApplyToFuture(!applyToFuture)} className={`w-12 h-6 rounded-full shrink-0 transition-colors relative ${applyToFuture ? 'bg-blue-600' : 'bg-[#333]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${applyToFuture ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            )}

            {/* Categorias */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 mb-1">
                <Tag size={12} className="text-gray-500" />
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Categoria</span>
              </div>
              <div className="gap-2 grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))]">
                {Object.entries(CATEGORIES).filter(([key]) => {
                  if (type === 'income') return ['salary', 'investment', 'extra', 'others'].includes(key);
                  return !['salary', 'investment', 'extra'].includes(key);
                }).map(([key, cat]) => (
                  <button
                    key={key} type="button" onClick={() => {
                      setCategory(key);
                      if (!name) setName(cat.label);
                    }}
                    className={`relative p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${category === key
                        ? `bg-blue-600/10 border-blue-500`
                        : 'bg-[#1a1a1a] border-[#222] opacity-70'
                      }`}
                  >
                    <cat.icon size={16} className={category === key ? cat.color : 'text-gray-400'} />
                    <span className={`text-[8px] font-bold uppercase truncate max-w-full ${category === key ? 'text-white' : 'text-gray-600'}`}>
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
              <Trash2 size={20} />
            </button>
          )}

          <button
            type="submit"
            form="transaction-form"
            disabled={loading || !amount || !name}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={18} /> Salvar</>}
          </button>
        </div>

      </div>
    </div>
  );
}