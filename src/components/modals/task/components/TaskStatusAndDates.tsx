import React from 'react';
import { SpineStatusConfig, TaskStatus } from '../../../../types';
import { TaskModalFormData } from '../types';

export const TaskStatusAndDates: React.FC<{
  formData: TaskModalFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskModalFormData>>;
  spineStatuses: SpineStatusConfig[];
  onStatusChange?: () => void;
}> = ({ formData, setFormData, spineStatuses, onStatusChange }) => {

  const currentUrgencyState = formData.isFlagged ? 'urgencia' : (formData.isPriority ? 'prioridade' : 'normal');

  const handleUrgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'urgencia') {
      setFormData(prev => ({ ...prev, isFlagged: true, isPriority: false }));
    } else if (val === 'prioridade') {
      setFormData(prev => ({ ...prev, isFlagged: false, isPriority: true }));
    } else {
      setFormData(prev => ({ ...prev, isFlagged: false, isPriority: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
      {/* Status da tarefa */}
      <div>
        <label className="block text-xs font-medium text-slate-200 mb-1.5">
          Status da Tarefa
        </label>
        <select
          value={formData.status}
          onChange={(e) => {
            onStatusChange?.();
            const newStatus = e.target.value as TaskStatus;
            const statusLabel = spineStatuses.find((s) => s.id === newStatus)?.label || newStatus;
            const isReview =
              newStatus === 'in_review' ||
              newStatus.toLowerCase().includes('revis') ||
              statusLabel.toLowerCase().includes('revis');

            const isDone =
              newStatus === 'done' ||
              newStatus === 'postar' ||
              newStatus.toLowerCase().includes('concl') ||
              newStatus.toLowerCase().includes('post') ||
              statusLabel.toLowerCase().includes('concl') ||
              statusLabel.toLowerCase().includes('post') ||
              statusLabel.toLowerCase().includes('entreg');

            setFormData((prev) => ({
              ...prev,
              status: newStatus,
              deliveredAt: isReview ? '' : (isDone && !prev.deliveredAt ? new Date().toLocaleDateString('pt-BR') : prev.deliveredAt),
            }));
          }}
          className="w-full h-[46px] px-3 bg-[#1C1C1C] border border-white/5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs focus:outline-none focus:border-[#E4007E] cursor-pointer"
        >
          {spineStatuses.map((st) => (
            <option key={st.id} value={st.id} className="bg-[#181818] text-white font-bold py-2">
              {st.label}
            </option>
          ))}
        </select>
      </div>

      {/* Prazo Previsto */}
      <div>
        <label className="block text-xs font-medium text-slate-200 mb-1.5">
          Prazo Previsto <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            value={(() => {
              if (!formData.dueDate || formData.dueDate === 'Sem prazo') return '';
              let [dateStr, timeStr] = formData.dueDate.split(' ');
              
              // Handle if it is already in ISO format (has T)
              if (!timeStr && dateStr.includes('T')) {
                const splitT = dateStr.split('T');
                dateStr = splitT[0];
                timeStr = splitT[1];
              }
              
              if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  const ymd = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  return timeStr ? `${ymd}T${timeStr}` : `${ymd}T00:00`;
                }
              } else if (dateStr && dateStr.includes('-')) {
                return timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T00:00`;
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
                    newDueDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                    if (timePart) {
                      newDueDate += ` ${timePart}`;
                    }
                  } else {
                    newDueDate = val;
                  }
                }
              }
              setFormData((prev) => ({ ...prev, dueDate: newDueDate }));
            }}
            className="w-full h-[46px] px-3 bg-[#1C1C1C] border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer"
          />
        </div>
      </div>

      {/* Urgência / Prioridade */}
      <div>
        <label className="block text-xs font-medium text-slate-200 mb-1.5">
          Urgência / Prioridade
        </label>
        <select
          value={currentUrgencyState}
          onChange={handleUrgencyChange}
          className={`w-full h-[46px] border rounded-xl px-4 text-sm font-semibold focus:outline-none transition-colors appearance-none ${
            currentUrgencyState === 'urgencia'
              ? 'bg-rose-600/20 border-rose-600 text-rose-500 focus:border-rose-500'
              : currentUrgencyState === 'prioridade'
              ? 'bg-orange-600/20 border-orange-600 text-orange-500 focus:border-orange-500'
              : 'bg-[#1C1C1C] border-[#2E2E2E] text-slate-400 focus:border-[#E4007E]'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${currentUrgencyState === 'urgencia' ? '%23f43f5e' : currentUrgencyState === 'prioridade' ? '%23f97316' : '%2394a3b8'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '16px'
          }}
        >
          <option value="normal" className="bg-[#141414] text-white">Normal</option>
          <option value="prioridade" className="bg-[#141414] text-orange-500">🔥 Prioridade</option>
          <option value="urgencia" className="bg-[#141414] text-rose-500">🚨 Urgência</option>
        </select>
      </div>
    </div>
  );
};
