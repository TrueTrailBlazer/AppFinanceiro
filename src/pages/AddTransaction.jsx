import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { CATEGORIES } from '../utils/constants';
import { getLocalDateString, parseLocalDate, addMonthsPreservingDay, formatLocalDate } from '../utils/date';
import { parseCents, formatCents, splitInstallments } from '../utils/money';
import { 
  createTransaction, 
  createBatchTransactions, 
  updateTransaction, 
  updateFutureInstallments, 
  deleteTransaction, 
  deleteFutureInstallments,
  generateUUID 
} from '../services/transactions';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingTransaction = location.state?.transaction;
  const { showAlert, showConfirm } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [amountCents, setAmountCents] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('variable');
  const [category, setCategory] = useState('others');
  const [date, setDate] = useState(() => getLocalDateString());
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');

  // Installment states
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentType, setInstallmentType] = useState('divide_total');
  const [currentInstallment, setCurrentInstallment] = useState(1);

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
      const cents = parseCents(editingTransaction.amount);
      setAmountCents(cents);
      setDisplayAmount(cents > 0 ? formatCents(cents, false) : '');

      setName(editingTransaction.name);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category || 'others');
      setIsPaid(editingTransaction.is_paid !== undefined ? editingTransaction.is_paid : false);

      if (editingTransaction.created_at) {
        const dbDate = new Date(editingTransaction.created_at);
        setDate(getLocalDateString(dbDate));
      }
    }
  }, [editingTransaction]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amountCents || !name) return;
    setLoading(true);

    const now = new Date();
    const baseDate = parseLocalDate(date, now);
    const originalLocalDate = editingTransaction ? getLocalDateString(new Date(editingTransaction.created_at)) : null;
    const isDateChanged = date !== originalLocalDate;

    try {
      if (editingTransaction) {
        if (instInfo && applyToFuture) {
          const baseNameInput = name.replace(/\s\(\d+\/\d+\)$/, '');
          await updateFutureInstallments(
            user.id,
            editingTransaction,
            instInfo,
            baseNameInput,
            amountCents,
            type,
            category,
            isPaid,
            baseDate.toISOString(),
            isDateChanged
          );
        } else {
          const transactionData = {
            user_id: user.id,
            name,
            amount: amountCents, // Inteiro estrito em centavos
            type,
            category,
            is_paid: isPaid
          };
          if (isDateChanged) {
            transactionData.created_at = baseDate.toISOString();
          }
          await updateTransaction(editingTransaction.id, transactionData);
        }
      } else {
        if (isInstallment && installmentsCount > 1 && type !== 'income') {
          const count = parseInt(installmentsCount, 10) || 2;
          const startAt = parseInt(currentInstallment, 10) || 1;
          const installmentGroupId = generateUUID();
          
          let pieces = [];
          if (installmentType === 'divide_total') {
            pieces = splitInstallments(amountCents, count);
          } else {
            pieces = Array(count).fill(amountCents);
          }

          const txs = [];
          for (let i = 1; i <= count; i++) {
            const stepDate = addMonthsPreservingDay(baseDate, i - startAt);

            const txName = `${name} (${i}/${count})`;
            const txIsPaid = i < startAt ? true : (i === startAt ? isPaid : false);

            txs.push({
              user_id: user.id,
              name: txName,
              amount: pieces[i - 1], // Inteiro estrito em centavos
              type,
              category,
              is_paid: txIsPaid,
              created_at: stepDate.toISOString(),
              installment_group_id: installmentGroupId // Chave relacional
            });
          }
          await createBatchTransactions(txs);
        } else {
          const transactionData = {
            user_id: user.id,
            name,
            amount: amountCents, // Inteiro estrito em centavos
            type,
            category,
            is_paid: isPaid,
            created_at: baseDate.toISOString()
          };
          await createTransaction(transactionData);
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
          await deleteFutureInstallments(user.id, editingTransaction, instInfo);
        } else {
          await deleteTransaction(editingTransaction.id);
        }
        navigate(-1);
      } catch (error) {
        showAlert('Erro ao apagar: ' + error.message, 'error');
        setLoading(false);
      }
    }
  };

  const selectedCategoryLabel = CATEGORIES[category]?.label || 'Outros';

  return (
    <div className="fixed inset-0 z-[60] bg-surface flex flex-col font-sans md:relative md:inset-auto md:z-auto md:justify-center md:items-center min-h-screen">
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-surface md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-border-subtle md:shadow-2xl overflow-hidden relative">

        <header className="fixed top-0 w-full md:absolute z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button aria-label="Voltar" onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-slate-200 transition-colors" type="button">
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              {editingTransaction && (
                <button aria-label="Excluir" onClick={handleDelete} className="w-11 h-11 flex items-center justify-center rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" type="button">
                  <span className="material-symbols-outlined text-[22px]">delete</span>
                </button>
              )}
              <button aria-label="Fechar" onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-slate-200 transition-colors" type="button">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-4 overflow-y-auto scroll-smooth">
          <div className="flex flex-col w-full pb-8 pt-4">
            
            {/* TYPE SWITCHER */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1 bg-slate-200 rounded-full w-full max-w-xs shadow-inner">
                <button 
                  onClick={() => { setType('variable'); setIsInstallment(false); if (['salary', 'investment'].includes(category)) setCategory('food'); }} 
                  className={`flex-1 py-2 text-center rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${type !== 'income' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  <span className="">Despesa</span>
                </button>
                <button 
                  onClick={() => { setType('income'); setIsInstallment(false); setCategory('salary'); }} 
                  className={`flex-1 py-2 text-center rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  <span className="">Receita</span>
                </button>
              </div>
            </div>

            {/* AMOUNT INPUT */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-white rounded-2xl shadow-sm mb-6 relative overflow-hidden border border-border-subtle">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full pointer-events-none"></div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor da operação</span>
              <div className="flex items-baseline justify-center gap-1 w-full">
                <span className={`text-[22px] font-semibold transition-colors ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>R$</span>
                <input 
                  className={`text-[40px] bg-transparent text-center focus:outline-none w-56 font-bold tracking-tight transition-colors ${type === 'income' ? 'text-emerald-600 selection:bg-emerald-600/10' : 'text-rose-600 selection:bg-rose-600/10'}`} 
                  inputMode="decimal"
                  placeholder="0,00"
                  type="text" 
                  value={displayAmount}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    if (!rawValue) { setDisplayAmount(''); setAmountCents(0); return; }
                    const cents = parseInt(rawValue, 10);
                    setAmountCents(cents);
                    setDisplayAmount(formatCents(cents, false));
                  }}
                  autoFocus={!editingTransaction}
                />
              </div>
            </div>

            <form id="transaction-form" onSubmit={handleSave} className="flex flex-col gap-4">
              
              {/* DESCRIÇÃO */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Descrição</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </div>
                  <input 
                    required type="text"
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Supermercado, Aluguel..."
                    className="w-full bg-transparent text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none" 
                  />
                </div>
              </div>

              {/* CATEGORIAS */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3 overflow-hidden">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Categoria</label>
                  <span className="text-[11px] font-bold text-emerald-600">{selectedCategoryLabel}</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
                  {Object.entries(CATEGORIES).filter(([key]) => {
                    if (type === 'income') return ['salary', 'investment', 'extra', 'others'].includes(key);
                    return !['salary', 'investment', 'extra'].includes(key);
                  }).map(([key, cat]) => (
                    <button
                      key={key} type="button" 
                      onClick={() => {
                        setCategory(key);
                        const isNameACategoryObj = Object.values(CATEGORIES).find(c => c.label === name);
                        if (!name || isNameACategoryObj) setName(cat.label);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 transition-all ${
                        category === key 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {/* Adaptando os icones lucide para o mais proximo no material */}
                        {key === 'food' ? 'restaurant' : 
                         key === 'transport' ? 'directions_car' :
                         key === 'home' ? 'home' :
                         key === 'leisure' ? 'local_activity' :
                         key === 'shopping' ? 'shopping_bag' :
                         key === 'salary' ? 'payments' :
                         key === 'investment' ? 'trending_up' :
                         key === 'health' ? 'medical_services' :
                         key === 'education' ? 'school' : 'category'}
                      </span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DATA E STATUS */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between relative group">
                  <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Data</span>
                      <span className="text-sm font-semibold text-slate-900 capitalize">
                        {formatLocalDate(parseLocalDate(date), { day: '2-digit', month: 'short' }).replace(' de ', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[13px] font-bold pointer-events-none group-focus-within:bg-emerald-100">
                    Alterar
                  </div>
                  <input
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      <span className="material-symbols-outlined text-[20px]">{isPaid ? 'check_circle' : 'schedule'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</span>
                      <span className="text-sm font-semibold text-slate-900">{isPaid ? 'Já foi pago' : 'Pendente'}</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* INSTALLMENTS LOGIC */}
              {!editingTransaction && type !== 'income' && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-[20px]">layers</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Compra Parcelada?</span>
                        <span className="text-[10px] text-slate-400">Divida em meses</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {isInstallment && (
                    <div className="animate-in fade-in slide-in-from-top-2 pt-3 border-t border-border-subtle space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase">Qtd. Parcelas</label>
                          <input type="number" pattern="\d*" inputMode="numeric" min="2" max="72" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase">Parcela Atual</label>
                          <input type="number" pattern="\d*" inputMode="numeric" min="1" max={installmentsCount} value={currentInstallment} onChange={e => setCurrentInstallment(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">Como calcular?</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setInstallmentType('divide_total')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${installmentType === 'divide_total' ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                            <span className={`text-[12px] font-bold ${installmentType === 'divide_total' ? 'text-emerald-700' : 'text-slate-600'}`}>Dividir o Total</span>
                            <span className="text-[9px] text-slate-500 mt-1 line-clamp-1 leading-tight">Valor dividido nas parcelas</span>
                          </button>
                          <button type="button" onClick={() => setInstallmentType('multiply_parcel')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${installmentType === 'multiply_parcel' ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                            <span className={`text-[12px] font-bold ${installmentType === 'multiply_parcel' ? 'text-emerald-700' : 'text-slate-600'}`}>É da Parcela</span>
                            <span className="text-[9px] text-slate-500 mt-1 line-clamp-1 leading-tight">Valor x Meses</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Installments Option */}
              {instInfo && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span> Conta Parcelada ({instInfo.current}/{instInfo.total})
                    </p>
                    <p className="text-[11px] text-slate-900 mt-1 font-medium">Aplicar nas próximas parcelas?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={applyToFuture} onChange={e => setApplyToFuture(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              )}

              {/* OBSERVAÇÕES (NOT USED BY BACKEND, BUT PRESENT IN DESIGN) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Observações</label>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">notes</span>
                  </div>
                  <textarea 
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none resize-none pt-2" 
                    placeholder="Adicione um detalhe (opcional)" rows="2"
                  ></textarea>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="pt-2 pb-6">
                <button 
                  type="submit" 
                  disabled={loading || !amountCents || !name}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-[18px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[22px]">check</span>
                  )}
                  <span>{loading ? 'Gravando...' : 'Salvar Transação'}</span>
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}