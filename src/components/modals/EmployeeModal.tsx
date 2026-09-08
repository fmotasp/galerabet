import React, { useState, useEffect } from 'react';
import { X, Trash2, Palette, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { supabase } from '../../lib/supabase';

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
  } = useApp();

  const isOpen = isNewEmployeeModalOpen || editingEmployee !== null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Designer',
    department: 'Design',
    labelColor: 'purple',
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TRELLO_COLORS = [
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

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        name: editingEmployee.name,
        email: editingEmployee.email || '',
        role: editingEmployee.role || 'Designer',
        department: editingEmployee.department || 'Design',
        labelColor: editingEmployee.labelColor || 'purple',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Designer',
        department: 'Design',
        labelColor: 'purple',
      });
    }
    setValidationError('');
    setIsSubmitting(false);
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setValidationError('');
    setIsSubmitting(false);
    setIsNewEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanName) {
      setValidationError('Nome é obrigatório.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setValidationError('E-mail válido é obrigatório.');
      return;
    }

    setIsSubmitting(true);

    const initials = cleanName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Objeto Employee: NUNCA inclui campo password
    // Novos funcionários recebem needsPasswordChange = true para forçar troca no primeiro acesso
    const empPayload = {
      name: cleanName,
      email: cleanEmail,
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
      needsPasswordChange: editingEmployee ? (editingEmployee.needsPasswordChange ?? false) : true,
    };

    try {
      if (editingEmployee) {
        // Modo Edição: Atualiza os dados normais do funcionário
        await updateEmployee(editingEmployee.id, empPayload);

        // Se for um funcionário legado ou sem vínculo ao Supabase Auth, provisiona o acesso com a senha padrão 1234
        if (!editingEmployee.auth_user_id) {
          const { data: { session } } = await supabase.auth.getSession();
          const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

          const { data: funcData, error: funcErr } = await supabase.functions.invoke('manage-employee', {
            headers: authHeaders,
            body: {
              operation: 'create',
              employee_id: editingEmployee.id,
              email: cleanEmail,
              password: '1234',
              name: cleanName,
              role: empPayload.role,
            },
          });

          const funcErrorMsg = funcErr?.message || funcData?.error;
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
                needsPasswordChange: true,
              });
            }
            addToast('Sucesso', 'Funcionário atualizado e acesso inicial configurado.', 'success');
          }
        } else {
          addToast('Sucesso', 'Funcionário atualizado com sucesso.', 'success');
        }
      } else {
        // Modo Criação: Cadastra o funcionário no banco
        const createdEmp = await addEmployee(empPayload);
        const employeeId = createdEmp?.id || `emp-${Date.now()}`;

        // Obtém a sessão atual para enviar o token de autorização explicitamente
        const { data: { session } } = await supabase.auth.getSession();
        const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

        // Chama a Edge Function para criar/vincular a identidade no Supabase Auth com senha inicial 1234
        // e needs_password_change = true
        const { data: funcData, error: funcErr } = await supabase.functions.invoke('manage-employee', {
          headers: authHeaders,
          body: {
            operation: 'create',
            employee_id: employeeId,
            email: cleanEmail,
            password: '1234',
            name: cleanName,
            role: empPayload.role,
          },
        });

        const funcErrorMsg = funcErr?.message || funcData?.error;
        if (funcErrorMsg) {
          console.warn('[manage-employee] Aviso ao provisionar credencial inicial:', funcErrorMsg);
          addToast(
            'Atenção ⚠️',
            `Funcionário cadastrado, mas a criação do acesso falhou: ${funcErrorMsg}. Abra o cadastro dele para tentar novamente.`,
            'warning'
          );
        } else {
          if (funcData?.auth_user_id) {
            updateEmployee(employeeId, {
              auth_user_id: funcData.auth_user_id,
              needsPasswordChange: true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />
      <div className="relative bg-[#181818] rounded-3xl shadow-2xl border border-[#2A2A2A] max-w-md w-full p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black shadow-md shadow-[#E4007E]/25">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">
              {editingEmployee ? 'Editar Membro da Equipe' : 'Cadastrar Novo Membro'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs font-semibold animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Felipe Mota, Rafael Barbosa..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              E-mail de Login <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="exemplo@gmail.com ou usuario@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Cargo / Função
            </label>
            <input
              type="text"
              list="role-suggestions"
              placeholder="Ex: Designer, Video Maker, Gestor, Copywriter..."
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-3 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
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
            <input
              type="text"
              list="dept-suggestions"
              placeholder="Ex: Design, Audiovisual, Gestão, Conteúdo..."
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full p-3 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
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
              {TRELLO_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
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
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (confirm(`Tem certeza que deseja remover ${editingEmployee.name}?`)) {
                    deleteEmployee(editingEmployee.id);
                    handleClose();
                  }
                }}
                className="text-xs text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClose}
                className="px-4 py-2.5 hover:bg-[#222222] text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-98 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingEmployee ? 'Salvar Alterações' : 'Cadastrar Membro'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
