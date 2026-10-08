import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# 1. Revert the login/password colSpan logic back to normal columns
old_login_senha_logic = """      {(!access.login && !access.password) ? (
        <td className="px-4 py-3" colSpan={2}>
          <div className="flex items-center gap-2 text-blue-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M17 6l-11.4 20h22.8L39.8 6z" />
              <path fill="#1976D2" d="M11.3 35.8l-5.7-10 11.4-20 5.7 10z" />
              <path fill="#4CAF50" d="M36.7 35.8H13.9l5.7-10h22.8z" />
            </svg>
            Acessar com o Drive
          </div>
        </td>
      ) : (
        <>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 font-mono break-all">{access.login || '-'}</span>
              {access.login && (
                <button onClick={() => handleCopy(access.login, 'Login')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Login">
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 font-mono min-w-[80px]">
                {!access.password ? '-' : showPassword ? access.password : '••••••••'}
              </span>
              {access.password && (
                <>
                  <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors" title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleCopy(access.password || '', 'Senha')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Senha">
                    <Copy className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </td>
        </>
      )}"""

new_login_senha_logic = """      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono break-all">{access.login || '-'}</span>
          {access.login && (
            <button onClick={() => handleCopy(access.login, 'Login')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Login">
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono min-w-[80px]">
            {!access.password ? '-' : showPassword ? access.password : '••••••••'}
          </span>
          {access.password && (
            <>
              <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors" title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => handleCopy(access.password || '', 'Senha')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Senha">
                <Copy className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>"""

content = content.replace(old_login_senha_logic, new_login_senha_logic)


# 2. Modify Actions column to include Drive button
old_actions = """      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {hasUrl && (
            <button onClick={handleVisitSite} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors" title="Acessar site">
              <LinkIcon className="w-3.5 h-3.5" /> Acessar
            </button>
          )}
          <button onClick={() => onEdit(access)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Excluir este acesso?')) onDelete(access.id); }} className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>"""

new_actions = """      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {(!access.login && !access.password) && (
            <button onClick={handleVisitSite} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-100 transition-colors" title="Acessar via Drive">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M17 6l-11.4 20h22.8L39.8 6z" />
                <path fill="#1976D2" d="M11.3 35.8l-5.7-10 11.4-20 5.7 10z" />
                <path fill="#4CAF50" d="M36.7 35.8H13.9l5.7-10h22.8z" />
              </svg>
              Drive
            </button>
          )}
          {(hasUrl && (access.login || access.password)) && (
            <button onClick={handleVisitSite} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors" title="Acessar site">
              <LinkIcon className="w-3.5 h-3.5" /> Acessar
            </button>
          )}
          <button onClick={() => onEdit(access)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Excluir este acesso?')) onDelete(access.id); }} className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>"""

content = content.replace(old_actions, new_actions)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
