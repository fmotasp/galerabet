import React from 'react';
import { SpineStatusConfig, TaskStatus } from '../../../../types';
import { TaskModalFormData } from '../types';

export const TaskStatusAndDates: React.FC<{
  formData: TaskModalFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskModalFormData>>;
  spineStatuses: SpineStatusConfig[];
}> = ({ formData, setFormData, spineStatuses }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      {/* Status da tarefa */}
      <div>
        <label className="block text-xs font-bold text-slate-200 mb-1.5">
          Status da Tarefa
        </label>
        <select
          value={formData.status}
          onChange={(e) => {
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
            type="date"
            value={
              formData.dueDate && formData.dueDate !== 'Sem prazo' && formData.dueDate.includes('/')
                ? formData.dueDate.split('/').reverse().join('-')
                : formData.dueDate === 'Sem prazo'
                  ? ''
                  : formData.dueDate || ''
            }
            onChange={(e) => {
              const val = e.target.value;
              let newDueDate = 'Sem prazo';
              if (val) {
                const parts = val.split('-');
                if (parts.length === 3) {
                  newDueDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                } else {
                  newDueDate = val;
                }
              }
              setFormData((prev) => ({ ...prev, dueDate: newDueDate }));
            }}
            className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
