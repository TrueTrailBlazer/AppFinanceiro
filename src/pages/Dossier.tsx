import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchTransactionsByYear } from '../services/transactions';
import { getCategory } from '../utils/constants';
import { formatCents } from '../utils/money';
import { parseLocalDate } from '../utils/date';
import { ArrowLeft, Printer, CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TransactionRow } from '../types/models';

export default function Dossier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [bills, setBills] = useState<TransactionRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const yearTxs = await fetchTransactionsByYear(user.id, selectedYear, false, true);
        // Filtra apenas contas programadas (sem pluggy_id e não é receita)
        const planned = yearTxs.filter(t => !t.pluggy_transaction_id && t.type !== 'income');
        setBills(planned);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, selectedYear]);

  // Agrupa contas pelo nome base (removendo a parte "(X/Y)" se houver)
  const groupedBills = bills.reduce<Record<string, TransactionRow[]>>((acc, bill) => {
    const baseName = bill.name.replace(/\s\(\d+\/\d+\)$/, '').trim();
    if (!acc[baseName]) acc[baseName] = [];
    acc[baseName].push(bill);
    return acc;
  }, {});

  return (
    <div className="bg-white min-h-screen text-black p-4 sm:p-8">
      {/* Esconde a nav bar e botões na hora da impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print flex flex-wrap justify-between items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeft size={20} /> Voltar
        </button>

        {/* Seletor Interativo de Ano */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200">
          <button 
            onClick={() => setSelectedYear(y => y - 1)} 
            className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors active:scale-95"
            aria-label="Ano anterior"
            type="button"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-sm px-2 text-slate-900 select-none">{selectedYear}</span>
          <button 
            onClick={() => setSelectedYear(y => y + 1)} 
            className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors active:scale-95"
            aria-label="Próximo ano"
            type="button"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
          <Printer size={18} /> Exportar PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center pb-6 border-b-2 border-gray-200">
          <h1 className="text-3xl font-black uppercase tracking-tight">Dossiê Anual de Contas</h1>
          <p className="text-gray-500 mt-2">Relatório consolidado de pagamentos do ano de {selectedYear}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando relatório...</div>
        ) : (
          Object.entries(groupedBills).map(([name, items]) => {
            // Conta os itens deste ano
            const yearItems = items.filter(t => parseLocalDate(t.created_at).getFullYear() === selectedYear);
            if (yearItems.length === 0) return null;

            const cat = getCategory(yearItems[0].category);
            const CatIcon = cat.icon;

            return (
              <div key={name} className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                  <CatIcon size={20} className={cat.color} /> {name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* Gera os 12 meses do ano para exibir o grid */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthBills = yearItems.filter(t => parseLocalDate(t.created_at).getMonth() === i);
                    
                    return (
                      <div key={i} className="border rounded-lg p-3 flex flex-col gap-1 text-sm bg-gray-50/50">
                        <span className="font-bold text-gray-400 uppercase text-xs mb-1">
                          {new Date(selectedYear, i).toLocaleString('pt-BR', { month: 'short' })}
                        </span>
                        
                        {monthBills.length > 0 ? (
                          monthBills.map(bill => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const target = parseLocalDate(bill.created_at);
                            target.setHours(0, 0, 0, 0);
                            const isOverdue = !bill.is_paid && today > target;

                            return (
                              <div key={bill.id} className="flex flex-col gap-1">
                                <span className="font-bold text-black">{formatCents(bill.amount)}</span>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    bill.is_paid ? 'bg-green-100 text-green-700' :
                                    isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {bill.is_paid ? <><CheckCircle2 size={10}/> PAGO</> :
                                     isOverdue ? <><AlertCircle size={10}/> ATRASO</> :
                                     <><Clock size={10}/> VENCER</>}
                                  </span>
                                </div>
                                {/* Exibe o link do comprovante na impressão se houver */}
                                {bill.receipt_url && (
                                  <a href={bill.receipt_url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 mt-1 flex items-center gap-1">
                                    <Printer size={10} /> Recibo Anexado
                                  </a>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-gray-300 italic">Sem registro</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
