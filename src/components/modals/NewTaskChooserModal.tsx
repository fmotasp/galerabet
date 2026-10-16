import React, { useEffect } from 'react';
import { FilePlus2, Layers } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';

const OPTIONS = [
  {
    key: '1',
    id: 'single',
    title: 'Nova tarefa',
    description: 'Cria uma demanda preenchendo os campos, como sempre.',
    Icon: FilePlus2,
  },
  {
    key: '2',
    id: 'bulk',
    title: 'Tarefas em massa',
    description: 'Envia um documento (link ou arquivo .docx) e cria várias demandas de uma vez.',
    Icon: Layers,
  },
] as const;

/** Aparece ao clicar em "Nova tarefa": escolhe entre criar uma tarefa ou importar várias de um documento. */
export const NewTaskChooserModal: React.FC = () => {
  const { isNewTaskChooserOpen, setIsNewTaskChooserOpen, openClassicNewTask, openBulkTasks } = useApp();

  const choose = (id: (typeof OPTIONS)[number]['id']) => (id === 'single' ? openClassicNewTask() : openBulkTasks());

  // Atalhos 1 e 2 enquanto o seletor está aberto
  useEffect(() => {
    if (!isNewTaskChooserOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const option = OPTIONS.find((o) => o.key === e.key);
      if (option && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        choose(option.id);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isNewTaskChooserOpen]);

  return (
    <Modal
      isOpen={isNewTaskChooserOpen}
      onClose={() => setIsNewTaskChooserOpen(false)}
      title="Criar demandas"
      description="Como você quer criar?"
      size="md"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map(({ key, id, title, description, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            className="group text-left p-4 rounded-2xl bg-field border border-line hover:border-line-hover hover:bg-raised transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-brand"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <kbd className="text-xs text-fg-subtle border border-line rounded px-1.5 py-0.5">{key}</kbd>
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-fg-muted mt-1 leading-relaxed">{description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
};
