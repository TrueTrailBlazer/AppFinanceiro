import { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  FileUp, ChevronLeft, Check, AlertCircle, 
  Settings2, Table, Loader2, ArrowRight,
  Sparkles, CalendarRange, Undo2, CheckCircle2, XCircle
} from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';
import Papa from 'papaparse';

export function CSVImport({ onBack }) {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useNotifications();
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review
  
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isAutoMapped, setIsAutoMapped] = useState(false);
  
  const [mapping, setMapping] = useState({
    date: '',
    name: '',
    amount: ''
  });
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastInsertedIds, setLastInsertedIds] = useState([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const fileInputRef = useRef(null);

  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  };

  const guessMapping = (allHeaders) => {
    const keys = { date: '', name: '', amount: '' };
    allHeaders.forEach(h => {
      const n = normalize(h);
      if (n.includes('data') || n.includes('date') || n.includes('quando') || n.includes('lancto')) keys.date = h;
      if (n.includes('descri') || n.includes('descr') || n.includes('historico') || n.includes('lancamento') || n.includes('titulo') || n.includes('title') || n.includes('nome') || n.includes('identificador')) {
        if (!keys.name || !n.includes('identificador')) keys.name = h;
      }
      if (n.includes('valor') || n.includes('amount') || n.includes('montante') || n.includes('quantia') || n.includes('total')) keys.amount = h;
    });
    return keys;
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const data = results.data;
          const allHeaders = Object.keys(data[0]);
          setCsvData(data);
          setHeaders(allHeaders);
          
          let guessed = guessMapping(allHeaders);

          // Delimitador: Se não achou colunas separadas
          if (Object.values(guessed).filter(v => v).length < 3) {
             if (allHeaders.length === 1 && allHeaders[0].includes(';')) {
                const newHeaders = allHeaders[0].split(';');
                const newGuessed = guessMapping(newHeaders);
                if (newGuessed.date && newGuessed.name && newGuessed.amount) {
                   const newData = data.map(row => {
                      const vals = Object.values(row)[0].split(';');
                      const newRow = {};
                      newHeaders.forEach((h, i) => newRow[h] = vals[i]);
                      return newRow;
                   });
                   setCsvData(newData);
                   setHeaders(newHeaders);
                   setMapping(newGuessed);
                   setIsAutoMapped(true);
                   processMapping(newData, newGuessed);
                   return;
                }
             }
          }

          setMapping(guessed);
          
          if (guessed.date && guessed.name && guessed.amount) {
            setIsAutoMapped(true);
            processMapping(data, guessed);
          } else {
            setIsAutoMapped(false);
            setStep(2);
          }
        } else {
          showAlert('O arquivo parece estar vazio.', 'error');
        }
      },
      error: (error) => {
        showAlert('Erro ao ler CSV: ' + error.message, 'error');
      }
    });
  };

  const detectInstallments = (name) => {
    const regex = /(?:\(|\[|parcela\s+)(\d+)\s*(?:\/|de)\s*(\d+)(?:\)|\])/i;
    const match = name.match(regex);
    if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        if (current > 0 && total >= current && total < 100) {
            return { current, total };
        }
    }
    return null;
  };

  const parseDateBR = (dateString) => {
    if (!dateString) return new Date();
    let d = new Date(dateString);
    if (!isNaN(d.getTime()) && dateString.includes('-')) return d;
    const parts = dateString.split(/[\/\-.]/);
    if (parts.length >= 2) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : new Date().getFullYear();
      const constructed = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(constructed.getTime())) return constructed;
    }
    return new Date();
  };

  const processMapping = (data = csvData, currentMapping = mapping) => {
    if (!currentMapping.date || !currentMapping.name || !currentMapping.amount) {
      showAlert('Por favor, mapeie todas as colunas obrigatórias.', 'warning');
      setStep(2);
      return;
    }

    const allTransactions = [];

    data.forEach(row => {
      const rawName = String(row[currentMapping.name] || 'Sem Nome');
      let rawAmount = String(row[currentMapping.amount] || '0').replace('R$', '').replace(/\s/g, '');
      
      let isNegative = false;
      if (rawAmount.endsWith('-')) { isNegative = true; rawAmount = rawAmount.slice(0, -1); }
      else if (rawAmount.startsWith('-')) { isNegative = true; }

      if (rawAmount.includes(',') && rawAmount.includes('.')) {
        rawAmount = rawAmount.replace(/\./g, '').replace(',', '.');
      } else if (rawAmount.includes(',')) {
        rawAmount = rawAmount.replace(',', '.');
      }
      
      const amount = Math.abs(parseFloat(rawAmount)) || 0;
      const type = isNegative ? 'variable' : 'income';
      const baseDate = parseDateBR(row[currentMapping.date]);

      const desc = rawName.toLowerCase();
      let category = 'others';
      if (desc.includes('food') || desc.includes('restaurante') || desc.includes('ifood')) category = 'food';
      else if (desc.includes('uber') || desc.includes('posto') || desc.includes('combustivel')) category = 'transport';
      else if (desc.includes('amazon') || desc.includes('mercado') || desc.includes('compras')) category = 'shopping';
      else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('lazer')) category = 'entertainment';
      else if (desc.includes('pix') && !isNegative) category = 'extra';

      const inst = detectInstallments(rawName);
      if (inst && type !== 'income') {
        const baseName = rawName.replace(/(?:\(|\[|parcela\s+)?\d+\s*(?:\/|de)\s*\d+(?:\)|\])?/i, '').trim();
        for (let i = 1; i <= inst.total; i++) {
          const transactionDate = new Date(baseDate);
          transactionDate.setMonth(baseDate.getMonth() + (i - inst.current));
          allTransactions.push({
            name: `${baseName} (${i}/${inst.total})`,
            amount, type, category,
            is_paid: i <= inst.current, 
            created_at: transactionDate.toISOString(),
          });
        }
      } else {
        allTransactions.push({
          name: rawName, amount, type, category,
          is_paid: true,
          created_at: baseDate.toISOString(),
        });
      }
    });

    setTransactions(allTransactions);
    setStep(3);
  };

  const setAllStatus = (status) => {
    setTransactions(transactions.map(t => ({ ...t, is_paid: status })));
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('transactions').insert(
        transactions.map(t => ({ ...t, user_id: user.id }))
      ).select('id');
      
      if (error) throw error;
      
      setLastInsertedIds(data.map(d => d.id));
      setImportCompleted(true);
      showAlert(`${transactions.length} lançamentos processados com sucesso!`, 'success');
    } catch (error) {
      showAlert('Erro ao importar: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    const confirmed = await showConfirm('Deseja realmente apagar os lançamentos desta importação?', 'Desfazer Importação');
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').delete().in('id', lastInsertedIds);
      if (error) throw error;
      
      showAlert('Importação desfeita com sucesso!', 'success');
      onBack();
    } catch (error) {
      showAlert('Erro ao desfazer: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto flex flex-col h-full bg-background">
      
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
        <button onClick={onBack} className="p-2 hover:bg-card-hover rounded-xl transition-colors text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Importador Inteligente</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* Progress Steps */}
        {!importCompleted && (
            <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-wider mb-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-500' : 'text-gray-600'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}>1</span>
                    Arquivo
                </div>
                <div className="w-8 h-[1px] bg-border" />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-gray-600'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}>2</span>
                    Colunas
                </div>
                <div className="w-8 h-[1px] bg-border" />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-gray-600'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}>3</span>
                    Revisão
                </div>
            </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && !importCompleted && (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-3xl bg-card/50 hover:border-blue-500/30 transition-all cursor-pointer group"
               onClick={() => fileInputRef.current.click()}>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <div className="p-4 bg-blue-500/10 rounded-full text-blue-500 mb-4 group-hover:scale-110 transition-transform">
              <FileUp size={32} />
            </div>
            <h3 className="text-foreground font-bold mb-2">Selecione seu arquivo CSV</h3>
            <p className="text-xs text-gray-500 text-center max-w-xs leading-relaxed">
              Arraste seu extrato bancário ou fatura aqui. O sistema reconhecerá automaticamente bancos como Nubank, C6, Inter e Bradesco.
            </p>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && !importCompleted && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                    <Settings2 size={18} />
                    <h3 className="text-xs font-bold uppercase">Ajustar Mapeamento</h3>
                </div>
                <p className="text-[11px] text-gray-500">Não conseguimos identificar todas as colunas automaticamente. Por favor, ajude-nos:</p>
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-600">Coluna da Data</label>
                        <select value={mapping.date} onChange={e => setMapping({...mapping, date: e.target.value})} className="w-full bg-card-hover border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500">
                            <option value="">Selecione...</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-600">Coluna da Descrição (Nome)</label>
                        <select value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})} className="w-full bg-card-hover border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500">
                            <option value="">Selecione...</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-600">Coluna do Valor</label>
                        <select value={mapping.amount} onChange={e => setMapping({...mapping, amount: e.target.value})} className="w-full bg-card-hover border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500">
                            <option value="">Selecione...</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={() => processMapping()} className="w-full bg-blue-600 hover:bg-blue-500 text-foreground font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                Processar Transações <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && !importCompleted && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" /> Revisar e Importar
                </h3>
                
                {/* Seletor de Status Global */}
                <div className="bg-card p-3 rounded-2xl border border-border space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Marcar todos como:</p>
                    <div className="flex gap-2">
                        <button onClick={() => setAllStatus(true)} className="flex-1 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all">
                            <CheckCircle2 size={14} /> Pago
                        </button>
                        <button onClick={() => setAllStatus(false)} className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all">
                            <XCircle size={14} /> Pendente
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {transactions.slice(0, 15).map((t, i) => {
                    const CategoryIcon = CATEGORIES[t.category]?.icon || CATEGORIES.others.icon;
                    const isRetro = detectInstallments(t.name);
                    return (
                        <div key={i} className={`flex items-center justify-between p-3 border rounded-2xl transition-all ${t.is_paid ? 'bg-card border-border' : 'bg-card-hover border-yellow-500/20 shadow-[inset_3px_0_0_0_#eab308]'}`}>
                            <div className="flex items-center gap-3 truncate">
                                <div className="p-2 bg-card-hover rounded-full text-gray-500 shrink-0">
                                    <CategoryIcon size={14} />
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-xs font-bold text-foreground line-clamp-1">{t.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-gray-500 font-medium">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                                        {isRetro && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1"><CalendarRange size={8} /> Parcelamento</span>}
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[13px] font-bold shrink-0 ml-2 ${t.type === 'income' ? 'text-green-400' : 'text-foreground'}`}>
                                {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    );
                })}
                {transactions.length > 15 && <p className="text-center text-[10px] text-gray-600 py-2 font-bold uppercase tracking-widest">... e mais {transactions.length - 15} itens</p>}
            </div>

            <div className="p-4 border-t border-border bg-background sticky bottom-0 -mx-4 pb-8 md:pb-4 flex flex-col gap-3">
                <button 
                    onClick={handleImport} disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-foreground font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Importar {transactions.length} Lançamentos</>}
                </button>
            </div>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {importCompleted && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/30">
                    <Check size={40} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Importação Concluída!</h3>
                <p className="text-sm text-gray-500 text-center mb-10 max-w-[250px]">
                    Todos os {transactions.length} lançamentos foram adicionados ao seu extrato.
                </p>
                
                <div className="w-full space-y-3">
                    <button 
                        onClick={onBack}
                        className="w-full bg-card hover:bg-card-hover text-foreground border border-border font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        Voltar para Configurações
                    </button>
                    <button 
                        onClick={handleUndo} disabled={loading}
                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Undo2 size={18} /> Desfazer Importação</>}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
