import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

const startStr = "{/* Clientes */}";
const endStr = "{/* Clientes Popover Dropdown */}";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `{/* Clientes */}
      <div className={\`relative \${isLabelsPopoverOpen ? 'z-50' : 'z-20'}\`}>
        <label className="block text-xs font-medium text-slate-200 mb-2">
          Clientes <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedLabels.length > 0 && selectedLabels.map((lbl) => {
            const clientObj = projects.find(
              (p) => p.name.toLowerCase().trim() === lbl.toLowerCase().trim()
            );
            return (
              <div
                key={lbl}
                onClick={() => handleToggleLabel(lbl)}
                className="relative flex group cursor-pointer shrink-0 active:scale-95 transition-transform"
                title={\`\${lbl} (Clique para remover)\`}
              >
                <div className="w-9 h-9 rounded-full bg-[#141414] border-2 border-[#E4007E]/60 group-hover:border-rose-500 transition-all flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {clientObj?.logoUrl ? (
                    <img
                      src={clientObj.logoUrl}
                      alt={lbl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-bold text-xs">
                      {lbl.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X className="w-2.5 h-2.5" />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
              setIsMembersPopoverOpen(false);
            }}
            className="w-9 h-9 rounded-full bg-[#1A1A1A] hover:bg-[#222] border border-[#333] hover:border-[#E4007E] border-dashed text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
            title="Adicionar Cliente"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        `;
        
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);
}

