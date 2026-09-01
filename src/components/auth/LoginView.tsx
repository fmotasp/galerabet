import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CircleCheck,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export const LoginView: React.FC = () => {
  const { setCurrentUser, addToast, employees, loginArtUrl, updateLoginArtUrl, updateEmployee } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoModal, setInfoModal] = useState<'signup' | 'forgot' | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(5);

  // Primeiro Acesso / Troca de Senha Obrigatória
  const [firstAccessUser, setFirstAccessUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstAccessLoading, setFirstAccessLoading] = useState(false);
  const [firstAccessError, setFirstAccessError] = useState('');

  React.useEffect(() => {
    supabase
      .from('projects')
      .select('logo_url, description')
      .eq('id', 'system-settings')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const art = data.logo_url || data.description;
          if (art && art !== loginArtUrl) {
            updateLoginArtUrl(art);
          }
        }
      });
  }, []);

  const triggerWelcomeAndLogin = (user: any) => {
    if (rememberMe) {
      localStorage.setItem('spine_logged_user', JSON.stringify(user));
    }
    setWelcomeUser(user);
    setCountdown(5);

    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#FFB903', '#0052CC', '#10B981', '#ffffff'],
      });
    } catch {
      // Ignore if confetti not supported
    }

    // Countdown 5s
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      setCurrentUser(user);
      addToast('Acesso Autorizado', `Bem-vindo(a), ${user.name}!`, 'success');
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const normInput = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Verificação de Acesso do Administrador Geral
    if (normInput === 'admin' && cleanPass === 'g4l3r4') {
      const adminUser = {
        id: 'usr-admin',
        name: 'Administrador Geral',
        email: 'admin@empresa.com',
        role: 'Admin',
        roleType: 'admin' as const,
        avatarUrl: '',
        initials: 'AD',
      };
      setLoading(false);
      triggerWelcomeAndLogin(adminUser);
      return;
    }

    if (normInput === 'admin' && cleanPass !== 'g4l3r4') {
      setErrorMsg('Senha incorreta para o Administrador.');
      setLoading(false);
      return;
    }

    // 2. Busca do Funcionário diretamente no Supabase em tempo real e fallback local
    try {
      let matchedEmp: any = null;

      // Fallback para estado em memória primeiro
      matchedEmp = employees.find((emp) => {
        const empEmail = (emp.email || '').toLowerCase().trim();
        const empName = (emp.name || '').toLowerCase().trim();
        const empUser = (emp.username || '').toLowerCase().trim();
        return (
          (empEmail && empEmail === normInput) ||
          (empName && empName === normInput) ||
          (empUser && empUser === normInput) ||
          (empName && (empName.includes(normInput) || normInput.includes(empName)))
        );
      });

      // Tenta buscar no Supabase se não encontrou ou para pegar senha atualizada
      try {
        const { data: dbEmps } = await supabase.from('employees').select('*');
        if (dbEmps && dbEmps.length > 0) {
          const foundInDb = dbEmps.find((row: any) => {
            const empEmail = (row.email || '').toLowerCase().trim();
            const empName = (row.name || '').toLowerCase().trim();
            const empUser = (row.username || '').toLowerCase().trim();
            return (
              (empEmail && empEmail === normInput) ||
              (empName && empName === normInput) ||
              (empUser && empUser === normInput) ||
              (empName && (empName.includes(normInput) || normInput.includes(empName)))
            );
          });
          if (foundInDb) {
            matchedEmp = {
              ...matchedEmp,
              ...foundInDb,
              password: foundInDb.password || matchedEmp?.password || '',
              needsPasswordChange:
                foundInDb.needs_password_change !== undefined
                  ? Boolean(foundInDb.needs_password_change)
                  : matchedEmp?.needsPasswordChange,
            };
          }
        }
      } catch (dbErr) {
        console.warn('Supabase fetch error on login:', dbErr);
      }

      if (!matchedEmp) {
        setErrorMsg('Usuário ou e-mail não encontrado no cadastro do sistema.');
        setLoading(false);
        return;
      }

      // 3. Validação de Senha
      const expectedPassword = String(matchedEmp.password || '').trim();
      const inputPass = String(password || '').trim();

      if (!expectedPassword) {
        setErrorMsg(
          'Este usuário ainda não possui senha cadastrada. Acesse como admin e cadastre a senha no perfil do funcionário.'
        );
        setLoading(false);
        return;
      }

      if (expectedPassword !== inputPass) {
        setErrorMsg('Senha incorreta.');
        setLoading(false);
        return;
      }

      // 4. Verificação de Primeiro Acesso (Redefinição de Senha Obrigatória)
      const requiresPasswordChange =
        matchedEmp.needsPasswordChange === true ||
        matchedEmp.needs_password_change === true;

      if (requiresPasswordChange) {
        setLoading(false);
        setFirstAccessUser(matchedEmp);
        setNewPassword('');
        setConfirmPassword('');
        setFirstAccessError('');
        return;
      }

      // Login de Funcionário Autorizado
      const employeeUser = {
        id: matchedEmp.id,
        name: matchedEmp.name,
        email: matchedEmp.email || '',
        role: matchedEmp.role || 'Colaborador',
        roleType: 'employee' as const,
        avatarUrl: matchedEmp.avatarUrl || matchedEmp.avatar_url || '',
        initials: matchedEmp.initials || 'CB',
      };

      setLoading(false);
      triggerWelcomeAndLogin(employeeUser);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Erro ao autenticar. Tente novamente.');
      setLoading(false);
    }
  };

  // Salvar nova senha no primeiro acesso
  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirstAccessError('');
    const cleanNew = newPassword.trim();
    const cleanConf = confirmPassword.trim();

    if (cleanNew.length < 4) {
      setFirstAccessError('A nova senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (cleanNew !== cleanConf) {
      setFirstAccessError('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    setFirstAccessLoading(true);

    try {
      // 1. Grava no Supabase
      const { error: sbErr } = await supabase
        .from('employees')
        .update({
          password: cleanNew,
          needs_password_change: false,
        })
        .eq('id', firstAccessUser.id);

      if (sbErr) {
        console.error('Supabase password change error:', sbErr);
        setFirstAccessError(`Falha ao salvar no banco de dados: ${sbErr.message}`);
        setFirstAccessLoading(false);
        return;
      }

      // 2. Atualiza estado local
      if (updateEmployee) {
        updateEmployee(firstAccessUser.id, {
          password: cleanNew,
          needsPasswordChange: false,
        });
      }

      // 3. Monta usuário logado
      const authenticatedUser = {
        id: firstAccessUser.id,
        name: firstAccessUser.name,
        email: firstAccessUser.email || '',
        role: firstAccessUser.role || 'Colaborador',
        roleType: (firstAccessUser.role?.toLowerCase().includes('gestor') || firstAccessUser.role?.toLowerCase().includes('manager')) ? 'manager' as const : 'employee' as const,
        avatarUrl: firstAccessUser.avatarUrl || firstAccessUser.avatar_url || '',
        initials: firstAccessUser.initials || 'CB',
        needsPasswordChange: false,
      };

      setFirstAccessLoading(false);
      setFirstAccessUser(null);
      triggerWelcomeAndLogin(authenticatedUser);
      addToast('Senha Definida! 🔒', 'Sua nova senha foi gravada com sucesso.', 'success');
    } catch (err: any) {
      console.error('First access password update exception:', err);
      setFirstAccessError('Ocorreu um erro ao gravar a nova senha. Tente novamente.');
      setFirstAccessLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#101010] flex flex-col md:flex-row relative overflow-hidden font-sans select-none antialiased">
      {/* LEFT COLUMN: FORM AREA */}
      <div className="w-full md:w-[52%] lg:w-[50%] flex flex-col justify-between p-8 sm:p-14 lg:p-20 z-10 bg-[#101010]">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <img
            src="/login-logo.png"
            alt="RioSãoPaulo"
            className="h-14 sm:h-16 w-auto object-contain max-w-[280px]"
          />
        </div>

        {/* Center Box: Form (Normal Login OU Primeiro Acesso) */}
        <div className="w-full max-w-sm mx-auto my-8">
          {firstAccessUser ? (
            /* ================= TELINHA DE PRIMEIRO ACESSO ================= */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4007E]/10 border border-[#E4007E]/30 text-[#E4007E] text-[11px] font-black tracking-wider uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Primeiro Acesso</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Defina sua Nova Senha
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Olá, <strong className="text-white">{firstAccessUser.name}</strong>! Crie uma senha pessoal definitiva para acessar sua conta.
                </p>
              </div>

              {/* Error Message Primeiro Acesso */}
              {firstAccessError && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/70 border border-rose-800 rounded-2xl text-rose-300 text-xs font-semibold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{firstAccessError}</span>
                </div>
              )}

              <form onSubmit={handleFirstAccessSubmit} className="space-y-5">
                {/* Nova Senha */}
                <div className="relative border-b-2 border-[#2A2A2A] focus-within:border-[#E4007E] pb-2.5 transition-colors flex items-center gap-3 bg-transparent">
                  <Lock className="w-5 h-5 text-[#E4007E] shrink-0" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="nova senha (mínimo 4 dígitos)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ background: 'transparent', backgroundColor: 'transparent' }}
                    className="login-input w-full text-base font-bold text-white placeholder-slate-400 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                    title={showNewPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="relative border-b-2 border-[#2A2A2A] focus-within:border-[#E4007E] pb-2.5 transition-colors flex items-center gap-3 bg-transparent">
                  <KeyRound className="w-5 h-5 text-[#E4007E] shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ background: 'transparent', backgroundColor: 'transparent' }}
                    className="login-input w-full text-base font-bold text-white placeholder-slate-400 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Botão Salvar Nova Senha */}
                <button
                  type="submit"
                  disabled={firstAccessLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-base font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer text-center"
                >
                  {firstAccessLoading ? 'Salvando Senha...' : 'Salvar Nova Senha e Entrar'}
                </button>

                {/* Voltar ao Login */}
                <button
                  type="button"
                  onClick={() => {
                    setFirstAccessUser(null);
                    setPassword('');
                  }}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao login normal</span>
                </button>
              </form>
            </div>
          ) : (
            /* ================= FORM DE LOGIN PADRÃO ================= */
            <>
              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/70 border border-rose-800 rounded-2xl text-rose-300 text-xs font-semibold mb-6 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Username / Identifier Input */}
                <div className="relative border-b-2 border-[#2A2A2A] focus-within:border-[#E4007E] pb-2.5 transition-colors flex items-center gap-3 bg-transparent">
                  <User className="w-5 h-5 text-[#E4007E] shrink-0" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="usuário ou e-mail"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{ background: 'transparent', backgroundColor: 'transparent' }}
                    className="login-input w-full text-base font-bold text-white placeholder-slate-400 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none p-0"
                  />
                </div>

                {/* Password Input */}
                <div className="relative border-b-2 border-[#2A2A2A] focus-within:border-[#E4007E] pb-2.5 transition-colors flex items-center gap-3 bg-transparent">
                  <KeyRound className="w-5 h-5 text-[#E4007E] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ background: 'transparent', backgroundColor: 'transparent' }}
                    className="login-input w-full text-base font-bold text-white placeholder-slate-400 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Primary Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-base font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer text-center"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>

                {/* Remember Me */}
                <div className="flex items-center text-xs font-bold text-white">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#303030] text-[#E4007E] accent-[#E4007E] focus:ring-[#E4007E] bg-[#181818] cursor-pointer"
                    />
                    <span className="text-white">Lembrar de mim</span>
                  </label>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="text-left text-xs text-slate-400 font-medium">
          <p>Copyright © 2026 RioSãoPaulo. Todos os direitos reservados</p>
        </div>
      </div>

      {/* RIGHT COLUMN: ART PANEL */}
      <div className="hidden md:block md:w-[48%] lg:w-[50%] relative overflow-hidden bg-gradient-to-br from-[#1E1E1E] via-[#141414] to-[#101010]">
        {/* Custom Login Art Image if configured */}
        {loginArtUrl ? (
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <img
              src={loginArtUrl}
              alt="Arte de Login"
              className="w-full h-full object-cover object-center animate-in fade-in duration-500"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-56 h-56 rounded-3xl bg-[#181818] border border-[#2A2A2A] p-6 flex items-center justify-center shadow-2xl">
              <img
                src="/login-logo.png"
                alt="RioSãoPaulo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Wave Divider in Center */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute top-0 bottom-0 -left-1 h-full w-14 lg:w-20 text-[#101010] z-20 pointer-events-none fill-[#101010]"
        >
          <path
            d="M0,0 L40,0 Q10,35 60,65 Q95,90 40,100 L0,100 Z"
            fill="currentColor"
          />
        </svg>

        {/* Right Corner Accent Badge */}
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2 bg-[#101010]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#2A2A2A] text-white text-xs font-bold shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#E4007E]" />
          <span>RioSãoPaulo</span>
        </div>
      </div>

      {/* Informational Modal for Signup / Forgot Password */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="bg-[#181818] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#2A2A2A] text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E4007E]/10 text-[#E4007E] flex items-center justify-center mx-auto mb-4 border border-[#E4007E]/20">
              <Info className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">
              {infoModal === 'signup' ? 'Cadastro de Usuário' : 'Recuperação de Senha'}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {infoModal === 'signup'
                ? 'Os novos usuários e membros da equipe são cadastrados exclusivamente pelo Administrador do sistema através da Central de Cadastros.'
                : 'Para redefinir sua senha, solicite ao Administrador que atualize seus dados de acesso na Central de Membros.'}
            </p>

            <button
              type="button"
              onClick={() => setInfoModal(null)}
              className="w-full py-3 bg-[#E4007E] hover:bg-[#c2006b] text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN WELCOME ANIMATION */}
      {welcomeUser && (
        <div className="fixed inset-0 z-50 bg-[#101010]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          {/* Ambient Colorful Glows */}
          <div className="absolute w-96 h-96 bg-[#E4007E]/15 rounded-full blur-3xl pointer-events-none -top-10 animate-pulse" />
          <div className="absolute w-96 h-96 bg-[#E94E18]/15 rounded-full blur-3xl pointer-events-none -bottom-10 animate-pulse" />

          <div className="relative z-10 flex flex-col items-center max-w-md w-full space-y-7">
            {/* Animated Logo with Glowing Spinning Ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer glowing spinner rings */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E4007E] border-r-[#E94E18] border-b-[#10B981] animate-spin" />
              <div
                className="absolute -inset-1.5 rounded-full border-2 border-dashed border-[#E4007E]/40 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '4s' }}
              />

              {/* Icon Container with subtle bounce/pulse */}
              <div className="w-20 h-20 rounded-full bg-[#181818] border-2 border-[#E4007E]/60 p-3.5 shadow-2xl shadow-pink-600/20 flex items-center justify-center animate-pulse">
                <img
                  src="/sidebar-icon.png"
                  alt="Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(228,0,126,0.4)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
            </div>

            {/* Welcome Title & User Name */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E4007E]/10 border border-[#E4007E]/30 text-[#E4007E] text-[11px] font-black tracking-widest uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Acesso Autorizado</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Bem-vindo(a), <span className="text-[#E4007E]">{welcomeUser.name}</span>!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Preparando suas demandas no <strong className="text-slate-200 font-bold">RioSãoPaulo</strong>...
              </p>
            </div>

            {/* Countdown & Loading Status Indicator */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-xs font-bold text-slate-200">
                  Carregando os dados...
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#E4007E] text-white font-black text-xs shadow-md">
                  {countdown}s
                </span>
              </div>

              {/* 5-second dynamic progress bar */}
              <div className="w-64 h-2 bg-[#262626] rounded-full overflow-hidden relative shadow-inner p-0.5 border border-[#303030]">
                <div
                  className="h-full bg-gradient-to-r from-[#E4007E] via-pink-500 to-[#E94E18] rounded-full transition-all duration-1000 ease-linear shadow-xs"
                  style={{ width: `${Math.min(100, Math.max(10, ((5 - countdown + 1) / 5) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
