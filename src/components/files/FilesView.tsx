import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileImage, Download, Search, HardDrive, Calendar } from 'lucide-react';

export const FilesView: React.FC = () => {
  const { tasks } = useApp();
  const [search, setSearch] = useState('');

  // Collect all valid delivered files
  const deliveredFiles = useMemo(() => {
    const files: Array<{
      taskId: string;
      taskTitle: string;
      projectName: string;
      assigneeName: string;
      attachmentId: string;
      name: string;
      url: string;
      date: string;
    }> = [];

    tasks.forEach(task => {
      if (task.attachments && task.attachments.length > 0) {
        task.attachments.forEach(att => {
          // Filter out PSD and PSB files
          const lowerName = att.name.toLowerCase();
          if (lowerName.endsWith('.psd') || lowerName.endsWith('.psb')) {
            return;
          }

          files.push({
            taskId: task.id,
            taskTitle: task.title,
            projectName: task.projectName || 'Geral',
            assigneeName: task.assigneeName || 'Não atribuído',
            attachmentId: att.id,
            name: att.name,
            url: att.url,
            date: att.date || task.createdAt || new Date().toISOString(),
          });
        });
      }
    });

    // Sort by most recent
    files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return files;
  }, [tasks]);

  // Filter by search
  const filteredFiles = useMemo(() => {
    if (!search.trim()) return deliveredFiles;
    const q = search.toLowerCase();
    return deliveredFiles.filter(f => 
      f.name.toLowerCase().includes(q) ||
      f.taskTitle.toLowerCase().includes(q) ||
      f.projectName.toLowerCase().includes(q)
    );
  }, [deliveredFiles, search]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-6 sm:p-8 pb-4 border-b border-[#262626]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider font-condensed">
              ARQUIVOS ENTREGUES
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1">
              Todos os arquivos finais das tarefas (exceto arquivos originais PSD/PSB).
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
          <input
            type="text"
            placeholder="Buscar por arquivo, tarefa ou projeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1C1C1C] border border-[#303030] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#E4007E]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#808080]">
            <HardDrive className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-bold">Nenhum arquivo encontrado.</p>
            <p className="text-xs mt-1">As tarefas não possuem entregas finais ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div 
                key={file.attachmentId}
                className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#E4007E]/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-[#1C1C1C] text-[#E4007E] rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                    <FileImage className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-[#A0A0A0] mt-1 truncate">
                      De: {file.taskTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-[#1C1C1C] border border-[#303030] text-[#A0A0A0] px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {file.projectName}
                      </span>
                      <span className="text-[10px] bg-[#1C1C1C] border border-[#303030] text-[#A0A0A0] px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {file.assigneeName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-auto border-t border-[#262626] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#808080] font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(file.date).toLocaleDateString('pt-BR')}
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-80 transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5 text-[#E4007E]" />
                    Baixar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
