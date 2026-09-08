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

const STORAGE_KEYS = {
  EMPLOYEES: 'spine_employees_v1',
};

const EmployeesContext = createContext<EmployeesContextType | null>(null);

export const EmployeesProvider: React.FC<{
  children: React.ReactNode;
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addActivity: (userName: string, userInitials: string, message: string, dotColor?: any) => void;
  deleteTrelloLabel?: (labelId: string) => Promise<boolean>;
}> = ({ children, addToast, addActivity, deleteTrelloLabel }) => {
  // Employees (Usuários/Membros) - Hidratação imediata de cache
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EMPLOYEES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to save employees to localStorage:', e);
    }
  }, [employees]);

  // Employee Actions (Salva no Supabase + Local + Trello)
  const addEmployee = async (newEmpData: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...newEmpData,
      id,
    };
    setEmployees((prev) => [newEmp, ...prev]);

    // Persiste no Supabase com payload sanitizado
    try {
      const dbPayload: any = {
        id: newEmp.id,
        name: newEmp.name,
        email: newEmp.email,
        role: newEmp.role,
        department: newEmp.department,
        initials: newEmp.initials,
        status: newEmp.status,
      };

      if (newEmp.tags) dbPayload.tags = newEmp.tags;
      if (newEmp.currentWorkload !== undefined) dbPayload.current_workload = newEmp.currentWorkload;
      if (newEmp.labelId) dbPayload.label_id = newEmp.labelId;
      if (newEmp.labelColor) dbPayload.label_color = newEmp.labelColor;
      if (newEmp.username) dbPayload.username = newEmp.username;
      if (newEmp.location) dbPayload.location = newEmp.location;
      if (newEmp.needsPasswordChange !== undefined) dbPayload.needs_password_change = newEmp.needsPasswordChange;

      const { data, error } = await supabase.from('employees').insert(dbPayload);
      if (error) {
        console.error('Supabase employee insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        // Tenta fallback com apenas os campos essenciais se alguma coluna opcional falhar
        const basicPayload = {
          id: newEmp.id,
          name: newEmp.name,
          email: newEmp.email,
          role: newEmp.role,
          department: newEmp.department,
          initials: newEmp.initials,
          status: newEmp.status,
        };
        const { error: fallbackErr } = await supabase.from('employees').insert(basicPayload);
        if (fallbackErr) {
          console.error('Supabase employee basic insert error:', fallbackErr);
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

      await supabase.from('employees').upsert(payload);
    } catch (sbErr) {
      console.warn('Supabase employee update warning:', sbErr);
    }

    addToast('Perfil Atualizado', 'Dados do funcionário salvos no Supabase.');
  };

  const deleteEmployee = async (id: string) => {
    const empToDelete = employees.find((e) => e.id === id);
    if (empToDelete?.labelId && deleteTrelloLabel) {
      deleteTrelloLabel(empToDelete.labelId);
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    // Remove do Supabase
    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase employee delete warning:', sbErr);
    }

    addToast('Funcionário Removido', `Removido ${empToDelete?.name || 'colaborador'} e sua etiqueta no Trello.`, 'info');
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
