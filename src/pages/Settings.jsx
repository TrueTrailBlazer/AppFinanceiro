import { useState } from 'react';
import { User, Zap } from 'lucide-react';
import { RecurringExpenses } from '../components/settings/RecurringExpenses';
import { ProfileSection } from '../components/settings/ProfileSection';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('recurring'); // 'recurring' ou 'profile'

  return (
    <div className="pb-24 max-w-lg mx-auto">
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Ajustes</h1>
      </div>

      {/* Navegação por Abas (Tabs) */}
      <div className="flex p-1 bg-[#121212] rounded-xl border border-[#222] mb-6">
        <button
            onClick={() => setActiveTab('recurring')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'recurring' 
                ? 'bg-[#222] text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
        >
            <Zap size={16} className={activeTab === 'recurring' ? 'text-yellow-400' : ''}/>
            Fixos
        </button>
        <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'profile' 
                ? 'bg-[#222] text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
        >
            <User size={16} className={activeTab === 'profile' ? 'text-blue-500' : ''}/>
            Conta
        </button>
      </div>

      {/* Renderização Condicional Limpa */}
      {activeTab === 'recurring' ? <RecurringExpenses /> : <ProfileSection />}

    </div>
  );
}