import React from 'react';
import { SpineStatusConfig, TaskStatus } from '../../../../types';
import { TaskModalFormData } from '../types';

export const TaskStatusAndDates: React.FC<{
  formData: TaskModalFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskModalFormData>>;
  spineStatuses: SpineStatusConfig[];
  onStatusChange?: () => void;
}> = ({ formData, setFormData, spineStatuses, onStatusChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
      {/* Status da tarefa */}
      <div>
        <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
          className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-black text-white transition-all shadow-xs focus:outline-none focus:border-[#E4007E] cursor-pointer"
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
        <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
            className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer"
          />
        </div>
      </div>

      {/* URGENTE */}
      <div>
        <label className="block text-xs font-bold text-slate-200 mb-1.5">
          Urgência
        </label>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, isFlagged: !prev.isFlagged }))}
          className={`w-full flex items-center justify-between p-3 border rounded-xl text-xs font-black transition-all ${
            formData.isFlagged
              ? 'bg-rose-600/20 border-rose-600 text-rose-500'
              : 'bg-[#1C1C1C] border-[#2E2E2E] text-slate-400 hover:border-rose-500/50'
          }`}
        >
          <span>MARCAR COMO URGENTE</span>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            formData.isFlagged ? 'border-rose-500 bg-rose-500' : 'border-slate-500'
          }`}>
            {formData.isFlagged && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        </button>
      </div>
    </div>
  );
};
