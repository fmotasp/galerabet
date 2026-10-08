import fs from 'fs';

let content = `import React, { useState, useRef, useEffect } from 'react';
import { SpineStatusConfig, TaskStatus } from '../../../../types';
import { TaskModalFormData } from '../types';
import { ChevronDown, Check } from 'lucide-react';

export const TaskStatusAndDates: React.FC<{
  formData: TaskModalFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskModalFormData>>;
  spineStatuses: SpineStatusConfig[];
  onStatusChange?: () => void;
}> = ({ formData, setFormData, spineStatuses, onStatusChange }) => {

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isUrgencyOpen, setIsUrgencyOpen] = useState(false);
  
  const statusRef = useRef<HTMLDivElement>(null);
  const urgencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
      if (urgencyRef.current && !urgencyRef.current.contains(e.target as Node)) {
        setIsUrgencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentUrgencyState = formData.isFlagged ? 'urgencia' : (formData.isPriority ? 'prioridade' : 'normal');

  const handleUrgencyChange = (val: string) => {
    if (val === 'urgencia') {
      setFormData(prev => ({ ...prev, isFlagged: true, isPriority: false }));
    } else if (val === 'prioridade') {
      setFormData(prev => ({ ...prev, isFlagged: false, isPriority: true }));
    } else {
      setFormData(prev => ({ ...prev, isFlagged: false, isPriority: false }));
    }
  };

  const currentStatusLabel = spineStatuses.find(s => s.id === formData.status)?.label || formData.status;

  return (
    <div className="grid grid-cols-1 gap-4 items-start">
      {/* Status da tarefa */}
      <div ref={statusRef} className="relative">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Status
        </label>
        <button
          type="button"
          onClick={() => setIsStatusOpen(!isStatusOpen)}
          className={\`w-full h-[46px] px-3 bg-[#101010] border border-white/5 rounded-xl text-sm font-semibold text-white transition-all shadow-xs flex items-center justify-between \${isStatusOpen ? 'ring-2 ring-[#E4007E]/30 border-[#E4007E]/50' : 'hover:border-white/10'}\`}
        >
          <span className="truncate">{currentStatusLabel}</span>
          <ChevronDown className={\`w-4 h-4 text-slate-400 transition-transform duration-200 \${isStatusOpen ? 'rotate-180 text-[#E4007E]' : ''}\`} />
        </button>

        {isStatusOpen && (
          <div className="absolute top-full mt-1.5 left-0 w-full z-50 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
              {spineStatuses.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onStatusChange?.();
                    const newStatus = st.id as TaskStatus;
                    const isReview =
                      newStatus === 'in_review' ||
                      newStatus.toLowerCase().includes('revis') ||
                      st.label.toLowerCase().includes('revis');

                    const isDone =
                      newStatus === 'done' ||
                      newStatus === 'postar' ||
                      newStatus.toLowerCase().includes('concl') ||
                      newStatus.toLowerCase().includes('post') ||
                      st.label.toLowerCase().includes('concl') ||
                      st.label.toLowerCase().includes('post') ||
                      st.label.toLowerCase().includes('entreg');

                    setFormData((prev) => ({
                      ...prev,
                      status: newStatus,
                      deliveredAt: isReview ? '' : (isDone && !prev.deliveredAt ? new Date().toLocaleDateString('pt-BR') : prev.deliveredAt),
                    }));
                    setIsStatusOpen(false);
                  }}
                  className={\`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors \${formData.status === st.id ? 'bg-[#2A2A2A] text-white' : 'text-slate-300 hover:bg-[#222] hover:text-white'}\`}
                >
                  <span className="text-sm font-semibold truncate pr-2">{st.label}</span>
                  {formData.status === st.id && <Check className="w-4 h-4 text-[#E4007E] stroke-[3] shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prazo Previsto */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Prazo Previsto <span className="text-[#E4007E]">*</span>
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            value={(() => {
              if (!formData.dueDate || formData.dueDate === 'Sem prazo') return '';
              let [dateStr, timeStr] = formData.dueDate.split(' ');
              
              if (!timeStr && dateStr.includes('T')) {
                const splitT = dateStr.split('T');
                dateStr = splitT[0];
                timeStr = splitT[1];
              }
              
              if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  const ymd = \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
                  return timeStr ? \`\${ymd}T\${timeStr}\` : \`\${ymd}T00:00\`;
                }
              } else if (dateStr && dateStr.includes('-')) {
                return timeStr ? \`\${dateStr}T\${timeStr}\` : \`\${dateStr}T00:00\`;
              }
              return formData.dueDate;
            })()}
            onChange={(e) => {
              const val = e.target.value;
              let newDueDate = 'Sem prazo';
              if (val) {
                const [datePart, timePart] = val.split('T');
                if (datePart) {
                  const parts = datePart.split('-');
                  if (parts.length === 3) {
                    newDueDate = \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
                    if (timePart) {
                      newDueDate += \` \${timePart}\`;
                    }
                  } else {
                    newDueDate = val;
                  }
                }
              }
              setFormData((prev) => ({ ...prev, dueDate: newDueDate }));
            }}
            className="w-full h-[46px] px-3 bg-[#101010] border border-white/5 rounded-xl text-sm font-semibold text-white tabular-nums focus:outline-none focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30 cursor-pointer transition-all hover:border-white/10"
          />
        </div>
      </div>

      {/* Urgência / Prioridade */}
      <div ref={urgencyRef} className="relative">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Urgência / Prioridade
        </label>
        
        <button
          type="button"
          onClick={() => setIsUrgencyOpen(!isUrgencyOpen)}
          className={\`w-full h-[46px] border rounded-xl px-3 text-sm font-semibold focus:outline-none transition-all flex items-center justify-between \${
            currentUrgencyState === 'urgencia'
              ? 'bg-rose-600/20 border-rose-600/50 text-rose-500'
              : currentUrgencyState === 'prioridade'
              ? 'bg-orange-600/20 border-orange-600/50 text-orange-500'
              : 'bg-[#101010] border-white/5 text-slate-300 hover:border-white/10'
          } \${isUrgencyOpen ? 'ring-2 ring-white/10' : ''}\`}
        >
          <span>
            {currentUrgencyState === 'urgencia' ? '🚨 Urgência' : currentUrgencyState === 'prioridade' ? '🔥 Prioridade' : 'Normal'}
          </span>
          <ChevronDown className={\`w-4 h-4 transition-transform duration-200 \${isUrgencyOpen ? 'rotate-180' : ''} \${currentUrgencyState === 'urgencia' ? 'text-rose-500' : currentUrgencyState === 'prioridade' ? 'text-orange-500' : 'text-slate-500'}\`} />
        </button>

        {isUrgencyOpen && (
          <div className="absolute top-full mt-1.5 left-0 w-full z-50 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => { handleUrgencyChange('normal'); setIsUrgencyOpen(false); }}
              className={\`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors \${currentUrgencyState === 'normal' ? 'bg-[#2A2A2A] text-white' : 'text-slate-300 hover:bg-[#222] hover:text-white'}\`}
            >
              <span className="text-sm font-semibold">Normal</span>
              {currentUrgencyState === 'normal' && <Check className="w-4 h-4 text-slate-400 stroke-[3]" />}
            </button>
            <button
              type="button"
              onClick={() => { handleUrgencyChange('prioridade'); setIsUrgencyOpen(false); }}
              className={\`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors \${currentUrgencyState === 'prioridade' ? 'bg-[#2A2A2A] text-orange-400' : 'text-orange-500/80 hover:bg-[#222] hover:text-orange-400'}\`}
            >
              <span className="text-sm font-semibold">🔥 Prioridade</span>
              {currentUrgencyState === 'prioridade' && <Check className="w-4 h-4 text-orange-500 stroke-[3]" />}
            </button>
            <button
              type="button"
              onClick={() => { handleUrgencyChange('urgencia'); setIsUrgencyOpen(false); }}
              className={\`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors \${currentUrgencyState === 'urgencia' ? 'bg-[#2A2A2A] text-rose-400' : 'text-rose-500/80 hover:bg-[#222] hover:text-rose-400'}\`}
            >
              <span className="text-sm font-semibold">🚨 Urgência</span>
              {currentUrgencyState === 'urgencia' && <Check className="w-4 h-4 text-rose-500 stroke-[3]" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
`
fs.writeFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', content);

