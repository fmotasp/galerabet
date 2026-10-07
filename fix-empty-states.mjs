import fs from 'fs';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

// 1. TasksTableView.tsx
replaceInFile('src/components/tasks/TasksTableView.tsx',
  /<td colSpan=\{7\} className="py-16 text-center">[\s\S]*?<\/td>/,
  `<td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                        <CheckSquare className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-200">Nenhuma demanda encontrada</h3>
                      <p className="text-sm text-slate-500 mt-2">Não há tarefas correspondentes aos filtros selecionados.</p>
                    </div>
                  </td>`
);

// 2. ProjectsView.tsx
replaceInFile('src/components/projects/ProjectsView.tsx',
  /<div className="col-span-full py-16 text-center bg-\[#181818\] rounded-3xl border border-white\/5 p-8 shadow-xl">[\s\S]*?<\/button>\s*<\/div>/,
  `<div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#181818] to-transparent rounded-3xl border border-white/5 border-dashed">
            <div className="w-16 h-16 rounded-full bg-[#1C1C1C] flex items-center justify-center mb-4 shadow-inner">
              <Box className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Nenhum projeto encontrado</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">
              Tente ajustar os filtros ou crie um novo projeto para começar.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-6 px-4 py-2 rounded-xl bg-[#E4007E]/10 text-[#E4007E] font-bold text-sm hover:bg-[#E4007E]/20 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>`
);

// 3. FilesView.tsx
replaceInFile('src/components/files/FilesView.tsx',
  /<div className="flex flex-col items-center justify-center h-64 text-\[#808080\]">[\s\S]*?<\/div>/,
  `<div className="flex flex-col items-center justify-center py-24 text-center bg-gradient-to-b from-[#181818] to-transparent rounded-3xl border border-white/5 border-dashed">
            <div className="w-16 h-16 rounded-full bg-[#1C1C1C] flex items-center justify-center mb-4 shadow-inner">
              <HardDrive className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-200">Nenhum arquivo encontrado</p>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">Nenhum resultado corresponde aos filtros atuais. Tente buscar por outro termo.</p>
          </div>`
);

// 4. AccessesView.tsx
replaceInFile('src/components/accesses/AccessesView.tsx',
  /<td colSpan=\{6\} className="py-16 text-center text-slate-400">\s*<p>Nenhum acesso encontrado\.<\/p>\s*<\/td>/,
  `<td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                        <Key className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-200">Nenhum acesso encontrado</h3>
                      <p className="text-sm text-slate-500 mt-2">Nenhum registro corresponde aos critérios atuais de busca.</p>
                    </div>
                  </td>`
);

// 5. MaterialsView.tsx
replaceInFile('src/components/materials/MaterialsView.tsx',
  /<div className="p-12 text-center bg-\[#141414\] border border-dashed border-\[#2E2E2E\] rounded-3xl space-y-3">[\s\S]*?<\/div>/,
  `<div className="py-20 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#181818] to-transparent rounded-3xl border border-white/5 border-dashed">
          <div className="w-16 h-16 rounded-full bg-[#1C1C1C] flex items-center justify-center mb-4 shadow-inner">
            <Palette className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Nenhum cliente ou material</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum resultado corresponde à sua pesquisa. Tente outro termo.'
              : 'Cadastre seus clientes na aba de Cadastros para que seus materiais e identidades visuais apareçam aqui.'}
          </p>
        </div>`
);

