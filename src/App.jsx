import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { 
  Home, Layers, Settings, Plus, ChevronLeft, ChevronRight, 
  Trash2, Save, LogOut, Lock, Mail
} from 'lucide-react';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: Chaves do Supabase não encontradas. Verifique o arquivo .env");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TEMA ---
const THEME = {
  bg: '#050505',
  card: '#121212',
  cardBorder: '#222',
  primary: '#3B82F6', // Azul Neon
  secondary: '#8B5CF6', 
  danger: '#EF4444',
  text: '#FFFFFF',
  textMuted: '#737373',
};

const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- COMPONENTES UI ---
const Card = ({ title, value, highlight = false, onClick, subValue }) => (
  <div onClick={onClick} className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    style={{ 
      backgroundColor: THEME.card, 
      borderColor: highlight ? THEME.primary : THEME.cardBorder,
      boxShadow: highlight ? `0 0 20px -10px ${THEME.primary}40` : 'none'
    }}
  >
    <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: THEME.textMuted }}>{title}</p>
    <h3 className="text-2xl font-bold" style={{ color: highlight ? THEME.primary : THEME.text }}>{formatMoney(value)}</h3>
    {subValue && <p className="text-xs mt-1" style={{ color: THEME.textMuted }}>{subValue}</p>}
  </div>
);

const SectionButton = ({ title, onClick, icon: Icon }) => (
  <button onClick={onClick} className="w-full p-4 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all"
    style={{ backgroundColor: THEME.card, border: `1px solid ${THEME.cardBorder}` }}
  >
    <div className="flex items-center gap-3">
      {Icon && <Icon size={20} color={THEME.primary} />}
      <span className="font-medium text-sm text-white">{title}</span>
    </div>
    <div className="bg-[#1a1a1a] p-1 rounded-full group-hover:bg-[#222] transition-colors"><ChevronRight size={16} color={THEME.textMuted} /></div>
  </button>
);

// --- APP PRINCIPAL ---
export default function FluxoApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando Fluxo...</div>;

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30" style={{ backgroundColor: THEME.bg, color: THEME.text }}>
      {!session ? <AuthScreen /> : <MainApp session={session} />}
    </div>
  );
}

// --- TELA DE AUTENTICAÇÃO ---
function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert(error.message);
    } else {
        if (isSignUp) alert("Verifique seu email para confirmar o cadastro!");
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Fluxo</h1>
          <p className="text-gray-500 mt-2">Controle financeiro do futuro</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#121212] border border-[#222] rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-[#222] rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm text-gray-500 hover:text-white">
          {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
        </button>
      </div>
    </div>
  );
}

