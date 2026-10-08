import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

const regex = /{selectedLabels\.length > 0 \? \(\s*selectedLabels\.map\(\(lbl\) => {[\s\S]*?}\)\s*\) : null}/;

const replacement = `{selectedLabels.length > 0 ? (
            selectedLabels.map((lbl) => {
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
            })
          ) : null}`;

content = content.replace(regex, replacement);

const addBtnRegex = /<button[\s\S]*?onClick={\(\) => {[\s\S]*?setIsLabelsPopoverOpen\(!isLabelsPopoverOpen\);[\s\S]*?setIsMembersPopoverOpen\(false\);[\s\S]*?}}[\s\S]*?className="px-3 py-1\.5 rounded-xl border border-dashed border-\[#444\] text-slate-400 hover:text-white hover:border-\[#E4007E\] transition-all shadow-sm flex items-center gap-1\.5 text-xs font-semibold active:scale-95"[\s\S]*?title="Adicionar Cliente"[\s\S]*?>[\s\S]*?<Plus className="w-3\.5 h-3\.5" \/>[\s\S]*?<span className="hidden sm:inline">Adicionar<\/span>[\s\S]*?<\/button>/;

const addBtnReplacement = `<button
              type="button"
              onClick={() => {
                setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                setIsMembersPopoverOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-[#1A1A1A] hover:bg-[#222] border border-[#333] hover:border-[#E4007E] border-dashed text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
              title="Adicionar Cliente"
            >
              <Plus className="w-4 h-4" />
            </button>`;

content = content.replace(addBtnRegex, addBtnReplacement);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);
