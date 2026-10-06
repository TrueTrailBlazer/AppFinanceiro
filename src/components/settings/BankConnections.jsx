import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Building2, Plus, RefreshCw, Trash2, CheckCircle2, 
  ArrowLeft, ShieldCheck, Loader2 
} from 'lucide-react';
import { 
  fetchConnectToken, 
  fetchUserPluggyItems, 
  savePluggyItem, 
  syncPluggyItem, 
  deletePluggyItem 
} from '../../services/pluggy';
import { PluggyConnect } from 'react-pluggy-connect';

export function BankConnections({ onBack }) {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useNotifications();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectToken, setConnectToken] = useState(null);
  const [syncingItemId, setSyncingItemId] = useState(null);

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
    } catch (err) {
      console.error('Erro ao gerar token da Pluggy:', err);
      showAlert(err.message || 'Erro ao iniciar conexão com a Pluggy', 'error');
      setConnecting(false);
    }
  };

  const handleConnectSuccess = async (data) => {
    try {
      setConnectToken(null);
      setConnecting(false);
      showAlert('Instituição autenticada! Sincronizando dados...', 'info');

      const item = data.item || { id: data.id, connector: data.connector };
      await savePluggyItem(user.id, item);

      // Dispara sincronização inicial de contas e transações
      const syncResult = await syncPluggyItem(item.id);
      const total = syncResult?.totalTransactions ?? 0;
      showAlert(`Conexão concluída! ${total} transações importadas para o seu extrato.`, 'success');
      await loadItems();
    } catch (syncErr) {
      console.error('Erro pós conexão:', syncErr);
      showAlert('Banco conectado, mas houve erro na sincronização: ' + syncErr.message, 'warning');
      await loadItems();
    }
  };

  const handleConnectError = (error) => {
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

  const handleSyncItem = async (itemId, connectorName) => {
    setSyncingItemId(itemId);
    try {
      const result = await syncPluggyItem(itemId);
      const total = result?.totalTransactions ?? 0;
      showAlert(`Sincronização de ${connectorName} concluída! ${total} novas transações adicionadas.`, 'success');
      await loadItems();
    } catch (err) {
      console.error('Erro na sincronização sob demanda:', err);
      showAlert('Falha na sincronização: ' + (err.message || 'Erro de comunicação'), 'error');
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId, connectorName) => {
    const confirmed = await showConfirm(
      `Deseja realmente desconectar a conta do ${connectorName}? As transações já importadas serão mantidas no extrato.`,
      'Desconectar Instituição'
    );

    if (!confirmed) return;

    try {
      await deletePluggyItem(itemId);
      setItems(prev => prev.filter(i => i.item_id !== itemId));
      showAlert(`${connectorName} desconectado com sucesso.`, 'success');
    } catch (err) {
      showAlert('Erro ao desconectar banco: ' + err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-start h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      
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

      <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-background overflow-hidden relative shadow-2xl">
        
        {/* Header Minimalista */}
        <div className="flex items-center justify-between py-5 px-5 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-card-hover text-foreground transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Contas Bancárias</h1>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
            Open Finance
          </span>
        </div>

        {/* Banner de Segurança */}
        <div className="p-4 mx-4 mt-4 bg-card border border-border rounded-2xl flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck size={18} />
            </div>
            <div className="text-xs text-foreground/80 leading-relaxed">
              <p className="font-semibold text-foreground">Conexão Segura e Criptografada</p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Seus dados são sincronizados em modo somente-leitura através do ecossistema Open Finance regulamentado pelo Banco Central.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 text-[11px] text-gray-400 flex items-center gap-2 font-medium">
            <span className="text-foreground font-semibold">Instrução:</span>
            <span>Conecte suas contas em <b>meu.pluggy.ai</b> e escolha o conector <b>MeuPluggy</b> no widget.</span>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={28} />
              <p className="text-xs font-medium">Buscando contas bancárias...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center my-6">
              <div className="w-16 h-16 rounded-2xl bg-card-hover border border-border flex items-center justify-center text-blue-500 mb-4 shadow-inner">
                <Building2 size={28} />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1">Nenhum banco conectado</h3>
              <p className="text-xs text-gray-500 max-w-[240px] mb-6">
                Conecte seu banco via Pluggy para que seus gastos e rendimentos caiam automaticamente no seu extrato.
              </p>
              <button
                onClick={handleStartConnect}
                disabled={connecting}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                {connecting ? 'Iniciando Pluggy...' : 'Conectar Meu Primeiro Banco'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Instituições Conectadas ({items.length})
                </h2>
              </div>

              {items.map((item) => {
                const isSyncing = syncingItemId === item.item_id;
                const lastSync = item.last_sync_at 
                  ? new Date(item.last_sync_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                  : 'Nunca';

                return (
                  <div 
                    key={item.id}
                    className="p-4 bg-card border border-border rounded-2xl flex flex-col gap-3 shadow-sm hover:border-border/80 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.connector_image_url ? (
                          <img 
                            src={item.connector_image_url} 
                            alt={item.connector_name} 
                            className="w-10 h-10 rounded-xl object-contain bg-card-hover p-1 border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                            <Building2 size={20} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground text-sm">{item.connector_name || 'Banco Conectado'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado
                            </span>
                            <span className="text-[10px] text-gray-500">• Último sync: {lastSync}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.item_id, item.connector_name)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Desconectar instituição"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Botão de sincronização sob demanda */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Extrato automático ativado</span>
                      <button
                        onClick={() => handleSyncItem(item.item_id, item.connector_name)}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 py-1.5 px-3 bg-card-hover hover:bg-card-hover/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin text-blue-500' : 'text-gray-400'} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer com botão de adicionar caso já tenha bancos */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-md shrink-0">
            <button
              onClick={handleStartConnect}
              disabled={connecting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {connecting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {connecting ? 'Iniciando Pluggy...' : 'Conectar Outra Conta Bancária'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
