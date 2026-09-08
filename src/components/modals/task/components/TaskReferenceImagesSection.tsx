import React, { useRef } from 'react';
import { Image as ImageIcon, Loader2, Trash2, Folder, ExternalLink } from 'lucide-react';
import { TaskReferenceImage } from '../types';

export const TaskReferenceImagesSection: React.FC<{
  referenceImages: TaskReferenceImage[];
  isUploadingReference: boolean;
  uploadingReferenceName: string;
  deletingFileIds: string[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  onFileUpload: (file: File) => Promise<void>;
  onDeleteReference: (refId: string) => Promise<void>;
  onPreview: (ref: { name: string; url: string }) => void;
}> = ({
  referenceImages,
  isUploadingReference,
  uploadingReferenceName,
  deletingFileIds,
  driveFolderId,
  driveFolderUrl,
  onFileUpload,
  onDeleteReference,
  onPreview,
}) => {
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4 bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[#E4007E]" />
          <span>Imagem de Referência (Briefing)</span>
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          {referenceImages.length} {referenceImages.length === 1 ? 'referência' : 'referências'}
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={referenceFileInputRef}
        accept="image/*"
        disabled={isUploadingReference}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          await onFileUpload(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Upload Trigger Area */}
      <div
        onClick={() => {
          if (!isUploadingReference) {
            referenceFileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all group ${
          isUploadingReference
            ? 'border-[#E4007E] bg-[#E4007E]/10 cursor-not-allowed'
            : 'border-[#2E2E2E] hover:border-[#E4007E] bg-[#101010]/60 hover:bg-[#022B54] cursor-pointer'
        }`}
      >
        {isUploadingReference ? (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-300 py-1">
            <Loader2 className="w-7 h-7 text-[#E4007E] animate-spin" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">
                Carregando arquivo de referência...
              </span>
              <span className="text-[11px] text-[#E4007E] font-medium truncate max-w-[280px] block">
                {uploadingReferenceName || 'Enviando imagem...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <ImageIcon className="w-6 h-6 text-[#E4007E] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-[#E4007E]">
              Clique para anexar uma imagem de referência
            </span>
            <span className="text-[11px] text-slate-400">
              PNG, JPG, WEBP, GIF (use esta área para referências visuais e a aba Anexos para artes prontas)
            </span>
          </div>
        )}
      </div>

      {/* Reference Images List + Loading placeholder if uploading */}
      {(referenceImages.length > 0 || isUploadingReference) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Card de carregamento em tempo real */}
          {isUploadingReference && (
            <div className="relative bg-[#101010] border-2 border-dashed border-[#E4007E] rounded-xl p-2.5 flex items-center gap-3 shadow-sm overflow-hidden animate-pulse">
              <div className="w-14 h-14 shrink-0 rounded-lg bg-[#E4007E]/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#E4007E] animate-spin" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <span className="text-xs font-bold text-white truncate block">
                  {uploadingReferenceName || 'Carregando arquivo...'}
                </span>
                <span className="text-[10px] text-[#E4007E] font-medium flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4007E] animate-ping" />
                  Processando e salvando imagem...
                </span>
              </div>
            </div>
          )}

          {referenceImages.map((refImg) => {
            const displayImgSrc =
              refImg.url ||
              (refImg.driveFileId
                ? `https://drive.google.com/thumbnail?id=${refImg.driveFileId}&sz=w1000`
                : '');

            return (
              <div
                key={refImg.id}
                onClick={() => onPreview({ name: refImg.name, url: displayImgSrc })}
                className="relative group bg-[#101010] border border-[#2E2E2E] rounded-xl p-2.5 flex items-center gap-3 shadow-2xs overflow-hidden hover:border-[#E4007E] hover:shadow-md transition-all cursor-pointer"
              >
                <div
                  className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[#2E2E2E] bg-[#1C1C1C] block group-hover:scale-105 transition-transform"
                >
                  <img
                    src={displayImgSrc}
                    alt={refImg.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (refImg.driveFileId && !e.currentTarget.src.includes('drive.google.com/thumbnail')) {
                        e.currentTarget.src = `https://drive.google.com/thumbnail?id=${refImg.driveFileId}&sz=w1000`;
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <span
                    className="text-xs font-bold text-slate-200 truncate block group-hover:text-[#E4007E] transition-colors"
                    title={refImg.name}
                  >
                    {refImg.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {refImg.date || 'Referência'} • Clique para ampliar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (deletingFileIds.includes(refImg.id)) return;
                    await onDeleteReference(refImg.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors z-10 disabled:opacity-50"
                  disabled={deletingFileIds.includes(refImg.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Google Drive Direct Folder Link */}
      {(driveFolderUrl || driveFolderId) && (
        <div className="pt-2">
          <a
            href={driveFolderUrl || `https://drive.google.com/drive/folders/${driveFolderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3 rounded-xl bg-[#181818] border border-[#2E2E2E] hover:border-[#E4007E]/60 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#E4007E] group-hover:scale-110 transition-transform" />
              <span>Abrir Pasta da Demanda no Google Drive</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </a>
        </div>
      )}
    </div>
  );
};
