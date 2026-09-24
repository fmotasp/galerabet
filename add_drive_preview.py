import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Add necessary imports
if 'fetchDriveItemsFromLink' not in content:
    content = content.replace(
        "import { Access } from '../../types';",
        "import { Access } from '../../types';\nimport { fetchDriveItemsFromLink, DriveFileItem } from '../../lib/googleDrive';\nimport { ChevronDown, ChevronUp, FileText, Image as ImageIcon, Folder, File } from 'lucide-react';"
    )

old_row_start = """const AccessRow: React.FC<{ access: Access; onEdit: (a: Access) => void; onDelete: (id: string) => void }> = ({ access, onEdit, onDelete }) => {
  const { addToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);"""

new_row_start = """const AccessRow: React.FC<{ access: Access; onEdit: (a: Access) => void; onDelete: (id: string) => void }> = ({ access, onEdit, onDelete }) => {
  const { addToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [hasFetchedDrive, setHasFetchedDrive] = useState(false);

  const isDriveLink = access.siteUrl && access.siteUrl.includes('drive.google.com');

  const toggleExpand = async () => {
    if (!isExpanded && isDriveLink && !hasFetchedDrive) {
      setIsLoadingDrive(true);
      try {
        const result = await fetchDriveItemsFromLink(access.siteUrl!);
        setDriveFiles(result.files || []);
        setHasFetchedDrive(true);
      } catch (err) {
        addToast('Erro', 'Não foi possível carregar os arquivos do Drive.', 'error');
      } finally {
        setIsLoadingDrive(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const renderDriveIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-4 h-4 text-slate-400" fill="currentColor" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileText className="w-4 h-4 text-emerald-600" />;
    return <File className="w-4 h-4 text-blue-500" />;
  };"""

content = content.replace(old_row_start, new_row_start)

# Modify the first column (Plataforma) to include a toggle button if it's a Drive link
old_title_td = """      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-slate-800">{access.title}</span>"""

new_title_td = """      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {isDriveLink && (
            <button onClick={toggleExpand} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors" title="Ver arquivos">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-slate-800">{access.title}</span>"""

content = content.replace(old_title_td, new_title_td)


# Now wrap the tr in a React.Fragment and append the expanded row
old_return = """  return (
    <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">"""

new_return = """  return (
    <React.Fragment>
      <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">"""
content = content.replace(old_return, new_return)

old_end_tr = """      </td>
    </tr>
  );
};"""

new_end_tr = """      </td>
    </tr>
    {isExpanded && (
      <tr className="bg-slate-50/80 border-b border-slate-100 last:border-0 shadow-inner">
        <td colSpan={6} className="px-8 py-4">
          {isLoadingDrive ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-slate-500">Carregando arquivos do Drive...</span>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">Nenhum arquivo encontrado nesta pasta ou permissão negada.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            </div>
          )}
        </td>
      </tr>
    )}
    </React.Fragment>
  );
};"""

content = content.replace(old_end_tr, new_end_tr)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Drive preview logic added successfully")
