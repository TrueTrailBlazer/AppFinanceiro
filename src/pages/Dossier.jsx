import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllUserTransactions } from '../services/transactions';
import { getCategory } from '../utils/constants';
import { formatCents } from '../utils/money';
import { formatLocalDate } from '../utils/date';
import { ArrowLeft, Printer, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dossier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const allTxs = await fetchAllUserTransactions(user.id, true);
        // Filtra apenas contas programadas (sem pluggy_id e não é entrada consolidada)
        const planned = allTxs.filter(t => !t.pluggy_transaction_id && !t.is_consolidated && t.type !== 'income');
        setBills(planned);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Agrupa contas pelo nome base (removendo a parte "(X/Y)" se houver)
  const groupedBills = bills.reduce((acc, bill) => {
    const baseName = bill.name.replace(/\s\(\d+\/\d+\)$/, '').trim();
    if (!acc[baseName]) acc[baseName] = [];
    acc[baseName].push(bill);
    return acc;
  }, {});

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white min-h-screen text-black p-4 sm:p-8">
      {/* Esconde a nav bar e botões na hora da impressão */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
          <Printer size={18} /> Exportar PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center pb-6 border-b-2 border-gray-200">
          <h1 className="text-3xl font-black uppercase tracking-tight">Dossiê Anual de Contas</h1>
          <p className="text-gray-500 mt-2">Relatório consolidado de pagamentos do ano de {currentYear}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando relatório...</div>
        ) : (
          Object.entries(groupedBills).map(([name, items]) => {
            // Conta os itens deste ano
            const yearItems = items.filter(t => new Date(t.created_at).getFullYear() === currentYear);
            if (yearItems.length === 0) return null;

            const cat = getCategory(yearItems[0].category);

            return (
              <div key={name} className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                  <cat.icon size={20} className={cat.color} /> {name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* Gera os 12 meses do ano para exibir o grid */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthBills = yearItems.filter(t => new Date(t.created_at).getMonth() === i);
                    
                    return (
                      <div key={i} className="border rounded-lg p-3 flex flex-col gap-1 text-sm bg-gray-50/50">
                        <span className="font-bold text-gray-400 uppercase text-xs mb-1">
                          {new Date(currentYear, i).toLocaleString('pt-BR', { month: 'short' })}
                        </span>
                        
                        {monthBills.length > 0 ? (
                          monthBills.map(bill => {
                            const today = new Date();
                            const target = new Date(bill.created_at);
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
