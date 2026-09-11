import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, BrandColor } from '../types';
import { INITIAL_PROJECTS } from '../data/mockData';

export interface BrandMeta {
  colorPalette?: BrandColor[];
  brandManualUrl?: string;
  logosPackUrl?: string;
  typographyUrl?: string;
  additionalMaterialsUrl?: string;
  kvDriveUrl?: string;
  kvDriveItems?: Array<{
    id: string;
    title?: string;
    url: string;
    driveFolderId?: string;
    createdAt?: string;
  }>;
}

export const encodeProjectDescription = (description: string = '', brand: BrandMeta): string => {
  const cleanDesc = (description || '').replace(/\n?<!-- __BRAND_META__[\s\S]*?-->/g, '').trim();
  const hasMeta =
    (brand.colorPalette && brand.colorPalette.length > 0) ||
    Boolean(brand.brandManualUrl) ||
    Boolean(brand.logosPackUrl) ||
    Boolean(brand.typographyUrl) ||
    Boolean(brand.additionalMaterialsUrl) ||
    Boolean(brand.kvDriveUrl) ||
    (brand.kvDriveItems && brand.kvDriveItems.length > 0);

  if (!hasMeta) return cleanDesc;
  const metaJson = JSON.stringify({
    colorPalette: brand.colorPalette || [],
    brandManualUrl: brand.brandManualUrl || '',
    logosPackUrl: brand.logosPackUrl || '',
    typographyUrl: brand.typographyUrl || '',
    additionalMaterialsUrl: brand.additionalMaterialsUrl || '',
    kvDriveUrl: brand.kvDriveUrl || '',
    kvDriveItems: brand.kvDriveItems || [],
  });
  return `${cleanDesc}\n<!-- __BRAND_META__ ${metaJson} -->`.trim();
};

export const decodeProjectDescription = (rawDescription?: string): { cleanDescription: string; brandMeta: BrandMeta } => {
  if (!rawDescription) return { cleanDescription: '', brandMeta: {} };
  const match = rawDescription.match(/<!-- __BRAND_META__ ([\s\S]*?) -->/);
  let brandMeta: BrandMeta = {};
  let cleanDescription = rawDescription;

  if (match && match[1]) {
    try {
      brandMeta = JSON.parse(match[1]);
      cleanDescription = rawDescription.replace(match[0], '').trim();
    } catch {}
  }

  return { cleanDescription, brandMeta };
};

