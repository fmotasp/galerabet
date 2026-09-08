import React, { useRef } from 'react';
import {
  Paperclip,
  Folder,
  ExternalLink,
  Archive,
  ImageIcon,
  FileText,
  Trash2,
  MoreHorizontal,
  Edit2,
  MessageSquare,
  Download,
  Loader2,
} from 'lucide-react';
import { Task, TrelloAttachment } from '../../../../types';

export const TaskDriveAttachmentsTab: React.FC<{
  editingTask: Task;
  attachments: TrelloAttachment[];
  loadingAttachments: boolean;
  selectedAttachmentFiles: File[];
  setSelectedAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isPostingAttachment: boolean;
  uploadTotalCount: number;
  uploadProgressCount: number;
  openingDriveFolder: boolean;
  deletingFileIds: string[];
  openAttachmentMenuId: string | null;
  setOpenAttachmentMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  handleOpenDeliveredFolder: () => Promise<void>;
  handleUploadSelectedFileAttachment: (e?: React.FormEvent) => Promise<void>;
  handleDeleteAttachment: (attachmentId: string) => Promise<void>;
  handleRenameAttachment: (attId: string, currentName: string) => Promise<void>;
  handleDownloadSingleFile: (att: TrelloAttachment) => Promise<void>;
  handleToggleCoverImage: (imgUrl: string) => Promise<void>;
  setActiveDrawerTab: (tab: 'details' | 'attachments' | 'history') => void;
  setNewCommentText: React.Dispatch<React.SetStateAction<string>>;
  onPreview: (preview: { name: string; url: string }) => void;
  addToast: (title: string, message?: string, type?: any) => void;
}> = ({
  editingTask,
  attachments,
  loadingAttachments,
  selectedAttachmentFiles,
  setSelectedAttachmentFiles,
  isPostingAttachment,
  uploadTotalCount,
  uploadProgressCount,
  openingDriveFolder,
  deletingFileIds,
  openAttachmentMenuId,
  setOpenAttachmentMenuId,
  handleOpenDeliveredFolder,
  handleUploadSelectedFileAttachment,
  handleDeleteAttachment,
  handleRenameAttachment,
  handleDownloadSingleFile,
  handleToggleCoverImage,
  setActiveDrawerTab,
  setNewCommentText,
  onPreview,
  addToast,
}) => {
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#101010]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#E4007E]" />
            <span>{editingTask.id.startsWith('trello-') ? 'Anexos do Trello' : 'Arquivos Entregues'} ({attachments.length})</span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            {editingTask.id.startsWith('trello-')
              ? 'Arquivos, imagens e documentos anexados diretamente ao cartão do Trello.'
              : 'Envie e gerencie os arquivos finais e entregas da demanda.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {loadingAttachments && (
            <span className="text-xs text-[#E4007E] animate-pulse font-medium mr-2">
              Buscando anexos...
            </span>
          )}

          <button
            type="button"
            disabled={openingDriveFolder}
            onClick={handleOpenDeliveredFolder}
            className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#2E2E2E] text-white border border-[#2E2E2E] hover:border-[#E4007E] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Abrir pasta de Arquivos Entregues desta demanda no Google Drive"
          >
            {openingDriveFolder ? (
              <Loader2 className="w-4 h-4 text-[#E4007E] animate-spin" />
            ) : (
              <Folder className="w-4 h-4 text-[#E4007E]" />
            )}
            <span>Pasta no Drive</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Add Attachment Form: Real File Upload Only */}
      <div className="p-4 bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-[#E4007E]" />
          <span>{editingTask.id.startsWith('trello-') ? 'Anexar Arquivo do Computador ao Trello' : 'Anexar Arquivo Final da Demanda'}</span>
        </h4>

        {/* File Upload Box */}
        <div
          onClick={() => attachmentFileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2E2E2E] hover:border-[#E4007E] bg-[#101010]/60 p-4 rounded-xl text-center cursor-pointer transition-colors group"
        >
          <input
            type="file"
            ref={attachmentFileInputRef}
            multiple
            accept="*/*,.zip,.rar,.7z,.psd,.psb,.ai,.pdf,image/*,video/*"
            onChange={(e) => setSelectedAttachmentFiles(Array.from(e.target.files || []))}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-1.5 text-white">
            <Paperclip className="w-6 h-6 text-[#E4007E] group-hover:scale-110 transition-transform" />
            {selectedAttachmentFiles.length > 0 ? (
              <div className="text-xs font-bold text-[#E4007E] space-y-1">
                <div>📁 {selectedAttachmentFiles.length} arquivo(s) selecionado(s):</div>
                <ul className="text-[10px] text-white list-disc list-inside text-left max-w-xs mx-auto">
                  {selectedAttachmentFiles.slice(0, 5).map((f) => (
                    <li key={f.name} className="truncate">{f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)</li>
                  ))}
                  {selectedAttachmentFiles.length > 5 && <li>e mais {selectedAttachmentFiles.length - 5} arquivos...</li>}
                </ul>
              </div>
            ) : (
              <>
                <span className="text-xs font-bold text-[#E4007E]">Clique para selecionar arquivos (ZIP, Imagens, PSD, Vídeos, PDF, Docs, etc.)</span>
                <span className="text-[11px] text-slate-300">
                  {editingTask.id.startsWith('trello-')
                    ? 'Envio de arquivo direto para o Trello'
                    : 'Arquivos .PSD e .ZIP são suportados e sincronizados com a pasta da demanda no Google Drive'}
                </span>
              </>
            )}
          </div>
        </div>

        {selectedAttachmentFiles.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              disabled={isPostingAttachment}
              onClick={handleUploadSelectedFileAttachment}
              className="relative overflow-hidden w-full py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white disabled:opacity-80 rounded-xl text-xs font-black transition-all shadow-md shadow-[#E4007E]/25 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              {isPostingAttachment && uploadTotalCount > 0 && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#e5a400]/40 transition-all duration-300 pointer-events-none"
                  style={{ width: `${(uploadProgressCount / uploadTotalCount) * 100}%` }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 shrink-0 text-white" />
                <span className="text-white">
                  {isPostingAttachment && uploadTotalCount > 0
                    ? `Enviando (${uploadProgressCount}/${uploadTotalCount}) ${Math.round((uploadProgressCount / uploadTotalCount) * 100)}%...`
                    : `Enviar ${selectedAttachmentFiles.length} Arquivo(s) Final(is)`}
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Attachments List / Grid */}
      {attachments.length === 0 && !loadingAttachments ? (
        <div className="p-8 bg-[#1C1C1C]/40 border border-dashed border-[#2E2E2E] rounded-2xl text-center space-y-2">
          <Paperclip className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-bold text-white">
            {editingTask.id.startsWith('trello-') ? 'Nenhum anexo encontrado' : 'Nenhum arquivo entregue'}
          </p>
          <p className="text-[11px] text-slate-400">
            {editingTask.id.startsWith('trello-')
              ? 'Os arquivos anexados a este cartão no Trello aparecerão listados aqui.'
              : 'Os designers podem subir as imagens, artes finais e arquivos PSD aqui para outros usuários baixarem.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attachments.map((att) => {
            const extractDriveId = (item: TrelloAttachment): string | null => {
              if (item.driveFileId) return item.driveFileId;
              if (!item.url) return null;
              const matchId = item.url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
              if (matchId) return matchId[1];
              const matchFileD = item.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
              if (matchFileD) return matchFileD[1];
              const matchD = item.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
              if (matchD) return matchD[1];
              return null;
            };

            const driveFileId = extractDriveId(att);

            const isPsd =
              Boolean(att.name?.toLowerCase().includes('.psd')) ||
              Boolean(att.name?.toLowerCase().includes('.psb')) ||
              Boolean(att.name?.toLowerCase().includes('psd')) ||
              Boolean(att.name?.match(/\.(psd|psb)$/i)) ||
              Boolean(att.url?.toLowerCase().includes('.psd')) ||
              Boolean(att.url?.toLowerCase().includes('.psb')) ||
              att.mimeType === 'image/vnd.adobe.photoshop' ||
              att.mimeType === 'application/x-photoshop' ||
              att.mimeType === 'application/photoshop' ||
              att.mimeType === 'image/x-photoshop' ||
              Boolean(att.mimeType?.toLowerCase().includes('photoshop')) ||
              Boolean(att.mimeType?.toLowerCase().includes('psd'));

            const isZip =
              Boolean(att.name?.toLowerCase().endsWith('.zip')) ||
              Boolean(att.name?.toLowerCase().endsWith('.rar')) ||
              Boolean(att.name?.toLowerCase().endsWith('.7z')) ||
              Boolean(att.url?.toLowerCase().includes('.zip')) ||
              Boolean(att.mimeType?.toLowerCase().includes('zip')) ||
              Boolean(att.mimeType?.toLowerCase().includes('compressed'));

            const isImage =
              !isPsd &&
              !isZip &&
              (att.mimeType?.startsWith('image/') ||
                Boolean(att.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) ||
                Boolean(att.url?.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) ||
                (att.previews && att.previews.length > 0) ||
                Boolean(att.thumbnailUrl) ||
                Boolean(att.url?.startsWith('data:image')));

            const previewUrl =
              att.thumbnailUrl ||
              (att.url?.startsWith('data:image') ? att.url : null) ||
              (driveFileId ? `https://lh3.googleusercontent.com/d/${driveFileId}` : null) ||
              (driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000` : null) ||
              (att.previews && att.previews.length > 0 ? att.previews[att.previews.length - 1].url : null) ||
              att.url;

            const viewUrl = driveFileId
              ? `https://drive.google.com/file/d/${driveFileId}/view`
              : att.url;

            return (
              <div
                key={att.id}
                className="bg-[#1C1C1C] rounded-2xl p-2.5 flex flex-col justify-between gap-2.5 relative border border-[#2E2E2E] hover:border-[#E4007E]/40 transition-colors shadow-sm"
              >
                {/* Top Header inside card */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`p-1 rounded-lg text-white shrink-0 flex items-center justify-center font-black ${
                        isPsd
                          ? 'bg-[#181818] text-[#38BDF8] text-[11px] border border-[#2E2E2E] w-6 h-6 shadow-xs'
                          : isZip
                            ? 'bg-[#2A2000] text-[#FBBF24] border border-[#78350F] w-6 h-6 shadow-xs'
                            : isImage
                              ? 'bg-[#2E2E2E] text-[#E4007E]'
                              : 'bg-[#E4007E] text-white'
                      }`}
                    >
                      {isPsd ? <span>Ps</span> : isZip ? <Archive className="w-3.5 h-3.5" /> : isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[10px] font-bold text-white truncate" title={att.name}>
                      {att.name}
                    </span>
                  </div>
                </div>

                {/* Image Thumbnail / PSD Card / ZIP Card / File Representation */}
                <div className="flex-1">
                  {isPsd ? (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center bg-gradient-to-b from-[#181818] to-[#101010] rounded-xl aspect-square w-full border border-[#2E2E2E] hover:border-[#E4007E]/60 p-3 text-center transition-all group/psd cursor-pointer shadow-inner"
                      title="Clique para abrir o arquivo PSD no Google Drive"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#141414] border-2 border-[#38BDF8]/60 flex items-center justify-center shadow-xl mb-2 group-hover/psd:scale-110 transition-transform">
                        <span className="text-[#38BDF8] font-black text-2xl tracking-tighter select-none">Ps</span>
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-full block select-none px-1" title={att.name}>
                        {att.name}
                      </span>
                      <span className="text-[9px] text-slate-300 font-black mt-1 uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded-md border border-[#2E2E2E] shadow-xs">
                        {att.bytes ? `${(att.bytes / (1024 * 1024)).toFixed(1)} MB` : 'ARQUIVO PSD'}
                      </span>
                    </a>
                  ) : isZip ? (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center bg-gradient-to-b from-[#1c1810] to-[#12100a] rounded-xl aspect-square w-full border border-[#78350F]/50 hover:border-[#FBBF24]/80 p-3 text-center transition-all group/zip cursor-pointer shadow-inner"
                      title="Clique para abrir/baixar o arquivo ZIP"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#1e170a] border-2 border-[#FBBF24]/60 flex items-center justify-center shadow-xl mb-2 group-hover/zip:scale-110 transition-transform">
                        <Archive className="w-7 h-7 text-[#FBBF24]" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-200 truncate max-w-full block select-none px-1" title={att.name}>
                        {att.name}
                      </span>
                      <span className="text-[9px] text-amber-400 font-black mt-1 uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded-md border border-[#78350F] shadow-xs">
                        {att.bytes ? `${(att.bytes / (1024 * 1024)).toFixed(1)} MB` : 'PACOTE ZIP'}
                      </span>
                    </a>
                  ) : isImage ? (
                    <div
                      onClick={() => onPreview({ name: att.name, url: previewUrl })}
                      className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#101010] border border-[#2E2E2E] cursor-pointer group hover:opacity-95 transition-opacity"
                      title="Clique para expandir e visualizar"
                    >
                      <img
                        src={previewUrl}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (driveFileId) {
                            if (!target.src.includes('lh3.googleusercontent.com')) {
                              target.src = `https://lh3.googleusercontent.com/d/${driveFileId}`;
                            } else if (!target.src.includes('drive.google.com/thumbnail')) {
                              target.src = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
                            } else if (!target.src.includes('export=view')) {
                              target.src = `https://drive.google.com/uc?export=view&id=${driveFileId}`;
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-[#101010] rounded-xl aspect-square w-full border border-[#2E2E2E]">
                      <FileText className="w-8 h-8 text-slate-400" />
                      <span className="text-[9px] text-slate-400 mt-1 font-bold">
                        {att.bytes ? `${Math.round(att.bytes / 1024)} KB` : 'ARQUIVO'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Row of Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#2E2E2E] relative">
                  {/* 1. Drive Button */}
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                    title="Abrir no Google Drive"
                  >
                    <ExternalLink className="w-4 h-4 stroke-[2.5] text-white" />
                  </a>

                  {/* 2. Red Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att.id)}
                    disabled={deletingFileIds.includes(att.id)}
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
                    title={deletingFileIds.includes(att.id) ? 'Excluindo...' : 'Excluir Arquivo'}
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  {/* 3. Three dots options menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenAttachmentMenuId(openAttachmentMenuId === att.id ? null : att.id);
                      }}
                      className={`p-2 rounded-xl transition-all border cursor-pointer active:scale-95 ${
                        openAttachmentMenuId === att.id
                          ? 'bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white border-[#E4007E] shadow-md shadow-[#E4007E]/30'
                          : 'bg-[#141414] hover:bg-[#262626] text-slate-300 hover:text-white border-[#2E2E2E]'
                      }`}
                      title="Mais opções do arquivo"
                    >
                      <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Dropdown Menu Popup */}
                    {openAttachmentMenuId === att.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAttachmentMenuId(null);
                          }}
                        />
                        <div
                          className="absolute bottom-10 right-0 z-50 min-w-[170px] bg-[#181818] border border-[#2A2A2A] shadow-2xl rounded-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenAttachmentMenuId(null);
                              handleRenameAttachment(att.id, att.name);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenAttachmentMenuId(null);
                              setActiveDrawerTab('details');
                              setNewCommentText((prev) => (prev ? `${prev}\n\nArquivo: ${att.name}` : `Sobre o arquivo "${att.name}": `));
                              addToast('Comentário', `Mencionando "${att.name}" na aba de detalhes.`, 'info');
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                            <span>Comentário</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenAttachmentMenuId(null);
                              handleDownloadSingleFile(att);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-300" />
                            <span>Baixar</span>
                          </button>

                          {isImage && (() => {
                            const isCover = Boolean(
                              editingTask?.coverImageUrl &&
                              (editingTask.coverImageUrl === previewUrl ||
                                editingTask.coverImageUrl === att.url ||
                                (driveFileId && editingTask.coverImageUrl.includes(driveFileId)))
                            );
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenAttachmentMenuId(null);
                                  handleToggleCoverImage(previewUrl);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                                <span>{isCover ? 'Remover capa' : 'Definir capa'}</span>
                              </button>
                            );
                          })()}

                          <div className="my-1 border-t border-[#262626]" />

                          <button
                            type="button"
                            onClick={() => {
                              setOpenAttachmentMenuId(null);
                              handleDeleteAttachment(att.id);
                            }}
                            disabled={deletingFileIds.includes(att.id)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
