import React from 'react';
import {
  X,
  Check,
  CheckCircle2,
  Share2,
  FileText,
  Paperclip,
  History,
} from 'lucide-react';
import { Task, SpineStatusConfig } from '../../../../types';
import { getTaskOverdueDays } from '../../../../lib/taskDateUtils';
import { TaskModalFormData, TaskReferenceImage, TimelineActionItem } from '../types';

export const TaskModalHeader: React.FC<{
  editingTask: Task | null;
  formData: TaskModalFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskModalFormData>>;
  spineStatuses: SpineStatusConfig[];
  attachments: any[];
  referenceImages: TaskReferenceImage[];
  timelineActions: TimelineActionItem[];
  activeDrawerTab: 'details' | 'attachments' | 'history';
  setActiveDrawerTab: (tab: 'details' | 'attachments' | 'history') => void;
  copiedLink: boolean;
  handleShareTask: () => void;
  handleClose: () => void;
}> = ({
  editingTask,
  formData,
  setFormData,
  spineStatuses,
  attachments,
  referenceImages,
  timelineActions,
  activeDrawerTab,
  setActiveDrawerTab,
  copiedLink,
  handleShareTask,
  handleClose,
}) => {
  // Find cover image or first delivered image or first reference image
  const firstImageAttachment = attachments.find((att) => {
    const driveMatch = att.url?.match(/[?&]id=([^&]+)/);
    return (
      att.mimeType?.startsWith('image/') ||
      att.name?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ||
      att.url?.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i) ||
      (att.previews && att.previews.length > 0) ||
      Boolean(driveMatch)
    );
  });

  let headerCoverImage = editingTask?.coverImageUrl || '';
  if (!headerCoverImage && firstImageAttachment) {
    const driveMatch = firstImageAttachment.url?.match(/[?&]id=([^&]+)/);
    if (driveMatch && driveMatch[1]) {
      headerCoverImage = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
    } else {
      headerCoverImage = firstImageAttachment.previews?.[0]?.url || firstImageAttachment.url;
    }
  }
  if (!headerCoverImage && referenceImages && referenceImages.length > 0) {
    const firstRef = referenceImages[0];
    if (firstRef.driveFileId) {
      headerCoverImage = `https://drive.google.com/thumbnail?id=${firstRef.driveFileId}&sz=w1200`;
    } else {
      headerCoverImage = firstRef.url;
    }
  }

  return (
    <div className="relative shrink-0 px-6 pt-5 pb-0 border-b border-slate-800 bg-[#181818] overflow-hidden">
      {/* Cover Image Background Banner with Gradient */}
      {headerCoverImage && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={headerCoverImage}
            alt="Capa da Demanda"
            className="w-full h-full object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#181818] via-[#181818]/85 to-[#181818]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/70 via-transparent to-transparent" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 pb-3">
          <div className="flex-1 min-w-0">
            {editingTask ? (
              <input
                id="input-task-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setFormData((prev) => ({ ...prev, title: newTitle }));
                }}
                className="w-full !bg-transparent !border-0 !border-none !outline-none !ring-0 !shadow-none focus:!ring-0 focus:!outline-none focus:!bg-transparent hover:!bg-transparent p-0 text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs cursor-pointer focus:cursor-text placeholder:text-white/60"
                style={{ backgroundColor: 'transparent', background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none' }}
                placeholder="Título da Demanda"
                title="Clique para editar o título"
              />
            ) : (
              <h2 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
                Criar Nova Tarefa
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Lado direito na mesma linha do título: Data de Entrega não-editável */}
            {(() => {
              const statusLabel = spineStatuses.find((s) => s.id === formData.status)?.label || formData.status;
              const isReview =
                formData.status === 'in_review' ||
                formData.status.toLowerCase().includes('revis') ||
                statusLabel.toLowerCase().includes('revis');

              if (isReview) return null;

              const isDelivered =
                formData.status === 'done' ||
                formData.status === 'postar' ||
                formData.status.toLowerCase().includes('concl') ||
                formData.status.toLowerCase().includes('post') ||
                statusLabel.toLowerCase().includes('concl') ||
                statusLabel.toLowerCase().includes('post') ||
                statusLabel.toLowerCase().includes('entreg') ||
                Boolean(formData.deliveredAt);

              if (!isDelivered) return null;

              const displayDate = formData.deliveredAt || new Date().toLocaleDateString('pt-BR');

              return (
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black tracking-wide shadow-xs animate-in fade-in duration-200 select-none">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Data de Entrega: {displayDate}</span>
                </div>
              );
            })()}

            {/* Badge de Atraso em Destaque Piscando (animate-pulse) */}
            {(() => {
              const overdueDays = getTaskOverdueDays({
                dueDate: formData.dueDate,
                status: formData.status,
                deliveredAt: formData.deliveredAt,
              });
              if (overdueDays > 0) {
                return (
                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 text-rose-300 border border-rose-500/80 rounded-xl text-xs font-black tracking-wide shadow-lg shadow-rose-950/60 animate-pulse select-none">
                    <span className="text-sm">⚠️</span>
                    <span>Atrasado ({overdueDays} {overdueDays === 1 ? 'dia' : 'dias'})</span>
                  </div>
                );
              }
              return null;
            })()}

            {editingTask && (
              <button
                type="button"
                onClick={handleShareTask}
                className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'text-slate-300 hover:text-white bg-[#222222]/80 hover:bg-[#2A2A2A] border-[#2E2E2E]'
                }`}
                title="Copiar link direto para compartilhar esta tarefa"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#E4007E] stroke-[2.5]" />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#222222]/80 hover:bg-[#2A2A2A] border border-[#2E2E2E] transition-all cursor-pointer"
              title="Fechar painel lateral"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        {editingTask && (
          <div className="flex items-center gap-6 pt-2 text-xs font-bold border-t border-[#262626] -mb-[1px]">
            <button
              type="button"
              onClick={() => setActiveDrawerTab('details')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'details'
                  ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-black'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeDrawerTab === 'details' ? 'text-[#E4007E]' : ''}`} />
              <span>Detalhes & Descrição</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab('attachments')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'attachments'
                  ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-black'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Paperclip className={`w-4 h-4 ${activeDrawerTab === 'attachments' ? 'text-[#E4007E]' : ''}`} />
              <span>{editingTask.id.startsWith('trello-') ? 'Anexos do Trello' : 'Arquivos Entregues'}</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeDrawerTab === 'attachments' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-black' : 'bg-[#1C1C1C] border border-[#303030] text-white'}`}>
                {attachments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab('history')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'history'
                  ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-black'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <History className={`w-4 h-4 ${activeDrawerTab === 'history' ? 'text-[#E4007E]' : ''}`} />
              <span>Ações & Histórico</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeDrawerTab === 'history' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-black' : 'bg-[#1C1C1C] border border-[#303030] text-white'}`}>
                {timelineActions.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