export interface ProjectsContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export const ProjectsProvider: React.FC<{
  children: React.ReactNode;
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addActivity: (userName: string, userInitials: string, message: string, dotColor?: any) => void;
}> = ({ children, addToast, addActivity }) => {
  const mapRowToProject = (row: any): Project => {
    const { cleanDescription, brandMeta } = decodeProjectDescription(row.description);
    return {
      id: row.id,
      name: row.name || 'Cliente Sem Nome',
      category: row.category || 'General',
      description: cleanDescription || '',
      clientId: row.client_id,
      clientName: row.client_name,
      clientIds: Array.isArray(row.client_ids) ? row.client_ids : [],
      clientNames: Array.isArray(row.client_names) ? row.client_names : [],
      status: (row.status as any) || 'active',
      progress: Number(row.progress ?? 0),
      currentSprint: row.current_sprint || 'Sprint Ativa',
      iconType: (row.icon_type as any) || 'rocket',
      iconColor: row.icon_color || '#10B981',
      teamMemberIds: Array.isArray(row.team_member_ids) ? row.team_member_ids : [],
      totalTasks: 0,
      completedTasks: 0,
      labelId: row.label_id,
      labelColor: row.label_color,
      logoUrl: row.logo_url,
      colorPalette: Array.isArray(row.color_palette) ? row.color_palette : brandMeta.colorPalette || [],
      brandManualUrl: row.brand_manual_url || brandMeta.brandManualUrl,
      logosPackUrl: row.logos_pack_url || brandMeta.logosPackUrl,
      typographyUrl: row.typography_url || brandMeta.typographyUrl,
      additionalMaterialsUrl: row.additional_materials_url || brandMeta.additionalMaterialsUrl,
      kvDriveUrl: row.kv_drive_url || brandMeta.kvDriveUrl,
      kvDriveItems: Array.isArray(row.kv_drive_items) ? row.kv_drive_items : (brandMeta.kvDriveItems || []),
    };
  };

  const isSystemProject = (rowOrProj: any) => {
    if (!rowOrProj) return true;
    const id = (rowOrProj.id || '').toLowerCase();
    const cat = (rowOrProj.category || '').toLowerCase();
    const stat = (rowOrProj.status || '').toLowerCase();
    const name = (rowOrProj.name || '').toLowerCase();

    return (
      id === 'system-settings' ||
      id === 'google-drive-token' ||
      id.startsWith('system-') ||
      id.startsWith('google-drive') ||
      cat === 'system' ||
      stat === 'system' ||
      name.includes('google drive') ||
      name.includes('auth token') ||
      name.includes('configurações globais')
    );
  };

  const STORAGE_KEY_PROJECTS = 'spine_projects_v1';

  // Projects / Clientes
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROJECTS;
  });

  // Salva no LocalStorage sempre que os projetos mudarem
  useEffect(() => {
    try {
      if (projects && projects.length > 0) {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      }
    } catch {}
  }, [projects]);

  // Carrega lista de clientes/projetos diretamente do Supabase e sincroniza em tempo real
  useEffect(() => {
    let isMounted = true;

    const fetchProjectsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('[Supabase] Erro ao carregar projetos/clientes:', error);
          return;
        }

        if (data && isMounted) {
          if (data.length > 0) {
            const mapped = data
              .filter((row) => !isSystemProject(row))
              .map(mapRowToProject);
            setProjects(mapped);
            try {
              localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(mapped));
            } catch {}
          } else {
            console.warn('[Supabase] Array vazio retornado para projetos (possível bloqueio por RLS). Mantendo cache local.');
          }
        }
      } catch (err) {
        console.error('[Supabase] Falha de conexão ao carregar projetos:', err);
      }
    };

    fetchProjectsFromSupabase();

    // Inscrição Realtime para novos projetos, atualizações e exclusões
    const channel = supabase
      .channel('realtime:projects')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'projects' },
        (payload) => {
          if (!payload.new || !isMounted) return;
          if (isSystemProject(payload.new)) return;
          const newProj = mapRowToProject(payload.new);
          setProjects((prev) => {
            if (prev.some((p) => p.id === newProj.id)) return prev;
            return [...prev, newProj].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects' },
        (payload) => {
          if (!payload.new || !isMounted) return;
          if (isSystemProject(payload.new)) {
            // Se virou system, remove da lista de clientes
            setProjects((prev) => prev.filter((p) => p.id !== payload.new.id));
            return;
          }
          const updatedProj = mapRowToProject(payload.new);
          setProjects((prev) =>
            prev.map((p) => (p.id === updatedProj.id ? { ...p, ...updatedProj } : p))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'projects' },
        (payload) => {
          if (!payload.old || !isMounted) return;
          const deletedId = (payload.old as any).id;
          setProjects((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    // Também ouve evento customizado de login para recarregar imediatamente
    const handleLoginEvent = () => {
      fetchProjectsFromSupabase();
    };
    window.addEventListener('spine_user_logged_in', handleLoginEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('spine_user_logged_in', handleLoginEvent);
      supabase.removeChannel(channel);
    };
  }, []);

  // Project Actions (Salva no Supabase + Local)
  const addProject = async (newProjData: Omit<Project, 'id'>) => {
    const id = `proj-${Date.now()}`;
    const newProj: Project = {
      ...newProjData,
      id,
      totalTasks: 0,
      completedTasks: 0,
    };

    setProjects((prev) => [newProj, ...prev]);

    const { cleanDescription } = decodeProjectDescription(newProj.description);
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: newProj.colorPalette,
      brandManualUrl: newProj.brandManualUrl,
      logosPackUrl: newProj.logosPackUrl,
      typographyUrl: newProj.typographyUrl,
      additionalMaterialsUrl: newProj.additionalMaterialsUrl,
      kvDriveUrl: newProj.kvDriveUrl,
    });

    // Persiste no Supabase
    try {
      const { error } = await supabase.from('projects').upsert({
        id: newProj.id,
        name: newProj.name,
        category: newProj.category,
        description: packedDescription,
        status: newProj.status,
        progress: newProj.progress,
        current_sprint: newProj.currentSprint,
        icon_type: newProj.iconType,
        icon_color: newProj.iconColor,
        team_member_ids: newProj.teamMemberIds,
        label_id: newProj.labelId,
        label_color: newProj.labelColor,
        logo_url: newProj.logoUrl,
        client_ids: newProj.clientIds,
        client_names: newProj.clientNames,
        client_id: newProj.clientId,
        client_name: newProj.clientName,
        color_palette: newProj.colorPalette,
        brand_manual_url: newProj.brandManualUrl,
        logos_pack_url: newProj.logosPackUrl,
        typography_url: newProj.typographyUrl,
        additional_materials_url: newProj.additionalMaterialsUrl,
      });

      if (error) {
        // Fallback without extra columns if not migrated yet
        await supabase.from('projects').upsert({
          id: newProj.id,
          name: newProj.name,
          category: newProj.category,
          description: packedDescription,
          status: newProj.status,
          progress: newProj.progress,
          current_sprint: newProj.currentSprint,
          icon_type: newProj.iconType,
          icon_color: newProj.iconColor,
          team_member_ids: newProj.teamMemberIds,
          label_id: newProj.labelId,
          label_color: newProj.labelColor,
          logo_url: newProj.logoUrl,
        });
      }
      addToast('Cliente Salvo ☁️', `"${newProj.name}" e materiais gravados com sucesso.`, 'success');
    } catch (sbErr: any) {
      console.warn('Supabase project insert fallback:', sbErr);
    }

    addActivity('Admin', 'AD', `cadastrou o cliente/projeto "${newProj.name}"`, 'purple');
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const existingProj = projects.find((p) => p.id === id);
    const mergedProj: Project = existingProj
      ? { ...existingProj, ...updates }
      : ({ id, ...updates } as Project);

    setProjects((prev) =>
      prev.map((proj) => (proj.id === id ? mergedProj : proj))
    );

    // Salva imediatamente no localStorage para não perder em refresh
    try {
      const updatedList = projects.map((proj) => (proj.id === id ? mergedProj : proj));
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedList));
    } catch {}

    const { cleanDescription } = decodeProjectDescription(mergedProj.description || '');
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: mergedProj.colorPalette,
      brandManualUrl: mergedProj.brandManualUrl,
      logosPackUrl: mergedProj.logosPackUrl,
      typographyUrl: mergedProj.typographyUrl,
      additionalMaterialsUrl: mergedProj.additionalMaterialsUrl,
      kvDriveUrl: mergedProj.kvDriveUrl,
      kvDriveItems: mergedProj.kvDriveItems,
    });

    // Atualiza no Supabase
    try {
      const payload: any = { id };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.category !== undefined) payload.category = updates.category;
      payload.description = packedDescription;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.progress !== undefined) payload.progress = updates.progress;
      if (updates.currentSprint !== undefined) payload.current_sprint = updates.currentSprint;
      if (updates.iconType !== undefined) payload.icon_type = updates.iconType;
      if (updates.iconColor !== undefined) payload.icon_color = updates.iconColor;
      if (updates.teamMemberIds !== undefined) payload.team_member_ids = updates.teamMemberIds;
      if (updates.labelId !== undefined) payload.label_id = updates.labelId;
      if (updates.labelColor !== undefined) payload.label_color = updates.labelColor;
      if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
      if (updates.clientIds !== undefined) payload.client_ids = updates.clientIds;
      if (updates.clientNames !== undefined) payload.client_names = updates.clientNames;
      if (updates.clientId !== undefined) payload.client_id = updates.clientId;
      if (updates.clientName !== undefined) payload.client_name = updates.clientName;
      if (updates.colorPalette !== undefined) payload.color_palette = updates.colorPalette;
      if (updates.brandManualUrl !== undefined) payload.brand_manual_url = updates.brandManualUrl;
      if (updates.logosPackUrl !== undefined) payload.logos_pack_url = updates.logosPackUrl;
      if (updates.typographyUrl !== undefined) payload.typography_url = updates.typographyUrl;
      if (updates.additionalMaterialsUrl !== undefined) payload.additional_materials_url = updates.additionalMaterialsUrl;
      if (updates.kvDriveUrl !== undefined) payload.kv_drive_url = updates.kvDriveUrl;

      const { error } = await supabase.from('projects').upsert(payload);
      if (error) {
        // Fallback without dynamic columns
        delete payload.color_palette;
        delete payload.brand_manual_url;
        delete payload.logos_pack_url;
        delete payload.typography_url;
        delete payload.additional_materials_url;
        delete payload.kv_drive_url;
        await supabase.from('projects').upsert(payload);
      }
    } catch (sbErr) {
      console.warn('Supabase project update warning:', sbErr);
    }

    addToast('Cliente Atualizado', 'Alterações e materiais salvos com sucesso.');
  };

  const deleteProject = async (id: string) => {
    const projToDelete = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));

    // Remove do Supabase
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase project delete warning:', sbErr);
    }

    addToast('Cliente / Projeto Excluído', `Removido "${projToDelete?.name || 'cliente'}".`, 'info');
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        addProject,
        updateProject,
        deleteProject,
        setProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};
