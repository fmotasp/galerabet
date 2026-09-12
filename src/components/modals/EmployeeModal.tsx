import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Palette, UserCheck, AlertCircle, KeyRound, Eye, EyeOff, Copy, Check, Camera, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button, Input, Modal } from '../ui';
import { uploadEmployeeAvatarToDrive } from '../../lib/googleDrive';

export const EmployeeModal: React.FC = () => {
  const {
    isNewEmployeeModalOpen,
    setIsNewEmployeeModalOpen,
    editingEmployee,
    setEditingEmployee,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addToast,
    currentUser,
    setCurrentUser,
  } = useApp();

  const isOpen = isNewEmployeeModalOpen || editingEmployee !== null;

  const [showPassword, setShowPassword] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Designer',
    department: 'Design',
    labelColor: 'purple',
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LABEL_COLORS = [
    { id: 'purple', name: 'Roxo', bg: 'bg-purple-600', hex: '#89609e' },
    { id: 'blue', name: 'Azul', bg: 'bg-blue-600', hex: '#0079bf' },
    { id: 'green', name: 'Verde', bg: 'bg-emerald-600', hex: '#61bd4f' },
    { id: 'yellow', name: 'Amarelo', bg: 'bg-amber-500', hex: '#f2d600' },
    { id: 'orange', name: 'Laranja', bg: 'bg-orange-500', hex: '#ff9f1a' },
    { id: 'red', name: 'Vermelho', bg: 'bg-rose-600', hex: '#eb5a46' },
    { id: 'sky', name: 'Ciano', bg: 'bg-sky-500', hex: '#00c2e0' },
    { id: 'pink', name: 'Rosa', bg: 'bg-pink-500', hex: '#ff78cb' },
    { id: 'black', name: 'Escuro', bg: 'bg-slate-800', hex: '#344563' },
  ];

  // Rastreia o ID do colaborador atualmente carregado no modal para não re-inicializar a cada render/update
  const loadedEmployeeIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      loadedEmployeeIdRef.current = undefined;
      return;
    }

    const currentEmpId = editingEmployee ? editingEmployee.id : '__new__';
    if (loadedEmployeeIdRef.current === currentEmpId) {
      return;
    }
    loadedEmployeeIdRef.current = currentEmpId;

    if (editingEmployee) {
      const currentPassword = editingEmployee.password || (editingEmployee.needsPasswordChange === true ? '123456' : '');
      setFormData({
        name: editingEmployee.name,
        email: editingEmployee.email || '',
        password: currentPassword,
        role: editingEmployee.role || 'Designer',
        department: editingEmployee.department || 'Design',
        labelColor: editingEmployee.labelColor || 'purple',
      });
      setAvatarUrl(editingEmployee.avatarUrl || '');
      setAvatarPreview(editingEmployee.avatarUrl || '');
      setAvatarFile(null);

      // Busca a senha mais recente direto no Supabase somente se não tivermos ainda em memória
      const loadEmployeePassword = async () => {
        try {
          let query = supabase.from('employees').select('password, needs_password_change');
          if (editingEmployee.id) {
            query = query.eq('id', editingEmployee.id);
          } else if (editingEmployee.email) {
            query = query.ilike('email', editingEmployee.email.trim());
          }
          const { data } = await query.maybeSingle();
          // Só atualiza se o modal ainda estiver com o mesmo colaborador aberto
          if (data && loadedEmployeeIdRef.current === currentEmpId) {
            if (data.password) {
              setFormData((prev) => ({ ...prev, password: data.password }));
            } else if (data.needs_password_change && !currentPassword) {
              setFormData((prev) => ({ ...prev, password: '123456' }));
            }
          }
        } catch (err) {
          console.warn('[EmployeeModal] Erro ao buscar senha:', err);
        }
      };
      loadEmployeePassword();
    } else {
      setFormData({
        name: '',
        email: '',
        password: '123456',
        role: 'Designer',
        department: 'Design',
        labelColor: 'purple',
      });
      setAvatarUrl('');
      setAvatarPreview('');
      setAvatarFile(null);
    }
    setShowPassword(true);
    setCopiedPassword(false);
    setValidationError('');
    setIsSubmitting(false);
  }, [editingEmployee?.id, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setValidationError('');
    setIsSubmitting(false);
    setIsNewEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleCopyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
    addToast('Senha Copiada 📋', 'Senha copiada para a área de transferência.', 'info');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Formato inválido ⚠️', 'Selecione apenas arquivos de imagem (JPG, PNG, WebP).', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Arquivo muito grande ⚠️', 'A foto deve ter no máximo 5MB.', 'warning');
      return;
    }
    setAvatarFile(file);
    // Local preview while uploading
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (!cleanName) {
      setValidationError('Nome é obrigatório.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setValidationError('E-mail válido é obrigatório.');
      return;
    }

    // Se for novo colaborador e não preencheu, o default é '123456'
    if (!editingEmployee && cleanPassword && cleanPassword.length < 6) {
      setValidationError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    // Se estiver editando e o usuário digitou uma senha menor que 6 caracteres (e não deixou em branco)
    if (editingEmployee && cleanPassword && cleanPassword.length < 6) {
      // Se a senha carregada do banco já tinha menos de 6 caracteres (como f3l1p) e o usuário não mexeu nela, não bloqueia
      const originalPassword = (editingEmployee.password || '').trim();
      if (cleanPassword !== originalPassword) {
        setValidationError('A nova senha deve conter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsSubmitting(true);

    // Upload avatar to Google Drive if a new file was selected
    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      setIsUploadingAvatar(true);
      try {
        addToast('Enviando foto... 📸', 'Fazendo upload para o Google Drive.', 'info');
        const result = await uploadEmployeeAvatarToDrive(avatarFile, cleanName);
        if (result) {
          finalAvatarUrl = result.url;
          setAvatarUrl(result.url);
          addToast('Foto enviada! ✅', 'Avatar salvo no Google Drive.', 'success');
        } else {
          addToast('Aviso ⚠️', 'Não foi possível enviar a foto. Verifique a autenticação do Google Drive.', 'warning');
        }
      } catch (uploadErr) {
        console.warn('Avatar upload error:', uploadErr);
        addToast('Erro no upload ⚠️', 'Falha ao enviar a foto. O cadastro será salvo sem foto.', 'warning');
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    const initials = cleanName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const isDefaultPassword = cleanPassword === '123456';
    const computedNeedsPasswordChange = editingEmployee
      ? (isDefaultPassword ? true : false)
      : isDefaultPassword;

    const empPayload = {
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword || '123456',
      role: formData.role.trim() || 'Colaborador',
      department: (formData.department.trim() || 'Design') as Employee['department'],
      initials,
      status: editingEmployee ? editingEmployee.status : ('online' as Employee['status']),
      tags: [formData.role.trim() || 'COLABORADOR'],
      currentWorkload: editingEmployee ? editingEmployee.currentWorkload : 50,
      assignedTaskCount: editingEmployee ? editingEmployee.assignedTaskCount : 0,
      collaboratorIds: [],
      location: editingEmployee ? editingEmployee.location : 'Brasil',
      labelColor: formData.labelColor,
      needsPasswordChange: computedNeedsPasswordChange,
      avatarUrl: finalAvatarUrl || undefined,
    };

    try {
      if (editingEmployee) {
        // Modo Edição: Atualiza os dados do funcionário (incluindo senha)
        await updateEmployee(editingEmployee.id, empPayload);

        // Se estiver editando o usuário logado atualmente, atualiza o currentUser na hora
        if (currentUser && (currentUser.id === editingEmployee.id || currentUser.email?.toLowerCase() === cleanEmail)) {
          setCurrentUser({
            ...currentUser,
            ...empPayload,
            avatarUrl: finalAvatarUrl || currentUser.avatarUrl,
          });
        }

        // Se o funcionário possui conta no Auth e a senha foi alterada, sincroniza no Supabase Auth
        if (editingEmployee.auth_user_id && cleanPassword && cleanPassword.length >= 6) {
          try {
            let sessionToken = '';
            try {
              const { data: refreshData } = await supabase.auth.refreshSession();
              sessionToken = refreshData?.session?.access_token || '';
            } catch (err) {}
            if (!sessionToken) {
              const { data: { session } } = await supabase.auth.getSession();
              sessionToken = session?.access_token || '';
            }
            const headers: Record<string, string> = {};
            if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

            await supabase.functions.invoke('manage-employee', {
              headers,
              body: {
                operation: 'update_password',
                employee_id: editingEmployee.id,
                password: cleanPassword,
              },
            });
          } catch (authErr) {
            console.warn('[manage-employee] Falha ao sincronizar senha no Auth:', authErr);
          }
        }

        // Se for um funcionário legado ou sem vínculo ao Supabase Auth, provisiona o acesso
        if (!editingEmployee.auth_user_id) {
          let sessionToken = '';
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            sessionToken = refreshData?.session?.access_token || '';
          } catch (err) {}
          if (!sessionToken) {
            const { data: { session } } = await supabase.auth.getSession();
            sessionToken = session?.access_token || '';
          }

          const headers: Record<string, string> = {};
          if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

          const { data: funcData, error: funcErr } = await supabase.functions.invoke('manage-employee', {
            headers,
            body: {
              operation: 'create',
              employee_id: editingEmployee.id,
              email: cleanEmail,
              password: cleanPassword || '123456',
              name: cleanName,
              role: empPayload.role,
            },
          });

          let funcErrorMsg = '';
          if (funcErr) {
            try {
              if ((funcErr as any).context && typeof (funcErr as any).context.json === 'function') {
                const errBody = await (funcErr as any).context.json();
                funcErrorMsg = errBody?.error || funcErr.message;
              } else if ((funcErr as any).context && typeof (funcErr as any).context.text === 'function') {
                const errText = await (funcErr as any).context.text();
                try {
                  const parsed = JSON.parse(errText);
                  funcErrorMsg = parsed?.error || errText;
                } catch {
                  funcErrorMsg = errText || funcErr.message;
                }
              } else {
                funcErrorMsg = funcErr.message;
              }
            } catch {
              funcErrorMsg = funcErr.message;
            }
          } else if (funcData?.error) {
            funcErrorMsg = funcData.error;
          }

            if (funcErrorMsg) {
              console.warn('[manage-employee] Aviso ao configurar acesso do colaborador existente:', funcErrorMsg);
              addToast(
                'Atenção ⚠️',
                `Dados cadastrais salvos, mas o acesso não foi configurado: ${funcErrorMsg}`,
                'warning'
              );
            } else {
              if (funcData?.auth_user_id) {
                updateEmployee(editingEmployee.id, {
                  auth_user_id: funcData.auth_user_id,
                  needsPasswordChange: computedNeedsPasswordChange,
                });
              }
              addToast('Sucesso', 'Funcionário atualizado e acesso inicial configurado.', 'success');
            }
          }

          addToast('Sucesso', 'Funcionário atualizado com sucesso.', 'success');
        } else {
          // Modo Criação: Cadastra o funcionário no banco
          const createdEmp = await addEmployee(empPayload);
          const employeeId = (createdEmp as any)?.id || `emp-${Date.now()}`;

          // Obtém e tenta atualizar a sessão do Supabase Auth para enviar o token de autorização
          let sessionToken = '';
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            sessionToken = refreshData?.session?.access_token || '';
          } catch {
            // Fallback para sessão atual em cache
          }

          if (!sessionToken) {
            const { data: { session } } = await supabase.auth.getSession();
            sessionToken = session?.access_token || '';
          }

        const headers: Record<string, string> = {};
        if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

        // Chama a Edge Function para criar/vincular a identidade no Supabase Auth
        const { data: funcData, error: funcErr } = await supabase.functions.invoke('manage-employee', {
          headers,
          body: {
            operation: 'create',
            employee_id: employeeId,
            email: cleanEmail,
            password: cleanPassword || '123456',
            name: cleanName,
            role: empPayload.role,
          },
        });

        let funcErrorMsg = '';
        if (funcErr) {
          try {
            if ((funcErr as any).context && typeof (funcErr as any).context.json === 'function') {
              const errBody = await (funcErr as any).context.json();
              funcErrorMsg = errBody?.error || funcErr.message;
            } else if ((funcErr as any).context && typeof (funcErr as any).context.text === 'function') {
              const errText = await (funcErr as any).context.text();
              try {
                const parsed = JSON.parse(errText);
                funcErrorMsg = parsed?.error || errText;
              } catch {
                funcErrorMsg = errText || funcErr.message;
              }
            } else {
              funcErrorMsg = funcErr.message;
            }
          } catch {
            funcErrorMsg = funcErr.message;
          }
        } else if (funcData?.error) {
          funcErrorMsg = funcData.error;
        }

        if (funcErrorMsg) {
          console.warn('[manage-employee] Aviso ao provisionar credencial inicial:', funcErrorMsg);
          addToast(
            'Atenção ⚠️',
            `Funcionário cadastrado, mas a criação de credencial automática retornou: ${funcErrorMsg}.`,
            'warning'
          );
        } else {
          if (funcData?.auth_user_id) {
            updateEmployee(employeeId, {
              auth_user_id: funcData.auth_user_id,
              needsPasswordChange: computedNeedsPasswordChange,
            });
          }
          addToast('Sucesso', 'Funcionário cadastrado e credenciais configuradas.', 'success');
        }
      }

      handleClose();
    } catch (err) {
      console.warn('Erro ao processar funcionário:', err);
      addToast('Erro', 'Não foi possível concluir a operação. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      className="!bg-[#181818]"
      icon={<UserCheck className="w-4 h-4" />}
      title={editingEmployee ? 'Editar Membro da Equipe' : 'Cadastrar Novo Membro'}
    >
      {validationError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs font-semibold animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Section */}
        <div className="flex items-center gap-4 p-3 bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A]">
          {/* Avatar Preview */}
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E4007E]/50 shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const current = target.src;
                  const driveMatch =
                    current.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                    current.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                    current.match(/\/d\/([a-zA-Z0-9_-]+)/);
                  if (driveMatch && driveMatch[1] && !current.includes('thumbnail?id=')) {
                    target.src = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w400`;
                  } else {
                    setAvatarPreview('');
                  }
                }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-[#333333]"
                style={{
                  backgroundColor:
                    LABEL_COLORS.find((c) => c.id === formData.labelColor)?.hex || '#89609e',
                }}
              >
                {formData.name
                  ? formData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '??'}
              </div>
            )}
            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || isUploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#E4007E] rounded-full flex items-center justify-center shadow-md hover:bg-[#c2006b] transition-colors cursor-pointer"
              title="Trocar foto"
            >
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Upload controls */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 mb-1">
              {avatarPreview ? 'Foto selecionada' : 'Foto de perfil'}
            </p>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              {avatarFile
                ? `📎 ${avatarFile.name} · será enviada para o Drive`
                : avatarUrl
                ? '✅ Foto salva no Google Drive'
                : 'JPG, PNG ou WebP · máx. 5MB · salvo no Google Drive'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isUploadingAvatar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#383838] text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>{avatarPreview ? 'Trocar foto' : 'Enviar foto'}</span>
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-400 rounded-xl text-[11px] font-bold transition-colors cursor-pointer hover:bg-rose-950/20"
                >
                  <X className="w-3 h-3" />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Nome Completo <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            required
            autoFocus
            disabled={isSubmitting}
            placeholder="Ex: Felipe Mota, Rafael Barbosa..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="!bg-[#222222] !border-[#2A2A2A] focus:!border-[#E4007E]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            E-mail de Login <span className="text-rose-500">*</span>
          </label>
          <Input
            type="email"
            required
            disabled={isSubmitting}
            placeholder="exemplo@gmail.com ou usuario@empresa.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="!bg-[#222222] !border-[#2A2A2A] focus:!border-[#E4007E]"
          />
        </div>

        {editingEmployee ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#E4007E]" />
                <span>Senha Atual do Colaborador</span>
              </label>
              <span className="text-[10px] font-medium">
                {formData.password === '123456' ? (
                  <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Padrão inicial (123456)
                  </span>
                ) : formData.password ? (
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Nova senha pessoal ativa
                  </span>
                ) : (
                  <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                    Senha alterada pelo usuário
                  </span>
                )}
              </span>
            </div>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="new_employee_password"
                autoComplete="new-password"
                disabled={isSubmitting}
                placeholder={
                  formData.password
                    ? ''
                    : editingEmployee.needsPasswordChange !== false
                    ? 'Padrão: 123456'
                    : 'Senha personalizada (digite nova para redefinir)'
                }
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="!bg-[#222222] !border-[#2A2A2A] focus:!border-[#E4007E] pr-20 font-mono tracking-wider text-xs sm:text-sm"
              />
              <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                {formData.password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copiar senha"
                    className="p-1.5 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                  >
                    {copiedPassword ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {formData.password
                ? 'Esta é a senha atual de login deste membro. Você pode visualizá-la, copiá-la ou alterá-la digitando uma nova senha.'
                : 'O colaborador já alterou a senha inicial no Supabase Auth. Digite uma nova senha caso queira redefini-la agora.'}
            </p>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#E4007E]" />
              <span>Senha de Acesso (Login)</span>
            </label>
            <div className="p-3 rounded-lg border border-slate-700/50 bg-[#1A1A1A] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">Senha padrão: <span className="font-mono text-[#E4007E]">123456</span></span>
                <span className="text-xs text-slate-400">O usuário precisará alterar a senha no primeiro acesso.</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Cargo / Função
          </label>
          <Input
            type="text"
            list="role-suggestions"
            disabled={isSubmitting}
            placeholder="Ex: Designer, Video Maker, Gestor, Copywriter..."
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="!bg-[#222222] !border-[#2A2A2A] focus:!border-[#E4007E]"
          />
          <datalist id="role-suggestions">
            <option value="Designer" />
            <option value="Video Maker" />
            <option value="Diretor de Arte" />
            <option value="Motion Designer" />
            <option value="Copywriter / Redator" />
            <option value="Gestor" />
            <option value="Social Media" />
            <option value="Desenvolvedor Frontend" />
            <option value="Administrador" />
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Departamento / Time
          </label>
          <Input
            type="text"
            list="dept-suggestions"
            disabled={isSubmitting}
            placeholder="Ex: Design, Audiovisual, Gestão, Conteúdo..."
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="!bg-[#222222] !border-[#2A2A2A] focus:!border-[#E4007E]"
          />
          <datalist id="dept-suggestions">
            <option value="Design" />
            <option value="Audiovisual" />
            <option value="Gestão" />
            <option value="Marketing" />
            <option value="Conteúdo" />
            <option value="Tecnologia" />
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#E4007E]" />
            Cor de Identificação (Avatar)
          </label>
          <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#222222] rounded-xl border border-[#2A2A2A]">
            {LABEL_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => setFormData({ ...formData, labelColor: c.id })}
                className={`h-7 rounded-lg ${c.bg} transition-all cursor-pointer ${
                  formData.labelColor === c.id
                    ? 'ring-2 ring-white scale-110 shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-[#2A2A2A] mt-6">
          {editingEmployee ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                if (confirm(`Tem certeza que deseja remover ${editingEmployee.name}?`)) {
                  deleteEmployee(editingEmployee.id);
                  handleClose();
                }
              }}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="px-0 py-0 text-xs text-rose-500 hover:text-rose-400 font-bold hover:bg-transparent"
            >
              Excluir
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="md"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-4 py-2.5 hover:bg-[#222222] text-slate-400 hover:text-white rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="px-5 py-2.5 shadow-lg shadow-[#E4007E]/25 text-xs font-black"
            >
              {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Membro'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
