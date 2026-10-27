import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Camera, User, Loader2, Save } from 'lucide-react';
import { SettingsHeader } from './SettingsHeader';

export interface ProfileSettingsProps {
  onBack: () => void;
}

export function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const { user, setUser } = useAuth();
  const { showAlert, showConfirm } = useNotifications();

  const [name, setName] = useState<string>(
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.first_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '') ||
    ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>((user?.user_metadata?.avatar_url as string | undefined) || '');
  const [pendingDelete, setPendingDelete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Liberação de memória alocada para Blob URL temporário
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        showAlert('Imagem muito grande. Máximo 2MB.', 'warning');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let avatar_url = (user.user_metadata?.avatar_url as string | undefined) || '';

      // Se o usuário clicou para deletar a foto, limpamos a URL
      if (pendingDelete) {
        avatar_url = '';
      }

      // 1. Upload da imagem se houver novo arquivo
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Pegar URL Pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatar_url = publicUrl;
      }

      // 2. Atualizar metadados do usuário
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: name,
          name: name,
          first_name: name.trim().split(' ')[0],
          avatar_url: avatar_url,
        },
      });

      if (updateError) throw updateError;

      // 3. Atualizar contexto local para refletir na UI sem refresh
      if (updatedUser) {
        setUser(updatedUser);
      }

      showAlert('Perfil atualizado com sucesso!', 'success');
      onBack(); // Volta para o menu
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      showAlert('Erro ao atualizar: ' + errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    const confirmed = await showConfirm('Deseja remover sua foto de perfil?', 'Remover Foto');
    if (!confirmed) return;
    
    setAvatarPreview('');
    setAvatarFile(null);
    setPendingDelete(true);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 pt-1 pb-8">
      <SettingsHeader title="Meu Perfil" onBack={onBack} />

      <form id="profile-form" onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-sm border border-border-subtle space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-slate-100 border border-border-subtle overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={44} className="text-slate-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Alterar foto"
              className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 p-2.5 rounded-full text-white shadow-md active:scale-90 transition-all"
            >
              <Camera size={16} />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />

          {avatarPreview && (
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="text-[12px] font-bold text-rose-600 hover:bg-rose-50 py-1.5 px-3 rounded-lg active:scale-95 transition-all"
            >
              Remover foto
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Seu nome</label>
            <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Como devemos te chamar?"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-slate-900 outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">E-mail (não editável)</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar alterações</>}
        </button>
      </form>
    </div>
  );
}
