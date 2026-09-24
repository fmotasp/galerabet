import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { Access } from '../../types';
import { useAccesses } from '../../hooks/useAccesses';
import { uploadAccessCoverToDrive } from '../../lib/googleDrive';
import { useApp } from '../../context/AppContext';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToEdit: Access | null;
}

export const AccessModal: React.FC<AccessModalProps> = ({ isOpen, onClose, accessToEdit }) => {
  const { addAccess, updateAccess, accessCategories, fetchAccessCategories } = useAccesses();
  const { addToast } = useApp();
  
  const [title, setTitle] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [category, setCategory] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverFileId, setCoverFileId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAccessCategories();
  }, [fetchAccessCategories]);

  useEffect(() => {
    if (accessToEdit) {
      setTitle(accessToEdit.title);
      setSiteUrl(accessToEdit.siteUrl || '');
      setCategory(accessToEdit.category || '');
      setLogin(accessToEdit.login);
      setPassword(accessToEdit.password || '');
      setCoverImageUrl(accessToEdit.coverImageUrl || '');
      setCoverFileId(accessToEdit.coverFileId || '');
    } else {
      setTitle('');
      setSiteUrl('');
      setCategory('');
      setLogin('');
      setPassword('');
      setCoverImageUrl('');
      setCoverFileId('');
    }
  }, [accessToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Erro', 'Por favor, selecione apenas arquivos de imagem.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadAccessCoverToDrive(file);
      if (result) {
        setCoverImageUrl(result.url);
        setCoverFileId(result.fileId);
        addToast('Sucesso', 'Imagem de capa carregada.', 'success');
      } else {
        throw new Error('Falha no upload');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro', 'Ocorreu um erro ao enviar a imagem.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      addToast('Atenção', 'Preencha pelo menos o Nome/Título do acesso.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessData = {
        title,
        siteUrl,
        category,
        login,
        password,
        coverImageUrl,
        coverFileId,
      };

      if (accessToEdit) {
        await updateAccess(accessToEdit.id, accessData);
      } else {
        await addAccess(accessData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-white">
            {accessToEdit ? 'Editar Acesso' : 'Novo Acesso'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="access-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Capa do Acesso (Google Drive)</label>
              <div 
                className={`relative w-full h-40 border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center transition-colors ${
                  coverImageUrl ? 'border-[#3A3A3A]' : 'border-[#3A3A3A] hover:border-[#E4007E] bg-[#1A1A1A]'
                }`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {coverImageUrl ? (
                  <>
                    <img src={coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Trocar Imagem
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin text-[#E4007E]" />
                        <span className="text-sm font-medium">Enviando para o Drive...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-sm font-medium">Clique para selecionar imagem</span>
                        <span className="text-xs text-slate-500">JPG, PNG ou GIF</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: galera.bet ou Conta Comercial"
                className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all"
                required
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Site / URL</label>
              <input
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="Ex: https://galera.bet"
                className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all cursor-pointer"
              >
                <option value="">Nenhuma</option>
                {accessCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Login */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Login *</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Usuário ou E-mail"
                className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Senha *</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all font-mono"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex justify-end gap-3 bg-[#1A1A1A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="access-form"
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 bg-[#E4007E] hover:bg-[#E94E18] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {accessToEdit ? 'Salvar' : 'Criar Acesso'}
          </button>
        </div>
      </div>
    </div>
  );
};
