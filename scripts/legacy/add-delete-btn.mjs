import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

const regex = /<div className="mt-8 md:mt-auto pt-6 border-t border-\[#262626\]">/;

const replacement = `<div className="mt-8 md:mt-auto pt-6 border-t border-[#262626] flex gap-2">
              {editingTask && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(\`Tem certeza que deseja excluir a tarefa "\${formData.title}"?\`)) {
                      deleteTask(editingTask.id);
                      handleClose();
                    }
                  }}
                  className="w-12 sm:w-14 shrink-0 flex justify-center items-center bg-[#1C1C1C] hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 border border-[#2E2E2E] hover:border-rose-500/40 rounded-xl transition-all shadow-sm active:scale-95"
                  title="Excluir Tarefa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}`;

content = content.replace(regex, replacement);

// We need to change the button to be flex-1
content = content.replace(
  'className="w-full py-3.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18]',
  'className="flex-1 py-3.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18]'
);

fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);

