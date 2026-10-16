import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { getLocalDateString, parseLocalDate, addMonthsPreservingDay } from '../utils/date';
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
import AddTransactionHeader from '../components/transactions/AddTransactionHeader';
import TransactionTypeAndAmount from '../components/transactions/TransactionTypeAndAmount';
import CategorySelectorGrid from '../components/transactions/CategorySelectorGrid';
import TransactionDateAndStatus from '../components/transactions/TransactionDateAndStatus';
import InstallmentConfigCard from '../components/transactions/InstallmentConfigCard';
import FutureInstallmentsPrompt from '../components/transactions/FutureInstallmentsPrompt';
import { getInstallmentInfo } from '../utils/installments';
import type { 
  TransactionRow, 
  DisplayTransaction, 
  InstallmentInfo, 
  TransactionInsert, 
  TransactionUpdate 
} from '../types/models';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingTransaction = (location.state as { transaction?: TransactionRow | DisplayTransaction } | undefined)?.transaction;
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
  const [installmentsCount, setInstallmentsCount] = useState<number | ''>(2);
  const [installmentType, setInstallmentType] = useState<'divide_total' | 'multiply_parcel'>('divide_total');
  const [currentInstallment, setCurrentInstallment] = useState<number | ''>(1);

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
      setIsPaid(editingTransaction.is_paid !== undefined && editingTransaction.is_paid !== null ? editingTransaction.is_paid : false);

      if (editingTransaction.created_at) {
        const dbDate = new Date(editingTransaction.created_at);
        setDate(getLocalDateString(dbDate));
      }

      setNotes(editingTransaction.notes || '');
    }
  }, [editingTransaction]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountCents || !name || !user) return;
    setLoading(true);

    const now = new Date();
    const baseDate = parseLocalDate(date, now);
    const originalLocalDate = editingTransaction ? getLocalDateString(new Date(editingTransaction.created_at)) : null;
    const isDateChanged = date !== originalLocalDate;
    const formattedNotes = notes.trim() || null;

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
            isDateChanged,
            formattedNotes
          );
        } else {
          const transactionData: TransactionUpdate = {
            user_id: user.id,
            name,
            amount: amountCents, // Inteiro estrito em centavos
            type,
            category,
            is_paid: isPaid,
            notes: formattedNotes
          };
          if (isDateChanged) {
            transactionData.created_at = baseDate.toISOString();
          }
          await updateTransaction(user.id, Number(editingTransaction.id), transactionData);
        }
      } else {
        if (isInstallment && (Number(installmentsCount) || 0) > 1 && type !== 'income') {
          const count = parseInt(String(installmentsCount), 10) || 2;
          const startAt = parseInt(String(currentInstallment), 10) || 1;
          const installmentGroupId = generateUUID();
          
          let pieces: number[] = [];
          if (installmentType === 'divide_total') {
            pieces = splitInstallments(amountCents, count);
          } else {
            pieces = Array(count).fill(amountCents);
          }

          const txs: TransactionInsert[] = [];
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
              installment_group_id: installmentGroupId, // Chave relacional
              notes: formattedNotes
            });
          }
          await createBatchTransactions(txs);
        } else {
          const transactionData: TransactionInsert = {
            user_id: user.id,
            name,
            amount: amountCents, // Inteiro estrito em centavos
            type,
            category,
            is_paid: isPaid,
            created_at: baseDate.toISOString(),
            notes: formattedNotes
          };
          await createTransaction(transactionData);
        }
      }
      navigate(-1);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao salvar';
      showAlert('Erro ao salvar: ' + msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !editingTransaction) return;
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
          await deleteTransaction(user.id, Number(editingTransaction.id));
        }
        navigate(-1);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao apagar';
        showAlert('Erro ao apagar: ' + msg, 'error');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-surface flex flex-col font-sans md:relative md:inset-auto md:z-auto md:justify-center md:items-center min-h-screen">
      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-surface md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-border-subtle md:shadow-2xl overflow-hidden relative">

        <AddTransactionHeader 
          editingTransaction={editingTransaction}
          onBack={() => navigate(-1)}
          onDelete={handleDelete}
        />

        <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-4 overflow-y-auto scroll-smooth">
          <div className="flex flex-col w-full pb-8 pt-4">
            
            <TransactionTypeAndAmount 
              type={type}
              setType={setType}
              displayAmount={displayAmount}
              setDisplayAmount={setDisplayAmount}
              setAmountCents={setAmountCents}
              category={category}
              setCategory={setCategory}
              setIsInstallment={setIsInstallment}
              autoFocus={!editingTransaction}
            />

            <form id="transaction-form" onSubmit={handleSave} className="flex flex-col gap-4">
              
              {/* DESCRIÇÃO */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Descrição</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Supermercado, Aluguel..."
                    className="w-full bg-transparent text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none" 
                  />
                </div>
              </div>

              {/* CATEGORIAS */}
              <CategorySelectorGrid 
                type={type}
                category={category}
                setCategory={setCategory}
                name={name}
                setName={setName}
              />

              {/* DATA E STATUS */}
              <TransactionDateAndStatus 
                date={date}
                setDate={setDate}
                isPaid={isPaid}
                setIsPaid={setIsPaid}
              />

              {/* INSTALLMENTS LOGIC */}
              {!editingTransaction && type !== 'income' && (
                <InstallmentConfigCard 
                  isInstallment={isInstallment}
                  setIsInstallment={setIsInstallment}
                  installmentsCount={installmentsCount}
                  setInstallmentsCount={setInstallmentsCount}
                  currentInstallment={currentInstallment}
                  setCurrentInstallment={setCurrentInstallment}
                  installmentType={installmentType}
                  setInstallmentType={setInstallmentType}
                />
              )}

              {/* Edit Installments Option */}
              <FutureInstallmentsPrompt 
                instInfo={instInfo}
                applyToFuture={applyToFuture}
                setApplyToFuture={setApplyToFuture}
              />

              {/* OBSERVAÇÕES (DESIGN SYSTEM FIDELITY) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Observações</label>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">notes</span>
                  </div>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none resize-none pt-2" 
                    placeholder="Adicione um detalhe (opcional)" 
                    rows={2}
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
