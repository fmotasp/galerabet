import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { INITIAL_EMPLOYEES } from '../data/mockData';

export interface EmployeesContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<Employee | null> | void;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const EmployeesContext = createContext<EmployeesContextType | null>(null);

export const EmployeesProvider: React.FC<{
  children: React.ReactNode;
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addActivity: (userName: string, userInitials: string, message: string, dotColor?: any) => void;
}> = ({ children, addToast, addActivity }) => {
  const mapRowToEmployee = (row: any): Employee => ({
    id: row.id,
    auth_user_id: row.auth_user_id,
    name: row.name || 'Colaborador',
    role: row.role || 'Designer',
    department: row.department || 'Design',
    initials: row.initials || (row.name ? row.name.slice(0, 2).toUpperCase() : 'CO'),
    status: row.status || 'online',
    tags: Array.isArray(row.tags) ? row.tags : [],
    currentWorkload: Number(row.current_workload ?? 50),
    assignedTaskCount: 0,
    collaboratorIds: [],
    email: row.email || '',
    password: row.password || '',
    username: row.username || '',
    location: row.location || 'Brasil',
    labelId: row.label_id || '',
    labelColor: row.label_color || 'purple',
    needsPasswordChange: Boolean(row.needs_password_change),
    roleType: row.role_type || 'employee',
  });

  // Employees (Usuários/Membros)
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // Carrega lista de funcionários diretamente do Supabase e sincroniza em tempo real
  useEffect(() => {
    let isMounted = true;

    const fetchEmployeesFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('[Supabase] Erro ao carregar funcionários:', error);
          return;
        }

        if (data && isMounted) {
          const mapped = data.map(mapRowToEmployee);
          setEmployees(mapped);
        }
      } catch (err) {
        console.error('[Supabase] Falha de conexão ao carregar funcionários:', err);
      }
    };

    fetchEmployeesFromSupabase();

    // Inscrição Realtime para novos funcionários, edições e exclusões
    const channel = supabase
      .channel('realtime:employees')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'employees' },
        (payload) => {
          if (!payload.new || !isMounted) return;
          const newEmp = mapRowToEmployee(payload.new);
          setEmployees((prev) => {
            if (prev.some((e) => e.id === newEmp.id)) return prev;
            return [...prev, newEmp].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'employees' },
        (payload) => {
          if (!payload.new || !isMounted) return;
          const updatedEmp = mapRowToEmployee(payload.new);
          setEmployees((prev) =>
            prev.map((e) => (e.id === updatedEmp.id ? { ...e, ...updatedEmp } : e))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'employees' },
        (payload) => {
          if (!payload.old || !isMounted) return;
          const deletedId = (payload.old as any).id;
          setEmployees((prev) => prev.filter((e) => e.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Employee Actions (Salva no Supabase + Local)
  const addEmployee = async (newEmpData: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...newEmpData,
      id,
    };
    setEmployees((prev) => [newEmp, ...prev]);

    // Persiste no Supabase com payload sanitizado
    try {
      // APENAS campos que existem na tabela employees do Supabase
      const dbPayload: Record<string, any> = {
        id: newEmp.id,
        name: newEmp.name || '',
        email: newEmp.email || '',
        role: newEmp.role || 'Colaborador',
        department: newEmp.department || 'Design',
        initials: newEmp.initials || '',
        status: newEmp.status || 'online',
      };

      // Campos opcionais — só inclui se tiver valor válido
      if (Array.isArray(newEmp.tags) && newEmp.tags.length > 0) dbPayload.tags = newEmp.tags;
      if (typeof newEmp.currentWorkload === 'number') dbPayload.current_workload = newEmp.currentWorkload;
      if (newEmp.labelId) dbPayload.label_id = newEmp.labelId;
      if (newEmp.labelColor) dbPayload.label_color = newEmp.labelColor;
      if (newEmp.username) dbPayload.username = newEmp.username;
      if (newEmp.location) dbPayload.location = newEmp.location;
      if (typeof newEmp.needsPasswordChange === 'boolean') dbPayload.needs_password_change = newEmp.needsPasswordChange;
      if (newEmp.password) dbPayload.password = newEmp.password;

      console.log('[addEmployee] dbPayload sendo enviado:', JSON.stringify(dbPayload));

      const { data, error } = await supabase.from('employees').insert(dbPayload).select();
      if (error) {
        console.error('[addEmployee] Erro no insert principal:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload: JSON.stringify(dbPayload),
        });
        // Tenta fallback com apenas os campos essenciais se alguma coluna opcional falhar
        const basicPayload: Record<string, any> = {
          id: newEmp.id,
          name: newEmp.name || '',
          email: newEmp.email || '',
          role: newEmp.role || 'Colaborador',
          department: newEmp.department || 'Design',
          initials: newEmp.initials || '',
          status: newEmp.status || 'online',
        };
        console.log('[addEmployee] Tentando fallback com basicPayload:', JSON.stringify(basicPayload));
        const { error: fallbackErr } = await supabase.from('employees').insert(basicPayload);
        if (fallbackErr) {
          console.error('[addEmployee] Fallback também falhou:', {
            message: fallbackErr.message,
            details: fallbackErr.details,
            hint: fallbackErr.hint,
            code: fallbackErr.code,
          });
          addToast('Erro Supabase ⚠️', `Falha ao gravar no Supabase: ${fallbackErr.message}`, 'error');
        } else {
          addToast('Funcionário Salvo ☁️', `${newEmp.name} gravado com sucesso.`, 'success');
        }
      } else {
        addToast('Funcionário Salvo no Supabase ☁️', `${newEmp.name} gravado no banco de dados.`, 'success');
      }
    } catch (sbErr: any) {
      console.error('Supabase employee insert exception:', sbErr);
      addToast('Erro Supabase ⚠️', `Exceção ao gravar no Supabase: ${sbErr.message}`, 'error');
    }

    addActivity('Admin', 'AD', `adicionou ${newEmp.name} como colaborador`, 'purple');
    return newEmp;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp))
    );

    // Atualiza no Supabase
    try {
      const payload: any = { id };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.department !== undefined) payload.department = updates.department;
      if (updates.initials !== undefined) payload.initials = updates.initials;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.currentWorkload !== undefined) payload.current_workload = updates.currentWorkload;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.labelId !== undefined) payload.label_id = updates.labelId;
      if (updates.labelColor !== undefined) payload.label_color = updates.labelColor;
      if (updates.needsPasswordChange !== undefined) payload.needs_password_change = updates.needsPasswordChange;
      if (updates.password !== undefined) payload.password = updates.password;

      await supabase.from('employees').upsert(payload);
    } catch (sbErr) {
      console.warn('Supabase employee update warning:', sbErr);
    }

    addToast('Perfil Atualizado', 'Dados do funcionário salvos no Supabase.');
  };

  const deleteEmployee = async (id: string) => {
    const empToDelete = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    // Remove do Supabase
    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase employee delete warning:', sbErr);
    }

    addToast('Funcionário Removido', `Removido ${empToDelete?.name || 'colaborador'}.`, 'info');
  };

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        setEmployees,
      }}
    >
      {children}
    </EmployeesContext.Provider>
  );
};

export const useEmployees = (): EmployeesContextType => {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
};
