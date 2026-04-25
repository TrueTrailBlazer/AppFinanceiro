import { Link } from 'react-router-dom';
import { getCategory } from '../../utils/constants';

export function TransactionList({ transactions, loading, recentTransactions, handleEdit }) {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex justify-between items-end px-1">
        <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Últimos Lançamentos</h3>
        <Link to="/extract" className="text-[10px] text-blue-500 hover:text-blue-400 font-medium">Ver tudo</Link>
      </div>

      <div className="space-y-2">
        {loading && transactions.length === 0 ? (
           <div className="text-center py-6 text-xs text-gray-600 animate-pulse">Carregando...</div>
        ) : recentTransactions.length > 0 ? (
          recentTransactions.map(t => {
            const catData = getCategory(t.category);
            const CategoryIcon = catData.icon;

            return (
              <div 
                key={t.id}
                onClick={() => handleEdit(t)}
                className="flex justify-between items-center p-3 bg-card border border-border rounded-xl active:bg-card-hover transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2.5 rounded-full shrink-0 ${catData.bg}`}>
                    <CategoryIcon size={18} className={catData.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate text-sm leading-tight">{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-gray-500 capitalize">{catData.label}</p>
                      <span className="text-[8px] text-gray-700">•</span>
                      <p className="text-[10px] text-gray-500 capitalize">{new Date(t.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                    </div>
                  </div>
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ml-2 ${t.type === 'income' ? 'text-green-400' : 'text-foreground'}`}>
                  {t.type === 'income' ? '+ ' : '- '}
                  {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <p className="text-gray-500 text-xs mb-2">Vazio por aqui.</p>
            <Link to="/add" className="text-blue-500 font-bold text-xs hover:underline">Adicionar</Link>
          </div>
        )}
      </div>
    </div>
  );
}
