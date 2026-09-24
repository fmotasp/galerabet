import re

# 1. Update AccessModal.tsx
with open('src/components/modals/AccessModal.tsx', 'r') as f:
    modal_content = f.read()

# Remove required from Login
modal_content = modal_content.replace("""className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all"
                required
              />
            </div>

            {/* Password */}""", """className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all"
              />
            </div>

            {/* Password */}""")

# Remove required from Password
modal_content = modal_content.replace("""className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all font-mono"
                required
              />
            </div>
          </form>""", """className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all font-mono"
              />
            </div>
          </form>""")

with open('src/components/modals/AccessModal.tsx', 'w') as f:
    f.write(modal_content)


# 2. Update AccessesView.tsx
with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    view_content = f.read()

old_login_senha = """      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono break-all">{access.login}</span>
          <button onClick={() => handleCopy(access.login, 'Login')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Login">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono min-w-[80px]">
            {showPassword ? access.password : '••••••••'}
          </span>
          <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors" title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={() => handleCopy(access.password || '', 'Senha')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Senha">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </td>"""

new_login_senha = """      {(!access.login && !access.password) ? (
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

view_content = view_content.replace(old_login_senha, new_login_senha)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(view_content)

print("Updated successfully")
