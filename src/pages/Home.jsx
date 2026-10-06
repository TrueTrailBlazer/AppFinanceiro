import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionsContext } from '../contexts/TransactionContext';
import { formatCurrency, formatCents } from '../utils/money';
import { useDate } from '../contexts/DateContext';
import { MonthPickerModal } from '../components/dashboard/MonthPickerModal';

export default function Home() {
  const navigate = useNavigate();
  const { currentDate, setCurrentDate, changeMonth } = useDate();
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const { 
    bankSummary,
    plannedSummary,
    plannedBills,
    recentTransactions,
    loading 
  } = useTransactionsContext();

  const handleEdit = (transaction) => {
    navigate('/add', { state: { transaction } });
  };

  // Valores reais do banco
  const saldoRealCents = bankSummary?.balanceCents || 0;
  const isPositive = saldoRealCents >= 0;

  // Planejamento
  const faltaPagarCents = plannedSummary?.pendingCents || 0;
  const jaPagoCents = plannedSummary?.paidCents || 0;
  
  // Sobra projetada: Saldo Real - Falta Pagar
  const sobraProjetadaCents = saldoRealCents - faltaPagarCents;
  const isSobraPositive = sobraProjetadaCents >= 0;

  // Próximos Vencimentos (Lógica do UpcomingBillsWidget)
  const pendingBills = (plannedBills || [])
    .filter(t => !t.is_paid)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 3);

  const getDaysRemaining = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in duration-500 pt-1">
      
      {/* MONTH SELECTOR & ACTION */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div 
          onClick={() => setIsMonthModalOpen(true)}
          className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
          <span className="text-[13px] font-bold text-slate-900 select-none capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_drop_down</span>
        </div>

        <button onClick={() => navigate('/analysis')} className="bg-white border border-border-subtle rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">
          <span className="material-symbols-outlined text-[16px]">insights</span>
          <span className="text-[11px] font-bold">Resumo</span>
        </button>
      </div>

      {/* Cards Principais: Saldo e Sobra Projetada */}
      <div className="flex flex-col gap-2.5">
        {/* Fluxo Real (Banco) */}
        <section onClick={() => navigate('/extract')} className={`${isPositive ? 'bg-emerald-700 border-emerald-600' : 'bg-rose-700 border-rose-600'} text-white rounded-3xl p-5 border shadow-sm flex flex-col gap-2 transition-transform cursor-pointer active:scale-[0.98]`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Fluxo Real no Banco</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">{formatCurrency(saldoRealCents)}</h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full border border-white/30 backdrop-blur-md">
              Ver Extrato
            </span>
          </div>
        </section>

        {/* Sobra Projetada */}
        <section className={`bg-white rounded-2xl p-4 border border-border-subtle shadow-sm flex items-center justify-between ${isSobraPositive ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'}`}>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Sobra Projetada (Mês)</span>
            <span className={`text-xl font-bold tracking-tight mt-0.5 ${isSobraPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(sobraProjetadaCents)}
            </span>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSobraPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
             <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          </div>
        </section>
      </div>

      {/* 2-Column Metrics: Falta Pagar e Já Pago */}
      <section className="grid grid-cols-2 gap-2.5">
        <div onClick={() => navigate('/bills')} className="bg-white rounded-2xl p-3.5 border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px] font-bold">calendar_clock</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Falta Pagar</span>
          </div>
          <p className="text-base font-bold text-slate-900 truncate">{formatCurrency(faltaPagarCents)}</p>
        </div>

        <div onClick={() => navigate('/bills')} className="bg-white rounded-2xl p-3.5 border border-border-subtle shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px] font-bold">check_circle</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Já Pago</span>
          </div>
          <p className="text-base font-bold text-slate-900 truncate">{formatCurrency(jaPagoCents)}</p>
        </div>
      </section>

      {/* Próximos Vencimentos Section */}
      <section className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Próximos Vencimentos</h3>
          <a onClick={() => navigate('/bills')} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-0.5 cursor-pointer">
            <span>Ver todas</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </a>
        </div>

        <div className="flex flex-col gap-2.5">
          {loading && pendingBills.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-4">Carregando...</div>
          ) : pendingBills.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
               <span className="material-symbols-outlined text-emerald-500 text-[28px]">task_alt</span>
               <span className="text-sm font-medium text-slate-600">Tudo em dia!</span>
               <a onClick={() => navigate('/add')} className="text-xs text-primary font-bold mt-1 cursor-pointer hover:underline">Adicionar Nova Conta</a>
            </div>
          ) : (
            pendingBills.map(t => {
              const daysRemaining = getDaysRemaining(t.created_at);
              const isOverdue = daysRemaining < 0;

              return (
                <div key={t.id} onClick={() => handleEdit(t)} className={`bg-white rounded-2xl p-3.5 border shadow-sm flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${isOverdue ? 'border-rose-300 bg-rose-50/30' : 'border-border-subtle hover:border-slate-300'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                      <span className="material-symbols-outlined text-[20px]">{isOverdue ? 'error' : 'event'}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-semibold truncate ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>{t.name}</span>
                      <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
                        {isOverdue 
                          ? `Atrasado há ${Math.abs(daysRemaining)} dia(s)` 
                          : daysRemaining === 0 
                            ? 'Vence hoje' 
                            : `Vence em ${daysRemaining} dia(s)`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    <span className={`text-sm font-bold tracking-tight ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Recent Transactions Section */}
      <section className="flex flex-col gap-3 mt-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Últimos Lançamentos</h3>
          <a onClick={() => navigate('/extract')} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-0.5 cursor-pointer">
            <span>Ver extrato</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </a>
        </div>

        <div className="flex flex-col gap-2.5">
          {loading && recentTransactions?.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-4">Carregando...</div>
          ) : recentTransactions?.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-4">Nenhum lançamento recente no banco.</div>
          ) : (
            recentTransactions?.slice(0, 3).map((tx) => {
              const isIncome = tx.type === 'income';
              const isPaid = tx.is_paid || tx.pluggy_transaction_id;
              
              let iconName = 'receipt_long';
              if (tx.category === 'shopping' || tx.name.toLowerCase().includes('mercado')) iconName = 'shopping_cart';
              if (tx.category === 'home' || tx.name.toLowerCase().includes('casa')) iconName = 'home';
              if (isIncome) iconName = 'payments';
              if (tx.name.toLowerCase().includes('netflix') || tx.name.toLowerCase().includes('spotify')) iconName = 'subscriptions';
              if (tx.name.toLowerCase().includes('posto') || tx.name.toLowerCase().includes('uber')) iconName = 'local_gas_station';

              return (
                <div key={tx.id} onClick={() => handleEdit(tx)} className="bg-white rounded-2xl p-3.5 border border-border-subtle shadow-sm flex items-center justify-between transition hover:border-slate-300 cursor-pointer active:scale-[0.98]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                      <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-900 truncate">{tx.name}</span>
                      <span className="text-xs text-slate-500 truncate capitalize">{tx.category || 'Outros'} • {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    <span className={`text-sm font-bold tracking-tight ${isIncome ? 'text-income-green' : 'text-expense-red'}`}>
                      {isIncome ? '+ ' : '- '}{formatCurrency(tx.amount)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isPaid ? 'bg-status-paid-bg text-status-paid-text border-emerald-100' : 'bg-status-pending-bg text-status-pending-text border-amber-200'}`}>
                      {isPaid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <MonthPickerModal isOpen={isMonthModalOpen} onClose={() => setIsMonthModalOpen(false)} currentDate={currentDate} onSelectDate={setCurrentDate} />

    </div>
  );
}