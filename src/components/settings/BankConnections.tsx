import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Building2, Plus, RefreshCw, Trash2, 
  ShieldCheck, Loader2 
} from 'lucide-react';
import { SettingsHeader } from './SettingsHeader';
import { 
  fetchConnectToken, 
  fetchUserPluggyItems, 
  savePluggyItem, 
  syncPluggyItem, 
  deletePluggyItem,
  type PluggyConnectItem
} from '../../services/pluggy';
import { PluggyConnect } from 'react-pluggy-connect';
import type { PluggyItemRow } from '../../types/models';

export interface BankConnectionsProps {
  onBack: () => void;
}

interface PluggySuccessData {
  item?: PluggyConnectItem;
  id?: string;
  connector?: {
    id?: number | null;
    name?: string | null;
    imageUrl?: string | null;
  } | null;
}

export function BankConnections({ onBack }: BankConnectionsProps) {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useNotifications();
  
  const [items, setItems] = useState<PluggyItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchUserPluggyItems(user.id);
      setItems(data);
    } catch (err) {
      console.error('Erro ao buscar bancos:', err);
      showAlert('Não foi possível carregar os bancos conectados', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showAlert]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleStartConnect = async () => {
    setConnecting(true);
    try {
      const token = await fetchConnectToken();
      setConnectToken(token);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Erro ao gerar token da Pluggy:', err);
      showAlert(errMsg || 'Erro ao iniciar conexão com a Pluggy', 'error');
      setConnecting(false);
    }
  };

  const handleConnectSuccess = async (data: PluggySuccessData) => {
    if (!user) return;
    try {
      setConnectToken(null);
      setConnecting(false);
      showAlert('Instituição autenticada! Sincronizando dados...', 'info');

      const item: PluggyConnectItem = data.item || { id: data.id || '', connector: data.connector };
      await savePluggyItem(user.id, item);

      // Dispara sincronização inicial de contas e transações
      const syncResult = await syncPluggyItem(item.id);
      const total = syncResult?.totalTransactions ?? 0;
      if (syncResult?.partial) {
        showAlert(
          `Conexão concluída, mas a sincronização foi parcial: ${total} transações importadas. Tente sincronizar novamente em instantes.`,
          'warning'
        );
      } else {
        showAlert(`Conexão concluída! ${total} transações importadas para o seu extrato.`, 'success');
      }
      await loadItems();
    } catch (syncErr: unknown) {
      const errMsg = syncErr instanceof Error ? syncErr.message : String(syncErr);
      console.error('Erro pós conexão:', syncErr);
      showAlert('Banco conectado, mas houve erro na sincronização: ' + errMsg, 'warning');
      await loadItems();
    }
  };

  const handleConnectError = (error: { message?: string } | Error) => {
    console.error('Erro Pluggy Connect:', error);
    setConnectToken(null);
    setConnecting(false);

    if (error?.message === 'TRIAL_CLIENT_ITEM_CREATE_NOT_ALLOWED') {
      showAlert(
        'Para conectar suas contas bancárias reais, configure-as em meu.pluggy.ai e selecione o conector "MeuPluggy" no widget.',
        'warning'
      );
      return;
    }

    showAlert('Falha na conexão: ' + (error?.message || 'Operação cancelada'), 'error');
  };

  const handleConnectClose = () => {
    setConnectToken(null);
    setConnecting(false);
  };

  const handleSyncItem = async (itemId: string, connectorName: string | null) => {
    const safeName = connectorName || 'Banco';
    setSyncingItemId(itemId);
    try {
      const result = await syncPluggyItem(itemId);
      const total = result?.totalTransactions ?? 0;
      if (result?.partial) {
        showAlert(
          `Sincronização parcial de ${safeName}: algumas contas não responderam. ${total} transações importadas. Tente novamente em instantes.`,
          'warning'
        );
      } else if (total > 0) {
        const recMsg = result?.reconciledBills ? ` (${result.reconciledBills} contas a pagar baixadas automaticamente)` : '';
        showAlert(`Sincronização de ${safeName} concluída! ${total} novas transações adicionadas${recMsg}.`, 'success');
      } else {
        showAlert(`Sincronização de ${safeName} concluída! Nenhuma nova movimentação encontrada (seu extrato já está em dia).`, 'info');
      }
      await loadItems();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Erro na sincronização sob demanda:', err);
      showAlert('Falha na sincronização: ' + (errMsg || 'Erro de comunicação'), 'error');
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string, connectorName: string | null) => {
    const safeName = connectorName || 'a instituição';
    const confirmed = await showConfirm(
      `Deseja realmente desconectar a conta do ${safeName}? As transações já importadas serão mantidas no extrato.`,
      'Desconectar Instituição'
    );

    if (!confirmed) return;

    try {
      await deletePluggyItem(itemId);
      setItems(prev => prev.filter(i => i.item_id !== itemId));
      showAlert(`${safeName} desconectado com sucesso.`, 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showAlert('Erro ao desconectar banco: ' + errMsg, 'error');
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 pt-1 pb-8">

      {/* Widget oficial Pluggy Connect quando o token é gerado */}
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          onSuccess={handleConnectSuccess}
          onError={handleConnectError}
          onClose={handleConnectClose}
        />
      )}

      <SettingsHeader
        title="Contas Bancárias"
        onBack={onBack}
        action={
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200 shrink-0">
            Open Finance
          </span>
        }
      />

      <div className="space-y-4">
        {/* Banner de Segurança */}
        <div className="p-4 bg-white border border-border-subtle rounded-2xl flex items-start gap-3 shadow-sm">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-slate-900">Conexão segura</p>
            <p className="text-slate-500 text-[12px] mt-0.5">
              Seus dados são lidos em modo somente leitura pelo Open Finance, regulamentado pelo Banco Central.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
            <p className="text-xs font-medium">Buscando contas bancárias...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center flex flex-col items-center justify-center my-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4">
              <Building2 size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Nenhum banco conectado</h3>
            <p className="text-xs text-slate-500 max-w-[240px] mb-6">
              Conecte seu banco para que seus gastos e rendimentos caiam automaticamente no extrato.
            </p>
            <button
              onClick={handleStartConnect}
              disabled={connecting}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              type="button"
            >
              {connecting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              {connecting ? 'Iniciando...' : 'Conectar meu banco'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Instituições conectadas ({items.length})
            </h2>

            {items.map((item) => {
              const isSyncing = syncingItemId === item.item_id;
              const lastSync = item.last_sync_at
                ? new Date(item.last_sync_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                : 'Nunca';

              return (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-border-subtle rounded-2xl flex flex-col gap-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.connector_image_url ? (
                        <img
                          src={item.connector_image_url}
                          alt={item.connector_name || 'Banco'}
                          className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Building2 size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{item.connector_name || 'Banco conectado'}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
                          </span>
                          <span className="text-[11px] text-slate-500">• Última sincronização: {lastSync}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.item_id, item.connector_name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                      title="Desconectar instituição"
                      aria-label="Desconectar instituição"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Extrato automático ativado</span>
                    <button
                      onClick={() => handleSyncItem(item.item_id, item.connector_name)}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                      type="button"
                    >
                      <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleStartConnect}
              disabled={connecting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              type="button"
            >
              {connecting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {connecting ? 'Iniciando...' : 'Conectar outra conta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
