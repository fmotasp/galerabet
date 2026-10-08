import fs from 'fs';

// 1. Fix TaskModalHeader.tsx
let headerFile = 'src/components/modals/task/components/TaskModalHeader.tsx';
let headerContent = fs.readFileSync(headerFile, 'utf8');

const shareButtonOld = `{copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400 hidden sm:inline">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#E4007E] stroke-[2.5]" />
                    <span className="hidden sm:inline">Compartilhar</span>
                  </>
                )}`;

const shareButtonNew = `{copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                ) : (
                  <Share2 className="w-4 h-4 text-[#E4007E] stroke-[2.5]" />
                )}`;

headerContent = headerContent.replace(shareButtonOld, shareButtonNew);
fs.writeFileSync(headerFile, headerContent);


// 2. Fix TaskActivityTimelineTab.tsx
let timelineFile = 'src/components/modals/task/components/TaskActivityTimelineTab.tsx';
let timelineContent = fs.readFileSync(timelineFile, 'utf8');

const summaryCardsOld = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="px-3 py-2 bg-[#181818] border-transparent rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-[#E4007E]/20 text-[#E4007E] rounded-lg border border-[#E4007E]/30 shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Total</span>
            <span className="text-sm font-semibold text-white">{timelineActions.length}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border-transparent rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-[#E4007E]/20 text-[#E4007E] rounded-lg border border-[#E4007E]/30 shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Status</span>
            <span className="text-sm font-semibold text-white">{statusCount}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border-transparent rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Comentários</span>
            <span className="text-sm font-semibold text-white">{commentCount}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border-transparent rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Criada</span>
            <span className="text-[10px] font-semibold text-white truncate block">
              {editingTask.createdAt ? formatRelativeDate(editingTask.createdAt) : 'Recentemente'}
            </span>
          </div>
        </div>
      </div>`;

const summaryCardsNew = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="px-4 py-3 bg-[#181818] rounded-xl flex flex-col justify-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total</span>
          <span className="text-xl font-bold text-white leading-none">{timelineActions.length}</span>
        </div>

        <div className="px-4 py-3 bg-[#181818] rounded-xl flex flex-col justify-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</span>
          <span className="text-xl font-bold text-white leading-none">{statusCount}</span>
        </div>

        <div className="px-4 py-3 bg-[#181818] rounded-xl flex flex-col justify-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Comentários</span>
          <span className="text-xl font-bold text-white leading-none">{commentCount}</span>
        </div>

        <div className="px-4 py-3 bg-[#181818] rounded-xl flex flex-col justify-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Criada</span>
          <span className="text-sm font-bold text-white truncate block leading-none pt-1">
            {editingTask.createdAt ? formatRelativeDate(editingTask.createdAt) : 'Recentemente'}
          </span>
        </div>
      </div>`;

timelineContent = timelineContent.replace(summaryCardsOld, summaryCardsNew);

// Also remove unused icons imports if possible, but TypeScript / bundler will ignore them anyway so it's fine.
fs.writeFileSync(timelineFile, timelineContent);

