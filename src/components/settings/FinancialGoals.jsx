import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
    Flag, Plus, Target, Calendar, Trash2, 
    TrendingUp, ChevronRight, CheckCircle2, 
    ArrowRight, Pencil, Trash
} from 'lucide-react';

export function FinancialGoals({ onBack }) {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useNotifications();

    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

    // Form States
    const [editingGoal, setEditingGoal] = useState(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('0');
    const [deadline, setDeadline] = useState('');

    // Contribute state
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [contributeAmount, setContributeAmount] = useState('');

    useEffect(() => {
        if (user) fetchGoals();
    }, [user]);

    const fetchGoals = async () => {
        const { data, error } = await supabase
            .from('financial_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            showAlert('Erro ao buscar metas', 'error');
        } else {
            setGoals(data);
        }
        setLoading(false);
    };

    const handleSaveGoal = async (e) => {
        e.preventDefault();
        if (!name || !targetAmount) return;

        const goalData = {
            user_id: user.id,
            name,
            target_amount: parseFloat(targetAmount),
            current_amount: parseFloat(currentAmount || 0),
            deadline: deadline || null
        };

        let error;
        if (editingGoal) {
            const { error: err } = await supabase
                .from('financial_goals')
                .update(goalData)
                .eq('id', editingGoal.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('financial_goals')
                .insert([goalData]);
            error = err;
        }

        if (error) {
            showAlert('Erro ao salvar meta', 'error');
        } else {
            showAlert(editingGoal ? 'Meta atualizada!' : 'Meta criada com sucesso!', 'success');
            resetForm();
            setIsModalOpen(false);
            fetchGoals();
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!selectedGoal || !contributeAmount) return;

        const newAmount = parseFloat(selectedGoal.current_amount || 0) + parseFloat(contributeAmount);
        
        const { error } = await supabase
            .from('financial_goals')
            .update({ current_amount: newAmount })
            .eq('id', selectedGoal.id);

        if (error) {
            showAlert('Erro ao adicionar valor', 'error');
        } else {
            showAlert('Aporte realizado!', 'success');
            setIsContributeModalOpen(false);
            setContributeAmount('');
            fetchGoals();
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Deseja excluir esta meta permanentemente?', 'Excluir Meta');
        if (!confirmed) return;

        const { error } = await supabase
            .from('financial_goals')
            .delete()
            .eq('id', id);

        if (error) {
            showAlert('Erro ao excluir', 'error');
        } else {
            setGoals(prev => prev.filter(g => g.id !== id));
            showAlert('Meta excluída', 'success');
        }
    };

    const resetForm = () => {
        setEditingGoal(null);
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline('');
    };

    const openEdit = (goal) => {
        setEditingGoal(goal);
        setName(goal.name);
        setTargetAmount(goal.target_amount.toString());
        setCurrentAmount(goal.current_amount.toString());
        setDeadline(goal.deadline || '');
        setIsModalOpen(true);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:justify-center md:items-center animate-in slide-in-from-right-4 duration-300">
            
            <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] md:flex-initial md:h-auto md:max-h-[85vh] md:w-full md:rounded-3xl md:border md:border-[#222] md:shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="flex items-center justify-between py-5 px-5 bg-[#121212] border-b border-[#222] shrink-0">
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target size={20} className="text-blue-500" /> Metas
                    </h1>
                    <button 
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white p-2 rounded-xl active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <p className="text-center text-gray-500 py-10 text-sm">Carregando metas...</p>
                    ) : goals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4 border border-dashed border-[#222] rounded-3xl bg-[#121212]/30">
                            <Flag size={40} className="opacity-20 text-blue-500" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">Nenhuma meta ainda</p>
                                <p className="text-[10px] mt-1">Defina objetivos para o seu futuro financeiro.</p>
                            </div>
                        </div>
                    ) : (
                        goals.map(goal => {
                            const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
                            const remaining = Math.max(0, goal.target_amount - goal.current_amount);
                            
                            return (
                                <div key={goal.id} className="bg-[#121212] border border-[#222] rounded-3xl p-5 space-y-4 hover:border-blue-500/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white">{goal.name}</h3>
                                                {goal.deadline && (
                                                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> Até {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(goal)} className="p-1.5 text-gray-600 hover:text-white transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-gray-600 hover:text-red-500 transition-colors">
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-gray-400 uppercase tracking-wider">{progress}% Concluído</span>
                                            <span className="text-white">R$ {goal.current_amount.toLocaleString()} / R$ {goal.target_amount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {progress < 100 ? (
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="text-[10px] text-gray-500">
                                                Faltam <span className="text-blue-400 font-bold">R$ {remaining.toLocaleString()}</span>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedGoal(goal); setIsContributeModalOpen(true); }}
                                                className="bg-blue-600/10 text-blue-500 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                            >
                                                Adicionar Valor
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] pt-1">
                                            <CheckCircle2 size={12} /> Meta Concluída! Parabéns!
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Back Button */}
                <div className="p-4 pb-8 md:pb-4 border-t border-[#222] bg-[#121212] shrink-0 md:hidden">
                    <button onClick={onBack} className="w-full px-5 py-3.5 rounded-xl border border-[#333] text-gray-300 font-bold text-sm">
                        Voltar
                    </button>
                </div>
            </div>

            {/* --- MODAL ADICIONAR/EDITAR --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center">
                    <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] animate-in slide-in-from-bottom-10 duration-200 md:flex-initial md:h-auto md:max-h-[85vh] md:rounded-3xl border-t md:border border-[#222] overflow-hidden">
                        <div className="p-5 border-b border-[#222] text-center shrink-0">
                            <h2 className="text-sm font-bold text-white">{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</h2>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            <form id="goal-form" onSubmit={handleSaveGoal} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">O que você quer alcançar?</label>
                                        <input type="text" placeholder="Ex: Reserva de Emergência" value={name} onChange={e => setName(e.target.value)} autoFocus
                                            className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500 transition-all"/>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Meta final (R$)</label>
                                            <input type="number" placeholder="5000" value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500 transition-all"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Já tenho (R$)</label>
                                            <input type="number" placeholder="0" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500 transition-all"/>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Prazo Planejado (Opcional)</label>
                                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500 transition-all [&::-webkit-calendar-picker-indicator]:invert"/>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 pb-8 md:pb-4 border-t border-[#222] bg-[#121212] flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-5 py-3.5 rounded-xl border border-[#333] text-gray-300 font-bold text-xs uppercase tracking-wider">Cancelar</button>
                            <button type="submit" form="goal-form" className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Salvar Meta</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL APORTE --- */}
            {isContributeModalOpen && (
                <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#121212] border border-[#222] rounded-3xl p-6 space-y-6 shadow-2xl">
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white">Adicionar Valor</h3>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Meta: {selectedGoal?.name}</p>
                        </div>

                        <div className="space-y-1.5 text-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Quanto você guardou?</label>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-bold text-blue-500">R$</span>
                                <input 
                                    type="number" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} autoFocus
                                    className="bg-transparent text-4xl font-bold text-white outline-none w-40 text-center" placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsContributeModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-[#333] text-gray-400 font-bold text-xs uppercase tracking-wider">Sair</button>
                            <button onClick={handleContribute} className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
