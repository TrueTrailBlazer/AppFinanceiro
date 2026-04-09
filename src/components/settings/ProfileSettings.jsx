import { useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Camera, User, Loader2, ArrowLeft, Save, X } from 'lucide-react';

export function ProfileSettings({ onBack }) {
    const { user, setUser } = useAuth();
    const { showAlert, showConfirm } = useNotifications();

    const [name, setName] = useState(user?.user_metadata?.display_name || '');
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.user_metadata?.avatar_url || '');
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
                showAlert('Imagem muito grande. Máximo 2MB.', 'warning');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let avatar_url = user?.user_metadata?.avatar_url || '';

            // 1. Upload da imagem se houver novo arquivo
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

                const { error: uploadError, data } = await supabase.storage
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
                    avatar_url: avatar_url
                }
            });

            if (updateError) throw updateError;

            // 3. Atualizar contexto local para refletir na UI sem refresh
            setUser(updatedUser);

            showAlert('Perfil atualizado com sucesso!', 'success');
            onBack(); // Volta para o menu
        } catch (error) {
            showAlert('Erro ao atualizar: ' + error.message, 'error');
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
        <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:justify-center md:items-center animate-in slide-in-from-right-4 duration-300">

            <div className="flex-1 w-full flex flex-col max-w-md mx-auto bg-[#050505] md:flex-initial md:h-auto md:max-h-[85vh] md:rounded-3xl md:border md:border-[#222] md:shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="px-5 py-5 border-b border-[#222] text-center bg-[#121212] shrink-0">
                    <h2 className="text-lg font-bold text-white">Editar Perfil</h2>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form id="profile-form" onSubmit={handleSave} className="space-y-8 flex flex-col items-center">

                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-[#121212] border-2 border-[#222] overflow-hidden flex items-center justify-center relative shadow-2xl">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-gray-600" />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Camera className="text-white" size={24} />
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg active:scale-90 transition-transform md:hidden"
                                >
                                    <Camera size={16} />
                                </button>
                            </div>

                            {avatarPreview && (
                                <button
                                    type="button"
                                    onClick={handleDeletePhoto}
                                    className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:text-red-400 transition-colors py-1 px-3 rounded-lg hover:bg-red-500/10 active:scale-95 transition-all"
                                >
                                    Remover Foto
                                </button>
                            )}
                        </div>

                        {/* Campos */}
                        <div className="w-full space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Seu Nome</label>
                                <div className="relative bg-[#1a1a1a] rounded-xl border border-[#222] focus-within:border-blue-500/50 transition-colors">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={16} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Como devemos te chamar?"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-white outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 opacity-50">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email (Não editável)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={user?.email}
                                    className="w-full bg-[#121212] border border-[#222] rounded-xl px-4 py-3.5 text-sm text-gray-600 cursor-not-allowed"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 pb-8 md:pb-4 border-t border-[#222] bg-[#121212] shrink-0 flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 px-5 py-3.5 rounded-xl border border-[#333] text-gray-300 font-bold hover:bg-[#222] active:scale-95 transition-all text-center"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="profile-form"
                        disabled={loading || !name}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
                    </button>
                </div>

            </div>
        </div>
    );
}
