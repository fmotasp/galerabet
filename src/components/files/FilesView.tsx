import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FileImage, Download, Search, HardDrive } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const FilesView: React.FC = () => {
  const { registeredClients } = useApp();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deliveredFiles, setDeliveredFiles] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [expandedFile, setExpandedFile] = useState<any>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, project_name, assignee_name, created_at, attachments, cover_image_url, last_moved_at, updated_at')
          .in('status', ['in_review', 'ready_to_post', 'done']);

        if (error) throw error;

        const files: Array<{
          taskId: string;
          taskTitle: string;
          projectName: string;
          assigneeName: string;
          attachmentId: string;
          name: string;
          url: string;
          date: string;
          thumbnailUrl?: string;
          driveFileId: string | null;
          previewUrl: string | null;
          isImage: boolean;
        }> = [];

        if (data) {
          data.forEach((row: any) => {
            const taskTimestamp = row.last_moved_at 
              ? new Date(row.last_moved_at).toISOString() 
              : (row.updated_at || row.created_at || new Date().toISOString());

            let taskAttachments: any[] = [];
            if (row.attachments) {
              try {
                taskAttachments = typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments;
              } catch (e) {
                console.warn('Failed to parse attachments', row.attachments);
              }
            }

            let foundImages = 0;

            if (Array.isArray(taskAttachments)) {
              taskAttachments.forEach(att => {
                if (!att || !att.name) return;
                
                const lowerName = att.name.toLowerCase();
                if (lowerName.endsWith('.psd') || lowerName.endsWith('.psb')) return;

                let driveFileId: string | null = att.driveFileId || null;
                if (!driveFileId && att.url) {
                  const matchId = att.url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                  if (matchId) driveFileId = matchId[1];
                  else {
                    const matchFileD = att.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                    if (matchFileD) driveFileId = matchFileD[1];
                    else {
                      const matchD = att.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                      if (matchD) driveFileId = matchD[1];
                    }
                  }
                }

                const isImage = Boolean(
                  lowerName.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i) ||
                  (att.previews && att.previews.length > 0) ||
                  Boolean(att.thumbnailUrl) ||
                  Boolean(att.url?.startsWith('data:image')) ||
                  (att.mimeType && att.mimeType.startsWith('image/'))
                );
                
                if (isImage) foundImages++;

                const previewUrl =
                  att.thumbnailUrl ||
                  (att.url?.startsWith('data:image') ? att.url : null) ||
                  (driveFileId ? `https://lh3.googleusercontent.com/d/${driveFileId}` : null) ||
                  (driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000` : null) ||
                  (att.previews && att.previews.length > 0 ? att.previews[att.previews.length - 1].url : null) ||
                  att.url;

                files.push({
                  taskId: row.id,
                  taskTitle: row.title || 'Sem título',
                  projectName: row.project_name || 'Geral',
                  assigneeName: row.assignee_name || 'Não atribuído',
                  attachmentId: att.id || Math.random().toString(),
                  name: att.name,
                  url: att.url,
                  date: att.date || taskTimestamp,
                  thumbnailUrl: att.thumbnailUrl,
                  driveFileId,
                  previewUrl,
                  isImage
                });
              });
            }

            // Fallback: se não achou anexo de imagem, mas a tarefa tem uma cover_image_url salva
            if (foundImages === 0 && row.cover_image_url && !row.cover_image_url.toLowerCase().endsWith('.psd')) {
                files.push({
                  taskId: row.id,
                  taskTitle: row.title || 'Sem título',
                  projectName: row.project_name || 'Geral',
                  assigneeName: row.assignee_name || 'Não atribuído',
                  attachmentId: Math.random().toString(),
                  name: 'Capa da Tarefa',
                  url: row.cover_image_url,
                  date: taskTimestamp,
                  thumbnailUrl: row.cover_image_url,
                  driveFileId: null,
                  previewUrl: row.cover_image_url,
                  isImage: true
                });
            }
          });
        }

        // Ordenar da mais recente para a mais antiga (baseado no envio ou última movimentação)
        files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDeliveredFiles(files);
      } catch (err) {
        console.error('Error fetching files:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // Preload images silently in the background
  useEffect(() => {
    if (deliveredFiles.length > 0) {
      deliveredFiles.forEach(file => {
        if (file.isImage && file.previewUrl) {
          const img = new Image();
          img.src = file.previewUrl;
        }
      });
    }
  }, [deliveredFiles]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>();
    deliveredFiles.forEach(f => {
      if (f.projectName) projects.add(f.projectName);
    });
    return Array.from(projects).sort();
  }, [deliveredFiles]);

  // Filter by search and project
  const filteredFiles = useMemo(() => {
    let filtered = deliveredFiles;
    
    if (selectedProject !== 'all') {
      filtered = filtered.filter(f => f.projectName === selectedProject);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.taskTitle.toLowerCase().includes(q) ||
        f.projectName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [deliveredFiles, search, selectedProject]);

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
              Prévias das imagens finais (estilo mosaico).
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col xl:flex-row gap-4 xl:items-center">
          <div className="relative max-w-md w-full xl:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
            <input
              type="text"
              placeholder="Buscar por arquivo, tarefa ou projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-[#303030] text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#E4007E]"
            />
          </div>

          <div className="flex flex-nowrap items-center bg-[#222222] p-1 rounded-xl gap-1 border border-[#303030] overflow-x-auto min-w-0 [scrollbar-hide::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedProject('all')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedProject === 'all'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#303030]'
              }`}
            >
              Todos
            </button>
            {uniqueProjects.map(proj => {
              const clientData = registeredClients?.find(c => c.name === proj || c.id === proj);
              return (
                <button
                  key={proj}
                  onClick={() => setSelectedProject(proj)}
                  className={`flex items-center shrink-0 gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedProject === proj
                      ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#303030]'
                  }`}
                >
                  {clientData?.icon ? (
                    <img
                      src={clientData.icon}
                      alt={proj}
                      className="w-4 h-4 rounded-md object-contain shrink-0 drop-shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {proj}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List - Masonry Layout */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#E4007E]">
            <div className="w-8 h-8 border-4 border-[#E4007E] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-white">Carregando arquivos...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#808080]">
            <HardDrive className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-bold">Nenhum arquivo encontrado.</p>
            <p className="text-xs mt-1">Nenhum resultado para os filtros atuais.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {filteredFiles.map((file, idx) => (
              <div 
                key={`${file.taskId}-${file.attachmentId}-${idx}`}
                className="bg-[#141414] rounded-2xl overflow-hidden flex flex-col group break-inside-avoid relative hover:shadow-[0_0_15px_rgba(228,0,126,0.5)] transition-shadow duration-300 border border-[#262626] hover:border-[#E4007E]/50"
              >
                {/* Imagem Cover se existir */}
                {file.isImage ? (
                  <div className="relative w-full overflow-hidden bg-[#1C1C1C]">
                    <img 
                      src={file.previewUrl || '/placeholder-image.png'} 
                      alt={file.name || 'Arquivo'} 
                      className="w-full h-auto object-cover transition-transform duration-300 min-h-[100px]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (file.driveFileId) {
                          if (!target.src.includes('lh3.googleusercontent.com')) {
                            target.src = `https://lh3.googleusercontent.com/d/${file.driveFileId}`;
                          } else if (!target.src.includes('drive.google.com/thumbnail')) {
                            target.src = `https://drive.google.com/thumbnail?id=${file.driveFileId}&sz=w1000`;
                          } else if (!target.src.includes('export=view')) {
                            target.src = `https://drive.google.com/uc?export=view&id=${file.driveFileId}`;
                          }
                        } else {
                           target.src = '/placeholder-image.png';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-[#1C1C1C] flex flex-col gap-2 items-center justify-center min-h-[150px]">
                    <FileImage className="w-12 h-12 text-[#E4007E]" />
                    <span className="text-xs text-center text-[#808080] font-bold px-2 truncate max-w-full">{file.name}</span>
                  </div>
                )}
                
                {/* Hover overlay para download rápido e mostrar título */}
                <div 
                  className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer p-4 text-center"
                  onClick={() => setExpandedFile(file)}
                >
                  <span className="text-white font-bold text-sm line-clamp-3 drop-shadow-md">
                    {file.taskTitle}
                  </span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 bg-[#E4007E] text-white px-5 py-2.5 rounded-full hover:scale-105 transition-transform shadow-[0_0_15px_rgba(228,0,126,0.5)] z-10 font-black uppercase text-xs"
                  >
                    <Download className="w-4 h-4 text-white" color="white" />
                    <span style={{ color: '#ffffff' }}>BAIXAR IMAGEM</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded File Modal */}
      {expandedFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setExpandedFile(null)}
        >
          <div className="relative max-w-full max-h-full flex flex-col items-center">
            <button 
              className="absolute -top-10 right-0 sm:-right-10 text-white hover:text-[#E4007E] bg-black/50 rounded-full p-2"
              onClick={() => setExpandedFile(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {expandedFile.isImage ? (
              <img 
                src={expandedFile.previewUrl || expandedFile.url} 
                alt={expandedFile.name} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (expandedFile.driveFileId && !target.src.includes('lh3.googleusercontent.com')) {
                    target.src = `https://lh3.googleusercontent.com/d/${expandedFile.driveFileId}`;
                  } else if (expandedFile.driveFileId && !target.src.includes('drive.google.com/thumbnail')) {
                    target.src = `https://drive.google.com/thumbnail?id=${expandedFile.driveFileId}&sz=w1000`;
                  } else if (expandedFile.driveFileId && !target.src.includes('export=view')) {
                    target.src = `https://drive.google.com/uc?export=view&id=${expandedFile.driveFileId}`;
                  } else {
                    target.src = '/placeholder-image.png';
                  }
                }}
              />
            ) : (
              <div 
                className="bg-[#1C1C1C] p-12 rounded-xl flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <FileImage className="w-24 h-24 text-[#E4007E]" />
                <span className="text-white font-bold">{expandedFile.name}</span>
              </div>
            )}
            <div 
              className="mt-4 text-white text-center bg-black/50 px-6 py-4 rounded-xl backdrop-blur-sm max-w-[90vw] sm:max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-bold text-lg leading-tight mb-2">{expandedFile.taskTitle}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span className="bg-[#262626] px-2 py-1 rounded-md">{expandedFile.projectName}</span>
                <span>•</span>
                <span>{expandedFile.assigneeName}</span>
              </div>
              <div className="mt-6 flex justify-center w-full">
                <a 
                  href={expandedFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-base bg-[#E4007E] hover:bg-[#E94E18] text-white px-8 py-3.5 rounded-xl transition-all font-black uppercase tracking-wider shadow-lg shadow-[#E4007E]/25 hover:scale-105"
                >
                  <Download className="w-5 h-5 text-white" color="white" /> 
                  <span style={{ color: '#ffffff' }}>BAIXAR ARQUIVO ORIGINAL</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
