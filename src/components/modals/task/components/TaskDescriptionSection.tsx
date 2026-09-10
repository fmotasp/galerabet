import React from 'react';
import { Edit2 } from 'lucide-react';
import { TaskRichTextEditor, markdownToHtml } from './TaskRichTextEditor';

export const TaskDescriptionSection: React.FC<{
  description: string;
  onChange: (markdown: string) => void;
  isEditingDescription: boolean;
  setIsEditingDescription: (editing: boolean) => void;
}> = ({
  description,
  onChange,
  isEditingDescription,
  setIsEditingDescription,
}) => {
  const renderFormattedDescription = (text: string = '') => {
    if (!text.trim()) {
      return <span className="text-slate-400 italic text-xs">Sem descrição informada.</span>;
    }

    const htmlContent = markdownToHtml(text);

    return (
      <div
        className="leading-relaxed text-xs text-slate-100 font-medium space-y-1.5 prose-sm max-w-none break-words break-all whitespace-pre-wrap [overflow-wrap:anywhere] [&_b]:font-black [&_strong]:font-black [&_strong]:text-white [&_b]:text-white [&_h1]:text-base [&_h1]:font-black [&_h1]:text-white [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:text-white [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_a]:text-sky-400 [&_a]:hover:text-sky-300 [&_a]:underline [&_a]:cursor-pointer [&_a]:font-semibold"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>Descrição</span>
        </label>
      </div>

      {isEditingDescription ? (
        <div className="space-y-2 flex-1 flex flex-col">
          <TaskRichTextEditor
            value={description}
            onChange={onChange}
            placeholder="Escreva a descrição da tarefa..."
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsEditingDescription(false)}
              className="px-4 py-1.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('a')) {
              return;
            }
            setIsEditingDescription(true);
          }}
          className="p-4 bg-[#1C1C1C] text-slate-100 border border-[#2E2E2E] rounded-2xl cursor-pointer hover:border-[#E4007E] transition-colors group relative min-h-[140px] flex-1 overflow-hidden break-words [overflow-wrap:anywhere]"
          title="Clique para editar"
        >
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2E2E2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-[#2E2E2E] flex items-center gap-1">
            <Edit2 className="w-2.5 h-2.5" />
            <span>Editar</span>
          </div>
          {renderFormattedDescription(description)}
        </div>
      )}
    </div>
  );
};