// --- APP LOGADO ---
function MainApp({ session }) {
  const [screenStack, setScreenStack] = useState(['home']);
  const [transactions, setTransactions] = useState([]);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState('variable'); // fixed | variable | income

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (data) setTransactions([...data]);
  };

  const computed = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const fixed = transactions.filter(t => t.type === 'fixed').reduce((acc, t) => acc + Number(t.amount), 0);
    const variable = transactions.filter(t => t.type === 'variable').reduce((acc, t) => acc + Number(t.amount), 0);
    const totalSpent = fixed + variable;
    const remaining = income - totalSpent;
    return { income, fixed, variable, totalSpent, remaining };
  }, [transactions]);

  const navigateTo = (screen, params = {}) => {
    if (params.resetForm) { setEditingId(null); setFormName(''); setFormAmount(''); }
    if (params.type) setFormType(params.type);
    if (params.item) {
      setEditingId(params.item.id);
      setFormName(params.item.name);
      setFormAmount(params.item.amount);
      setFormType(params.item.type);
    }
    setScreenStack([...screenStack, screen]);
  };

  const goBack = () => { if (screenStack.length > 1) setScreenStack(screenStack.slice(0, -1)); };

  const handleSave = async () => {
    if (!formName || !formAmount) return;
    const payload = { user_id: session.user.id, name: formName, amount: parseFloat(formAmount), type: formType };
    
    if (editingId) {
      await supabase.from('transactions').update(payload).eq('id', editingId);
    } else {
      await supabase.from('transactions').insert([payload]);
    }
    await fetchTransactions();
    goBack();
  };

  const handleDelete = async () => {
    if (editingId && confirm('Tem certeza?')) {
      await supabase.from('transactions').delete().eq('id', editingId);
      await fetchTransactions();
      goBack();
    }
  };

  const handleSignOut = async () => {
      await supabase.auth.signOut();
  }

  const currentScreen = screenStack[screenStack.length - 1];

  return (
    <div className="max-w-md mx-auto min-h-screen relative pb-20">
      
      {/* HEADER */}
      <div className="pt-6 pb-4 px-4 sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10 border-b border-[#1a1a1a] flex items-center">
        {screenStack.length > 1 ? (
          <button onClick={goBack} className="p-2 -ml-2 text-gray-400 hover:text-white"><ChevronLeft /></button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold mr-3 text-white">F</div>
        )}
        <h1 className="text-lg font-bold flex-1 text-white">
          {currentScreen === 'home' && 'Resumo do Mês'}
          {currentScreen === 'list_fixed' && 'Gastos Fixos'}
          {currentScreen === 'list_variable' && 'Gastos Variáveis'}
          {currentScreen === 'settings' && 'Configurações'}
          {currentScreen === 'add' && (editingId ? 'Editar' : 'Adicionar')}
        </h1>
        {currentScreen === 'home' && (
          <button onClick={() => navigateTo('settings')}><Settings size={20} className="text-gray-400" /></button>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {currentScreen === 'home' && (
          <>
            <Card title="Salário / Entradas" value={computed.income} 
              onClick={() => navigateTo('add', { type: 'income', resetForm: true })} subValue="Toque para editar renda" />
            
            <div className="grid grid-cols-2 gap-3">
               <Card title="Total Gasto" value={computed.totalSpent} />
               <Card title="Sobra" value={computed.remaining} highlight={true} />
            </div>

            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Detalhamento</h3>
              <SectionButton title={`Gastos Fixos (${formatMoney(computed.fixed)})`} icon={Layers} onClick={() => navigateTo('list_fixed')} />
              <SectionButton title={`Gastos Variáveis (${formatMoney(computed.variable)})`} icon={Layers} onClick={() => navigateTo('list_variable')} />
            </div>
          </>
        )}

        {(currentScreen === 'list_fixed' || currentScreen === 'list_variable') && (
          <div className="space-y-3">
            <button onClick={() => navigateTo('add', { type: currentScreen === 'list_fixed' ? 'fixed' : 'variable', resetForm: true })}
              className="w-full py-4 bg-blue-600/10 border border-blue-600/50 text-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:bg-blue-600 hover:text-white transition-all">
              <Plus size={20} /> Adicionar Novo
            </button>
            
            {transactions
              .filter(t => t.type === (currentScreen === 'list_fixed' ? 'fixed' : 'variable'))
              .map(t => (
                <div key={t.id} onClick={() => navigateTo('add', { item: t })}
                  className="flex justify-between items-center p-4 bg-[#121212] border border-[#222] rounded-xl active:scale-95 transition-transform cursor-pointer">
                  <span className="font-medium text-white">{t.name}</span>
                  <span className="font-bold text-gray-300">{formatMoney(t.amount)}</span>
                </div>
              ))}
              {transactions.filter(t => t.type === (currentScreen === 'list_fixed' ? 'fixed' : 'variable')).length === 0 && (
                <p className="text-center text-gray-600 py-10">Nenhum gasto lançado.</p>
              )}
          </div>
        )}

        {currentScreen === 'add' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">R$</span>
                <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} autoFocus
                  className="w-full bg-[#121212] border border-[#222] text-4xl font-bold text-white py-6 pl-12 pr-4 rounded-2xl focus:border-blue-500 focus:outline-none" placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Nome / Descrição</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full bg-[#121212] border border-[#222] text-lg text-white p-4 rounded-xl focus:border-blue-500 focus:outline-none" placeholder="Ex: Internet, Mercado..." />
            </div>
            
            <div className="flex gap-3 pt-4">
              {editingId && (
                <button onClick={handleDelete} className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Trash2 size={20} /> Excluir
                </button>
              )}
              <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                <Save size={20} /> Salvar
              </button>
            </div>
          </div>
        )}

        {currentScreen === 'settings' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#121212] rounded-xl border border-[#222]">
              <p className="text-sm text-gray-400 mb-1">Conta logada</p>
              <p className="font-bold text-white">{session.user.email}</p>
            </div>
            <button onClick={handleSignOut} className="w-full p-4 bg-[#121212] rounded-xl border border-[#222] text-red-500 font-bold flex items-center justify-center gap-2">
              <LogOut size={20} /> Sair da conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}