import React, { useState, useRef } from 'react';
import { createBatchTransactions, deleteBatchTransactions } from '../../services/transactions';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ChevronLeft } from 'lucide-react';
import Papa from 'papaparse';
import CSVStepTracker from './csv/CSVStepTracker';
import CSVUploadStep from './csv/CSVUploadStep';
import CSVMappingStep from './csv/CSVMappingStep';
import CSVReviewStep from './csv/CSVReviewStep';
import CSVSuccessStep from './csv/CSVSuccessStep';
import { guessCSVMapping, transformCSVRowToTransactions } from '../../utils/csv';
import type { CSVColumnMapping, CSVPreviewTransaction, TransactionInsert } from '../../types/models';

interface CSVImportProps {
  onBack: () => void;
}

export function CSVImport({ onBack }: CSVImportProps) {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useNotifications();
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review
  
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    date: '',
    name: '',
    amount: ''
  });
  
  const [transactions, setTransactions] = useState<CSVPreviewTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastInsertedIds, setLastInsertedIds] = useState<number[]>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processMapping = (data: Record<string, string>[] = csvData, currentMapping: CSVColumnMapping = mapping) => {
    if (!currentMapping.date || !currentMapping.name || !currentMapping.amount) {
      showAlert('Por favor, mapeie todas as colunas obrigatórias.', 'warning');
      setStep(2);
      return;
    }

    const allTransactions: CSVPreviewTransaction[] = [];

    data.forEach(row => {
      const rowTxs = transformCSVRowToTransactions(row, currentMapping);
      allTransactions.push(...rowTxs);
    });

    setTransactions(allTransactions);
    setStep(3);
  };


  const applyParsedCSV = (data: Record<string, string>[], allHeaders: string[]) => {
    setCsvData(data);
    setHeaders(allHeaders);

    const guessed = guessCSVMapping(allHeaders);
    setMapping(guessed);

    if (guessed.date && guessed.name && guessed.amount) {
      processMapping(data, guessed);
    } else {
      setStep(2);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const data = results.data;
          const allHeaders = Object.keys(data[0] || {});
          
          // Delimitador: Se Papa Parse não separou colunas e agrupou com ponto-e-vírgula
          if (allHeaders.length === 1 && allHeaders[0].includes(';')) {
            Papa.parse<Record<string, string>>(selectedFile, {
              header: true,
              skipEmptyLines: true,
              delimiter: ';',
              complete: (semiResults) => {
                if (semiResults.data && semiResults.data.length > 0) {
                  applyParsedCSV(semiResults.data, Object.keys(semiResults.data[0] || {}));
                } else {
                  showAlert('O arquivo parece estar vazio.', 'error');
                }
              },
              error: (err: Error) => {
                showAlert('Erro ao ler CSV com delimitador (;): ' + err.message, 'error');
              }
            });
            return;
          }

          applyParsedCSV(data, allHeaders);
        } else {
          showAlert('O arquivo parece estar vazio.', 'error');
        }
      },
      error: (error: Error) => {
        showAlert('Erro ao ler CSV: ' + error.message, 'error');
      }
    });
  };

  const setAllStatus = (status: boolean) => {
    setTransactions(transactions.map(t => ({ ...t, is_paid: status })));
  };

  const handleImport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const transactionsToInsert: TransactionInsert[] = transactions.map(t => ({
        ...t,
        user_id: user.id
      }));
      const data = await createBatchTransactions(transactionsToInsert);
      
      setLastInsertedIds((data || []).map(d => d.id));
      setImportCompleted(true);
      showAlert(`${transactions.length} lançamentos processados com sucesso!`, 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao importar';
      showAlert('Erro ao importar: ' + msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!user || lastInsertedIds.length === 0) return;
    const confirmed = await showConfirm('Deseja realmente apagar os lançamentos desta importação?', 'Desfazer Importação');
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await deleteBatchTransactions(user.id, lastInsertedIds);
      
      showAlert('Importação desfeita com sucesso!', 'success');
      onBack();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao desfazer';
      showAlert('Erro ao desfazer: ' + msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto flex flex-col h-full bg-background">
      
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
        <button onClick={onBack} className="p-2 hover:bg-card-hover rounded-xl transition-colors text-gray-400" type="button" aria-label="Voltar">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Importador Inteligente</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* Progress Steps */}
        <CSVStepTracker step={step} importCompleted={importCompleted} />

        {/* STEP 1: UPLOAD */}
        {step === 1 && !importCompleted && (
          <CSVUploadStep 
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
          />
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && !importCompleted && (
          <CSVMappingStep 
            headers={headers}
            mapping={mapping}
            setMapping={setMapping}
            onProcess={() => processMapping()}
          />
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && !importCompleted && (
          <CSVReviewStep 
            transactions={transactions}
            onSetAllStatus={setAllStatus}
            onImport={handleImport}
            loading={loading}
          />
        )}

        {/* SUCCESS SCREEN */}
        {importCompleted && (
          <CSVSuccessStep 
            transactionsCount={transactions.length}
            onBack={onBack}
            onUndo={handleUndo}
            loading={loading}
          />
        )}

      </div>
    </div>
  );
}

export default CSVImport;
