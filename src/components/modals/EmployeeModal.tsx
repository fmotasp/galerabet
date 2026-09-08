import React, { useState, useEffect } from 'react';
import { X, Trash2, User, Palette, Eye, EyeOff, KeyRound, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types';

export const EmployeeModal: React.FC = () => {
  const {
    isNewEmployeeModalOpen,
    setIsNewEmployeeModalOpen,
    editingEmployee,
    setEditingEmployee,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    createTrelloLabel,
    updateTrelloLabel,
  } = useApp();

  const isOpen = isNewEmployeeModalOpen || editingEmployee !== null;

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Designer',
    department: 'Design',
    labelColor: 'purple',
    needsPasswordChange: true,
  });

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
        password: editingEmployee.password || '',
        role: editingEmployee.role || 'Designer',
        department: editingEmployee.department || 'Design',
        labelColor: editingEmployee.labelColor || 'purple',
        needsPasswordChange: editingEmployee.needsPasswordChange !== false,
      });

      // Se a senha estiver vazia no estado em memória, busca direto no Supabase em tempo real
      if (!editingEmployee.password) {
        supabase
          .from('employees')
          .select('password, needs_password_change')
          .eq('id', editingEmployee.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setFormData((prev) => ({
                ...prev,
                password: data.password || prev.password,
                needsPasswordChange: data.needs_password_change !== undefined ? data.needs_password_change : prev.needsPasswordChange,
              }));
            }
          });
      }
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Designer',
        department: 'Design',
        labelColor: 'purple',
        needsPasswordChange: true,
      });
    }
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsNewEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const initials = formData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const empPayload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
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
      needsPasswordChange: formData.needsPasswordChange,
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, empPayload);
    } else {
      addEmployee(empPayload);
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />
      <div className="relative bg-[#181818] rounded-3xl shadow-2xl border border-[#2A2A2A] max-w-md w-full p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
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
              E-mail de Login
            </label>
            <input
              type="email"
              placeholder="exemplo@gmail.com ou usuario@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#E4007E]" />
                Senha de Acesso (Login)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Padrão: 123456</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Defina a senha de login..."
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 pr-11 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checkbox Exigir Troca de Senha no 1º Acesso */}
            <label className="flex items-center gap-2.5 mt-2 p-2 rounded-xl bg-[#222222]/60 border border-[#2A2A2A] cursor-pointer select-none group hover:border-[#E4007E]/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.needsPasswordChange}
                onChange={(e) => setFormData({ ...formData, needsPasswordChange: e.target.checked })}
                className="w-4 h-4 rounded text-[#E4007E] focus:ring-[#E4007E] bg-[#181818] border-[#3A3A3A] cursor-pointer"
              />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Primeiro Acesso:</span> Exigir troca de senha no 1º login
              </div>
            </label>
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
                  onClick={() => setFormData({ ...formData, color: c.id })}
                  className={`h-7 rounded-lg ${c.bg} transition-all cursor-pointer ${
                    formData.color === c.id
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
                onClick={() => {
                  if (confirm(`Tem certeza que deseja remover ${editingEmployee.name}?`)) {
                    deleteEmployee(editingEmployee.id);
                    handleClose();
                  }
                }}
                className="text-xs text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 hover:bg-[#222222] text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-98"
              >
                {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Membro'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
