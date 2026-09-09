import React, { useState } from 'react';
import {
  User,
  Mail,
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
  const {
    setCurrentUser,
    addToast,
    employees,
    loginArtUrl,
    updateLoginArtUrl,
    updateEmployee,
    pendingPasswordChangeUser,
    setPendingPasswordChangeUser,
  } = useApp();

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

  // Se houver usuário com troca pendente identificado no AppContext (ex: após F5/reload),
  // ativa automaticamente o modal de Primeiro Acesso
  React.useEffect(() => {
    if (pendingPasswordChangeUser && !firstAccessUser) {
      setFirstAccessUser({
        id: pendingPasswordChangeUser.id,
        name: pendingPasswordChangeUser.name,
        email: pendingPasswordChangeUser.email,
        role: pendingPasswordChangeUser.role,
        profile: pendingPasswordChangeUser.profile || pendingPasswordChangeUser,
      });
      setNewPassword('');
      setConfirmPassword('');
      setFirstAccessError('');
    }
  }, [pendingPasswordChangeUser]);

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
    setWelcomeUser(user);
    setCountdown(5);

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

    const cleanEmail = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Por favor, informe seu e-mail e senha de acesso.');
      setLoading(false);
      return;
    }

    if (!cleanEmail.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido (ex: usuario@empresa.com).');
      setLoading(false);
      return;
    }

    try {
      // Autenticação oficial via Supabase Auth (servidor valida com hash criptografado)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (authError || !authData.user) {
        console.warn('[Supabase Auth] Falha no login:', authError?.message);
        setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
        setLoading(false);
        return;
      }

      const authUser = authData.user;

      // 3. Busca o perfil do colaborador associado ao auth_user_id
      let profile: any = null;

      const { data: byAuthId } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (byAuthId) {
        profile = byAuthId;
      } else if (authUser.email) {
        // Fallback por email: vincula automaticamente auth_user_id no primeiro login
        const { data: byEmail } = await supabase
          .from('employees')
          .select('*')
          .ilike('email', authUser.email.trim())
          .maybeSingle();

        if (byEmail) {
          profile = byEmail;
          if (!byEmail.auth_user_id) {
            await supabase
              .from('employees')
              .update({ auth_user_id: authUser.id })
              .eq('id', byEmail.id);
          }
        }
      }

      // Sincroniza a senha na tabela employees para que administradores possam visualizá-la
      if (profile?.id && cleanPass && profile.password !== cleanPass) {
        supabase
          .from('employees')
          .update({ password: cleanPass })
          .eq('id', profile.id)
          .then(() => {
            if (updateEmployee) updateEmployee(profile.id, { password: cleanPass });
          });
      }

      const isUserAdmin =
        profile?.role_type === 'admin' ||
        profile?.role?.toLowerCase() === 'admin' ||
        profile?.role?.toLowerCase() === 'administrador' ||
        authUser.email === 'admin@empresa.com' ||
        authUser.user_metadata?.role === 'admin' ||
        authUser.app_metadata?.role === 'admin';

      // 4. Verificação de Primeiro Acesso (Troca Obrigatória de Senha)
      // Se no Auth já foi marcado como false (o usuário já definiu sua senha pessoal), NUNCA mais exige nova troca.
      const hasAlreadyChangedPassword = authUser.user_metadata?.needs_password_change === false;
      const requiresPasswordChange =
        !hasAlreadyChangedPassword &&
        (profile?.needs_password_change === true || authUser.user_metadata?.needs_password_change === true);

      if (requiresPasswordChange) {
        setLoading(false);
        setFirstAccessUser({
          id: profile?.id || authUser.id,
          name: profile?.name || authUser.user_metadata?.name || 'Colaborador',
          email: authUser.email,
          role: profile?.role || 'Colaborador',
          profile,
        });
        setNewPassword('');
        setConfirmPassword('');
        setFirstAccessError('');
        return;
      }

      // 5. Monta usuário autenticado para o contexto da aplicação
      const userRole = profile?.role || (isUserAdmin ? 'Administrador' : 'Colaborador');
      const userName =
        profile?.name ||
        authUser.user_metadata?.name ||
        (isUserAdmin ? 'Administrador Geral' : authUser.email?.split('@')[0] || 'Usuário');

      const authenticatedUser = {
        id: profile?.id || authUser.id,
        authUserId: authUser.id,
        name: userName,
        email: authUser.email || profile?.email || '',
        role: userRole,
        roleType: isUserAdmin ? ('admin' as const) : ('employee' as const),
        avatarUrl: profile?.avatar_url || profile?.avatarUrl || '',
        initials: profile?.initials || (isUserAdmin ? 'AD' : 'CB'),
        department: profile?.department,
      };

      setLoading(false);
      triggerWelcomeAndLogin(authenticatedUser);
    } catch (err: any) {
      console.error('[Supabase Auth] Login exception:', err);
      setErrorMsg('Ocorreu um erro ao autenticar. Tente novamente.');
      setLoading(false);
    }
  };

  // Salvar nova senha no primeiro acesso através do Supabase Auth
  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirstAccessError('');
    const cleanNew = newPassword.trim();
    const cleanConf = confirmPassword.trim();

    if (cleanNew.length < 6) {
      setFirstAccessError('A nova senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (cleanNew !== cleanConf) {
      setFirstAccessError('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    setFirstAccessLoading(true);

    try {
      // 1. Atualiza a senha no Supabase Auth e o metadata de forma criptografada pelo servidor
      const { error: authErr } = await supabase.auth.updateUser({
        password: cleanNew,
        data: {
          needs_password_change: false,
          current_password: cleanNew,
        },
      });

      if (authErr) {
        console.error('[Supabase Auth] Erro ao atualizar senha no primeiro acesso:', authErr);
        setFirstAccessError(`Falha ao definir nova senha: ${authErr.message}`);
        setFirstAccessLoading(false);
        return;
      }

      // 2. Atualiza a flag needs_password_change e a nova senha na tabela employees
      const targetEmpId = firstAccessUser.profile?.id || firstAccessUser.id;
      const empUpdatePayload = {
        needs_password_change: false,
        password: cleanNew,
      };

      if (targetEmpId) {
        const { error: empErr } = await supabase
          .from('employees')
          .update(empUpdatePayload)
          .eq('id', targetEmpId);

        if (empErr) {
          console.warn('[Supabase] Erro ao sincronizar flag no banco de employees por ID:', empErr);
        }
      }

      if (firstAccessUser.email) {
        await supabase
          .from('employees')
          .update(empUpdatePayload)
          .ilike('email', firstAccessUser.email.trim())
          .catch(() => {});
      }

      if (updateEmployee && targetEmpId) {
        updateEmployee(targetEmpId, {
          needsPasswordChange: false,
          password: cleanNew,
        });
      }

      // 3. Monta usuário logado
      const isUserAdmin =
        firstAccessUser.profile?.role_type === 'admin' ||
        firstAccessUser.profile?.role?.toLowerCase() === 'admin' ||
        firstAccessUser.profile?.role?.toLowerCase() === 'administrador' ||
        firstAccessUser.email === 'admin@empresa.com';

      const authenticatedUser = {
        id: firstAccessUser.profile?.id || firstAccessUser.id,
        authUserId: firstAccessUser.id,
        name: firstAccessUser.name,
        email: firstAccessUser.email || '',
        role: firstAccessUser.role || 'Colaborador',
        roleType: isUserAdmin ? ('admin' as const) : ('employee' as const),
        avatarUrl: firstAccessUser.profile?.avatar_url || firstAccessUser.profile?.avatarUrl || '',
        initials: firstAccessUser.profile?.initials || 'CB',
        department: firstAccessUser.profile?.department,
        needsPasswordChange: false,
      };

      setPendingPasswordChangeUser(null);
      setFirstAccessLoading(false);
      setFirstAccessUser(null);
      triggerWelcomeAndLogin(authenticatedUser);
      addToast('Senha Definida! 🔒', 'Sua nova senha foi gravada com sucesso.', 'success');
    } catch (err: any) {
      console.error('[Supabase Auth] Exceção ao gravar nova senha:', err);
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
                    placeholder="nova senha (mínimo 6 dígitos)"
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
                {/* Email Input */}
                <div className="relative border-b-2 border-[#2A2A2A] focus-within:border-[#E4007E] pb-2.5 transition-colors flex items-center gap-3 bg-transparent">
                  <Mail className="w-5 h-5 text-[#E4007E] shrink-0" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="seu e-mail de acesso"
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
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E4007E] border-r-[#E94E18] border-b-[#E4007E]/30 animate-spin" />
              <div
                className="absolute -inset-1.5 rounded-full border-2 border-dashed border-[#E4007E]/40 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '4s' }}
              />

              {/* Icon Container with subtle bounce/pulse */}
              <div className="w-20 h-20 rounded-full bg-[#181818] border-2 border-[#E4007E]/60 p-3.5 shadow-2xl shadow-[#E4007E]/20 flex items-center justify-center animate-pulse">
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
                <div className="w-2.5 h-2.5 rounded-full bg-[#E4007E] animate-ping shrink-0" />
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
