import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

old_grid_item = """            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {driveFiles.map(file => (
                <a key={file.id} href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group/file">
                  <div className="shrink-0 p-2 bg-slate-50 rounded-md group-hover/file:bg-blue-50 transition-colors">
                    {renderDriveIcon(file.mimeType)}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-slate-700 truncate group-hover/file:text-blue-600 transition-colors" title={file.name}>{file.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{file.mimeType.split('.').pop()?.replace('vnd.google-apps.', '') || 'arquivo'}</span>
                  </div>
                </a>
              ))}
            </div>"""

new_grid_item = """            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

content = content.replace(old_grid_item, new_grid_item)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated grid item successfully")
