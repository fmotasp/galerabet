import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Building2,
  Palette,
  Upload,
  Image as ImageIcon,
  BookOpen,
  FolderArchive,
  Type,
  Plus,
  Link2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, BrandColor } from '../../types';

export const ProjectModal: React.FC = () => {
  const {
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    editingProject,
    setEditingProject,
    addProject,
    updateProject,
    deleteProject,
  } = useApp();

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const isOpen = isNewProjectModalOpen || editingProject !== null;

  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    description: string;
    labelColor: string;
    logoUrl: string;
    brandManualUrl: string;
    logosPackUrl: string;
    typographyUrl: string;
    additionalMaterialsUrl: string;
    colorPalette: BrandColor[];
  }>({
    name: '',
    category: 'Geral',
    description: '',
    labelColor: 'blue',
    logoUrl: '',
    brandManualUrl: '',
    logosPackUrl: '',
    typographyUrl: '',
    additionalMaterialsUrl: '',
    colorPalette: [
      { name: 'Primária', hex: '#E4007E' },
      { name: 'Secundária', hex: '#E94E18' },
    ],
  });

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name || '',
        category: editingProject.category || 'Geral',
        description: editingProject.description || '',
        labelColor: editingProject.labelColor || 'blue',
        logoUrl: editingProject.logoUrl || '',
        brandManualUrl: editingProject.brandManualUrl || '',
        logosPackUrl: editingProject.logosPackUrl || '',
        typographyUrl: editingProject.typographyUrl || '',
        additionalMaterialsUrl: editingProject.additionalMaterialsUrl || '',
        colorPalette:
          editingProject.colorPalette && editingProject.colorPalette.length > 0
            ? editingProject.colorPalette
            : [
                { name: 'Primária', hex: '#E4007E' },
                { name: 'Secundária', hex: '#E94E18' },
              ],
      });
    } else {
      setFormData({
        name: '',
        category: 'Geral',
        description: '',
        labelColor: 'blue',
        logoUrl: '',
        brandManualUrl: '',
        logosPackUrl: '',
        typographyUrl: '',
        additionalMaterialsUrl: '',
        colorPalette: [
          { name: 'Primária', hex: '#E4007E' },
          { name: 'Secundária', hex: '#E94E18' },
        ],
      });
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsNewProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = () => {
    setFormData((prev) => ({
      ...prev,
      colorPalette: [
        ...prev.colorPalette,
        { name: `Cor ${prev.colorPalette.length + 1}`, hex: '#3B82F6' },
      ],
    }));
  };

  const handleUpdateColor = (index: number, field: keyof BrandColor, value: string) => {
    setFormData((prev) => {
      const nextPalette = [...prev.colorPalette];
      nextPalette[index] = { ...nextPalette[index], [field]: value };
      return { ...prev, colorPalette: nextPalette };
    });
  };

  const handleRemoveColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colorPalette: prev.colorPalette.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload: Omit<Project, 'id'> = {
      name: formData.name.trim(),
      category: formData.category.trim() || 'Geral',
      description: formData.description.trim(),
      status: editingProject ? editingProject.status : 'active',
      progress: editingProject ? editingProject.progress : 0,
      currentSprint: editingProject ? editingProject.currentSprint : 'Sprint Atual',
      iconType: editingProject ? editingProject.iconType : 'rocket',
      iconColor: editingProject ? editingProject.iconColor : 'bg-blue-600',
      teamMemberIds: editingProject ? editingProject.teamMemberIds : [],
      labelColor: formData.labelColor,
      logoUrl: formData.logoUrl,
      colorPalette: formData.colorPalette.filter((c) => Boolean(c.hex)),
      brandManualUrl: formData.brandManualUrl.trim(),
      logosPackUrl: formData.logosPackUrl.trim(),
      typographyUrl: formData.typographyUrl.trim(),
      additionalMaterialsUrl: formData.additionalMaterialsUrl.trim(),
    };

    if (editingProject) {
      updateProject(editingProject.id, payload);
    } else {
      addProject(payload);
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />
      <div className="relative bg-[#141414] rounded-3xl shadow-2xl border border-[#2A2A2A] max-w-xl w-full p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black shadow-md shadow-[#E4007E]/25">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {editingProject ? 'Editar Cliente & Identidade' : 'Novo Cliente & Identidade'}
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre informações, paleta de cores e links de materiais oficiais
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* Seção 1: Dados Gerais do Cliente */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Dados Principais</span>
            </h3>

            {/* Logo do Cliente */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#E4007E]" />
                <span>Logo / Imagem do Cliente</span>
              </label>
              <div className="flex items-center gap-4 p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Preview Logo"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        setFormData((p) => ({ ...p, logoUrl: '' }));
                      }}
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-500" />
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2E2E2E] hover:bg-[#383838] text-slate-200 border border-[#3A3A3A] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, logoUrl: '' }))}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                  />
                  <input
                    type="text"
                    placeholder="Ou cole a URL da imagem/logo..."
                    value={formData.logoUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, logoUrl: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#141414] border border-[#2E2E2E] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#E4007E]"
                  />
                </div>
              </div>
            </div>

            {/* Nome e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome do Cliente / Marca <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Galera Bet, Nike, Luva Bet..."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Categoria / Segmento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Apostas, Esportes, Moda..."
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Descrição / Orientações Gerais (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Observações importantes sobre o cliente ou tom de voz..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Seção 2: Paleta de Cores Oficial */}
          <div className="space-y-3 pt-3 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Paleta de Cores da Marca ({formData.colorPalette.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddColor}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-slate-200 border border-[#2E2E2E] rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#E4007E]" />
                <span>Adicionar Cor</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.colorPalette.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl"
                >
                  {/* Color Picker Input */}
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={color.hex.startsWith('#') && color.hex.length === 7 ? color.hex : '#E4007E'}
                      onChange={(e) => handleUpdateColor(index, 'hex', e.target.value.toUpperCase())}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                  </div>

                  {/* Hex Text */}
                  <div className="w-24 shrink-0">
                    <input
                      type="text"
                      placeholder="#HEX"
                      value={color.hex}
                      onChange={(e) => handleUpdateColor(index, 'hex', e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 bg-[#141414] border border-[#2E2E2E] rounded-lg text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-[#E4007E]"
                    />
                  </div>

                  {/* Nome da Cor */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Nome (Ex: Primária, Secundária)"
                      value={color.name}
                      onChange={(e) => handleUpdateColor(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 bg-[#141414] border border-[#2E2E2E] rounded-lg text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#E4007E]"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remover cor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Links de Materiais Oficiais */}
          <div className="space-y-3 pt-3 border-t border-[#262626]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              <span>Links de Materiais Oficiais</span>
            </h3>

            <div className="space-y-3">
              {/* Link Manual da Marca */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Link do Manual da Marca (Brand Guidelines)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... ou link do Notion/Figma/PDF"
                  value={formData.brandManualUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, brandManualUrl: e.target.value }))}
                  className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Link Pack de Logos */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Link do Pack de Logos (Vetores, SVG, PNG, AI)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... ou pasta de logos"
                  value={formData.logosPackUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logosPackUrl: e.target.value }))}
                  className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Link Tipografia / Fontes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tipografia / Fontes da Marca (Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Poppins / Montserrat ou link de download"
                  value={formData.typographyUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, typographyUrl: e.target.value }))}
                  className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-[#262626] mt-6">
            {editingProject ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Deseja realmente excluir o cliente ${editingProject.name}?`)) {
                    deleteProject(editingProject.id);
                    handleClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Cliente</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-[#222222] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
              >
                {editingProject ? 'Salvar Alterações' : 'Adicionar Cliente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

