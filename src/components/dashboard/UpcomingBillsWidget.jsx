import { Link } from 'react-router-dom';
import { getCategory } from '../../utils/constants';
import { formatCents } from '../../utils/money';
import { formatLocalDate } from '../../utils/date';
import { AlertCircle } from 'lucide-react';

export function UpcomingBillsWidget({ plannedBills, loading, handleEdit }) {
  // Filtra as contas não pagas, ordena pela data mais próxima e pega as top 5
  const pendingBills = plannedBills
    .filter(t => !t.is_paid)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 5);

  const getDaysRemaining = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex justify-between items-end px-1">
        <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Próximos Vencimentos</h3>
        <Link to="/bills" className="text-[10px] text-blue-500 hover:text-blue-400 font-medium">Ver todas</Link>
      </div>

      <div className="space-y-2">
        {loading && pendingBills.length === 0 ? (
           <div className="text-center py-6 text-xs text-gray-600 animate-pulse">Carregando...</div>
        ) : pendingBills.length > 0 ? (
          pendingBills.map(t => {
            const catData = getCategory(t.category);
            const CategoryIcon = catData.icon;
            const daysRemaining = getDaysRemaining(t.created_at);
            const isOverdue = daysRemaining < 0;

            return (
              <div 
                key={t.id}
                onClick={() => handleEdit(t)}
                className={`flex justify-between items-center p-3 bg-card border rounded-xl active:bg-card-hover transition-colors cursor-pointer ${isOverdue ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2.5 rounded-full shrink-0 ${isOverdue ? 'bg-red-500/10 text-red-500' : catData.bg}`}>
                    {isOverdue ? <AlertCircle size={18} /> : <CategoryIcon size={18} className={catData.color} />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium truncate text-sm leading-tight ${isOverdue ? 'text-red-500' : 'text-foreground'}`}>{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className={`text-[10px] capitalize ${isOverdue ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                        {isOverdue 
                          ? `Atrasado há ${Math.abs(daysRemaining)} dia(s)` 
                          : daysRemaining === 0 
                            ? 'Vence hoje' 
                            : `Vence em ${daysRemaining} dia(s)`}
                      </p>
                      <span className="text-[8px] text-gray-700">•</span>
                      <p className="text-[10px] text-gray-500 capitalize">{formatLocalDate(t.created_at, {day: '2-digit', month: 'short'})}</p>
                    </div>
                  </div>
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ml-2 ${isOverdue ? 'text-red-500 font-bold' : 'text-foreground'}`}>
                  {formatCents(t.amount)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <p className="text-gray-500 text-xs mb-2">Tudo em dia!</p>
            <Link to="/add" className="text-blue-500 font-bold text-xs hover:underline">Adicionar Nova Conta</Link>
          </div>
        )}
      </div>
    </div>
  );
}
