import { CATEGORIES, type CategoryKey } from '../../utils/constants';

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant',
  transport: 'directions_car',
  home: 'home',
  housing: 'home',
  leisure: 'local_activity',
  entertainment: 'local_activity',
  shopping: 'shopping_bag',
  salary: 'payments',
  investment: 'trending_up',
  extra: 'payments',
  health: 'medical_services',
  education: 'school',
  bills: 'receipt_long',
  services: 'build',
  others: 'category',
};

interface CategorySelectorGridProps {
  type: string;
  category: string;
  setCategory: (category: string) => void;
  name: string;
  setName: (name: string) => void;
}

export default function CategorySelectorGrid({
  type,
  category,
  setCategory,
  name,
  setName
}: CategorySelectorGridProps) {
  const selectedCategoryLabel = CATEGORIES[category as CategoryKey]?.label || 'Outros';

  return (
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
            key={key} 
            type="button" 
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
              {CATEGORY_ICONS[key] || 'category'}
            </span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
