import React from 'react';
import { Image as ImageIcon, ExternalLink, X } from 'lucide-react';

export const TaskLightboxModal: React.FC<{
  previewingReference: { name: string; url: string } | null;
  onClose: () => void;
}> = ({ previewingReference, onClose }) => {
  if (!previewingReference) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
    >
      {/* Top Bar with Name & Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl flex items-center justify-between text-white pb-4 mb-2 border-b border-white/10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black truncate">{previewingReference.name}</h3>
            <p className="text-[11px] text-slate-400">Imagem de Referência • Visualização em Alta Resolução</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={previewingReference.url}
            target="_blank"
            rel="noreferrer"
            download={previewingReference.name}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Original</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors"
            title="Fechar Visualizador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Centered Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[80vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40"
      >
        <img
          src={previewingReference.url}
          alt={previewingReference.name}
          className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
        />
      </div>
    </div>
  );
};
