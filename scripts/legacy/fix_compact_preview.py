import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# 1. Update renderDriveIcon to make folders red and filled
old_icon_logic = """  const renderDriveIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-4 h-4 text-slate-400" fill="currentColor" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileText className="w-4 h-4 text-emerald-600" />;
    return <File className="w-4 h-4 text-blue-500" />;
  };"""

new_icon_logic = """  const renderDriveIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-4 h-4 text-[#E4007E]" fill="currentColor" />; // using pink/red from brand
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileText className="w-4 h-4 text-emerald-600" />;
    return <File className="w-4 h-4 text-blue-500" />;
  };"""

content = content.replace(old_icon_logic, new_icon_logic)


# 2. Update the Grid layout to be compact
old_grid = """            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {driveFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all group/file">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 p-2 bg-slate-50 rounded-lg">
                      {renderDriveIcon(file.mimeType)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[13px] font-semibold text-slate-800 truncate" title={file.name}>{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                        {file.mimeType === 'application/vnd.google-apps.folder' ? 'Pasta' : 'Arquivo'}
                      </span>
                    </div>
                  </div>
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors" title="Acessar no Drive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 1443.061 1249.993">
                      <path fill="#3777e3" d="M240.525 1249.993l240.492-416.664h962.044l-240.514 416.664z"/>
                      <path fill="#ffcf63" d="M962.055 833.329h481.006L962.055 0H481.017z"/>
                      <path fill="#11a861" d="M0 833.329l240.525 416.664 481.006-833.329L481.017 0z"/>
                    </svg>
                    ACESSAR
                  </a>
                </div>
              ))}
            </div>"""

new_grid = """            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-1.5 bg-[#141414] rounded-xl p-4 border border-[#222]">
              {driveFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#222] transition-colors group/file">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="shrink-0 flex items-center justify-center">
                      {renderDriveIcon(file.mimeType)}
                    </div>
                    <span className="text-[13px] font-medium text-slate-200 truncate group-hover/file:text-white transition-colors" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 flex items-center opacity-0 group-hover/file:opacity-100 transition-opacity" title="Acessar no Drive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-white">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                      <path d="M12 12v9"></path>
                      <path d="m8 17 4 4 4-4"></path>
                    </svg>
                  </a>
                </div>
              ))}
            </div>"""

content = content.replace(old_grid, new_grid)

# Adjust expanded row container to match dark theme inside the light table (or just minimal styling)
old_expanded_tr = '<tr className="bg-slate-50/80 border-b border-slate-100 last:border-0 shadow-inner">'
new_expanded_tr = '<tr className="bg-slate-100/50 border-b border-slate-200 last:border-0 shadow-inner">'
content = content.replace(old_expanded_tr, new_expanded_tr)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Compact preview logic applied successfully")
