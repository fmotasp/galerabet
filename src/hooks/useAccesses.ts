import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAccessesStore } from '../store/useAccessesStore';
import { Access } from '../types';
import { useApp } from '../context/AppContext';

export const useAccesses = () => {
  const { accesses, setAccesses, accessCategories, setAccessCategories, isLoadingAccesses, setIsLoadingAccesses, hasFetchedOnce, setHasFetchedOnce } = useAccessesStore();
  const { addToast } = useApp();

  const fetchAccesses = useCallback(async (force = false) => {
    if (!force && hasFetchedOnce) return;
    
    setIsLoadingAccesses(true);
    try {
      const { data, error } = await supabase
        .from('accesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Access[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          siteUrl: row.site_url,
          category: row.category,
          login: row.login,
          password: row.password,
          coverImageUrl: row.cover_image_url,
          coverFileId: row.cover_file_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        setAccesses(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching accesses:', err);
      addToast('Erro ao carregar', 'Não foi possível carregar os acessos. Crie a tabela primeiro.', 'error');
    } finally {
      setHasFetchedOnce(true);
      setIsLoadingAccesses(false);
    }
  }, [setAccesses, setIsLoadingAccesses, setHasFetchedOnce, hasFetchedOnce, addToast]);

  const addAccess = async (access: Omit<Access, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dbRow = {
        title: access.title,
        site_url: access.siteUrl,
        category: access.category,
        login: access.login,
        password: access.password,
        cover_image_url: access.coverImageUrl,
        cover_file_id: access.coverFileId,
      };

      const { data, error } = await supabase
        .from('accesses')
        .insert([dbRow])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newAccess: Access = {
          id: data.id,
          title: data.title,
          siteUrl: data.site_url,
          category: data.category,
          login: data.login,
          password: data.password,
          coverImageUrl: data.cover_image_url,
          coverFileId: data.cover_file_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setAccesses((prev) => [newAccess, ...prev]);
        addToast('Sucesso', 'Acesso criado com sucesso!', 'success');
      }
    } catch (err: any) {
      console.error('Error adding access:', err);
      addToast('Erro', 'Não foi possível criar o acesso.', 'error');
    }
  };

  const updateAccess = async (id: string, updates: Partial<Access>) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.siteUrl !== undefined) dbUpdates.site_url = updates.siteUrl;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.login !== undefined) dbUpdates.login = updates.login;
      if (updates.password !== undefined) dbUpdates.password = updates.password;
      if (updates.coverImageUrl !== undefined) dbUpdates.cover_image_url = updates.coverImageUrl;
      if (updates.coverFileId !== undefined) dbUpdates.cover_file_id = updates.coverFileId;

      const { error } = await supabase
        .from('accesses')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setAccesses((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
      );
      addToast('Sucesso', 'Acesso atualizado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Error updating access:', err);
      addToast('Erro', 'Não foi possível atualizar o acesso.', 'error');
    }
  };

  const deleteAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accesses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccesses((prev) => prev.filter((acc) => acc.id !== id));
      addToast('Sucesso', 'Acesso excluído.', 'success');
    } catch (err: any) {
      console.error('Error deleting access:', err);
      addToast('Erro', 'Não foi possível excluir o acesso.', 'error');
    }
  };

  const fetchAccessCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('color_palette')
        .eq('id', 'access-categories-settings')
        .maybeSingle();

      if (!error && data && Array.isArray(data.color_palette) && data.color_palette.length > 0) {
        setAccessCategories(data.color_palette);
      }
    } catch (err) {
      console.warn('Could not load access categories:', err);
    }
  }, [setAccessCategories]);

  const saveAccessCategories = async (newCategories: string[]) => {
    setAccessCategories(newCategories);
    try {
      await supabase.from('projects').upsert({
        id: 'access-categories-settings',
        name: 'Configurações de Categorias de Acesso',
        category: 'System',
        color_palette: newCategories,
        status: 'system',
      });
      addToast('Sucesso', 'Categorias atualizadas!', 'success');
    } catch (err) {
      console.error('Error saving access categories:', err);
      addToast('Erro', 'Não foi possível salvar as categorias.', 'error');
    }
  };

  return {
    accesses,
    accessCategories,
    isLoadingAccesses,
    fetchAccesses,
    fetchAccessCategories,
    saveAccessCategories,
    addAccess,
    updateAccess,
    deleteAccess,
  };
};
