import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeHub } from '../lib/realtimeHub';
import { Project, BrandColor } from '../types';
import { INITIAL_PROJECTS } from '../data/mockData';

export interface BrandMeta {
  colorPalette?: BrandColor[];
  brandManualUrl?: string;
  logosPackUrl?: string;
  typographyUrl?: string;
  additionalMaterialsUrl?: string;
  tarjasUrl?: string;
  psdBaseUrl?: string;
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
    Boolean(brand.tarjasUrl) ||
    Boolean(brand.psdBaseUrl) ||
    Boolean(brand.kvDriveUrl) ||
    (brand.kvDriveItems && brand.kvDriveItems.length > 0);

  if (!hasMeta) return cleanDesc;
  const metaJson = JSON.stringify({
    colorPalette: brand.colorPalette || [],
    brandManualUrl: brand.brandManualUrl || '',
    logosPackUrl: brand.logosPackUrl || '',
    typographyUrl: brand.typographyUrl || '',
    additionalMaterialsUrl: brand.additionalMaterialsUrl || '',
    tarjasUrl: brand.tarjasUrl || '',
    psdBaseUrl: brand.psdBaseUrl || '',
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
    } catch (err) {}
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
    const safeParse = (val: any, fallback: any) => {
      let parsed = fallback;
      if (Array.isArray(val)) parsed = val;
      else if (typeof val === 'string') {
        try { parsed = JSON.parse(val); } catch { parsed = fallback; }
      }
      return (Array.isArray(parsed) && parsed.length > 0) ? parsed : fallback;
    };

    return {
      id: row.id,
      name: row.name || 'Cliente Sem Nome',
      category: row.category || 'General',
      description: cleanDescription || '',
      clientId: row.client_id,
      clientName: row.client_name,
      clientIds: safeParse(row.client_ids, []),
      clientNames: safeParse(row.client_names, []),
      status: (row.status as any) || 'active',
      progress: Number(row.progress ?? 0),
      currentSprint: row.current_sprint || 'Sprint Ativa',
      iconType: (row.icon_type as any) || 'rocket',
      iconColor: row.icon_color || '#10B981',
      teamMemberIds: safeParse(row.team_member_ids, []),
      totalTasks: 0,
      completedTasks: 0,
      labelId: row.label_id,
      labelColor: row.label_color,
      logoUrl: row.logo_url,
      colorPalette: safeParse(row.color_palette, brandMeta.colorPalette || []),
      brandManualUrl: row.brand_manual_url || brandMeta.brandManualUrl,
      logosPackUrl: row.logos_pack_url || brandMeta.logosPackUrl,
      typographyUrl: row.typography_url || brandMeta.typographyUrl,
      additionalMaterialsUrl: row.additional_materials_url || brandMeta.additionalMaterialsUrl,
      tarjasUrl: row.tarjas_url || brandMeta.tarjasUrl,
      psdBaseUrl: row.psd_base_url || brandMeta.psdBaseUrl,
      kvDriveUrl: row.kv_drive_url || brandMeta.kvDriveUrl,
      kvDriveItems: safeParse(row.kv_drive_items, brandMeta.kvDriveItems || []),
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
    } catch (err) {}
    return INITIAL_PROJECTS;
  });

  // Salva no LocalStorage sempre que os projetos mudarem
  useEffect(() => {
    try {
      if (projects && projects.length > 0) {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      }
    } catch (err) {}
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
            } catch (err) {}
          } else {
            console.warn('[Supabase] Array vazio retornado para projetos (possível bloqueio por RLS). Mantendo cache local.');
          }
        }
      } catch (err) {
        console.error('[Supabase] Falha de conexão ao carregar projetos:', err);
      }
    };

    fetchProjectsFromSupabase();

    // Inscrição Realtime compartilhada para novos projetos, atualizações e exclusões
    const unsubscribe = realtimeHub.subscribe('projects', (payload) => {
      if (!isMounted) return;
      if (payload.eventType === 'INSERT' && payload.new) {
        if (isSystemProject(payload.new)) return;
        const newProj = mapRowToProject(payload.new);
        setProjects((prev) => {
          if (prev.some((p) => p.id === newProj.id)) return prev;
          return [...prev, newProj].sort((a, b) => a.name.localeCompare(b.name));
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        if (isSystemProject(payload.new)) {
          // Se virou system, remove da lista de clientes
          setProjects((prev) => prev.filter((p) => p.id !== payload.new.id));
          return;
        }
        const updatedProj = mapRowToProject(payload.new);
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProj.id ? { ...p, ...updatedProj } : p))
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        const deletedId = (payload.old as any).id;
        setProjects((prev) => prev.filter((p) => p.id !== deletedId));
      }
    });

    // Também ouve evento customizado de login para recarregar imediatamente
    const handleLoginEvent = () => {
      fetchProjectsFromSupabase();
    };
    window.addEventListener('spine_user_logged_in', handleLoginEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('spine_user_logged_in', handleLoginEvent);
      unsubscribe();
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
      tarjasUrl: newProj.tarjasUrl,
      psdBaseUrl: newProj.psdBaseUrl,
      kvDriveUrl: newProj.kvDriveUrl,
    });

    // Persiste no Supabase
    try {
      const basePayload: any = {
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
      };

      const extendedPayload: any = {
        ...basePayload,
        color_palette: newProj.colorPalette,
        brand_manual_url: newProj.brandManualUrl,
        logos_pack_url: newProj.logosPackUrl,
        typography_url: newProj.typographyUrl,
        additional_materials_url: newProj.additionalMaterialsUrl,
      };

      const { error } = await supabase.from('projects').upsert(extendedPayload);

      if (error) {
        // Fallback without extra columns if not migrated yet
        await supabase.from('projects').upsert(basePayload);
      }
      addToast('Cliente Salvo ☁️', `"${newProj.name}" e materiais gravados com sucesso.`, 'success');
    } catch (sbErr: any) {
      console.warn('Supabase project insert fallback:', sbErr);
    }

    addActivity('Admin', 'AD', `cadastrou o cliente/projeto "${newProj.name}"`, 'purple');
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    let mergedProj: Project;
    setProjects((prev) => {
      const existingProj = prev.find((p) => p.id === id);
      mergedProj = existingProj
        ? { ...existingProj, ...updates }
        : ({ id, ...updates } as Project);
      const updatedList = prev.map((proj) => (proj.id === id ? mergedProj : proj));
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedList));
      } catch (err) {}
      return updatedList;
    });

    const existingProj = projects.find((p) => p.id === id);
    mergedProj = existingProj
      ? { ...existingProj, ...updates }
      : ({ id, ...updates } as Project);

    const { cleanDescription } = decodeProjectDescription(mergedProj.description || '');
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: mergedProj.colorPalette,
      brandManualUrl: mergedProj.brandManualUrl,
      logosPackUrl: mergedProj.logosPackUrl,
      typographyUrl: mergedProj.typographyUrl,
      additionalMaterialsUrl: mergedProj.additionalMaterialsUrl,
      tarjasUrl: mergedProj.tarjasUrl,
      psdBaseUrl: mergedProj.psdBaseUrl,
      kvDriveUrl: mergedProj.kvDriveUrl,
      kvDriveItems: mergedProj.kvDriveItems,
    });

    // Atualiza no Supabase
    try {
      const updateData: any = {
        description: packedDescription,
      };
      if (mergedProj.name !== undefined) updateData.name = mergedProj.name;
      if (mergedProj.category !== undefined) updateData.category = mergedProj.category;
      if (mergedProj.status !== undefined) updateData.status = mergedProj.status;
      if (mergedProj.progress !== undefined) updateData.progress = mergedProj.progress;
      if (mergedProj.currentSprint !== undefined) updateData.current_sprint = mergedProj.currentSprint;
      if (mergedProj.iconType !== undefined) updateData.icon_type = mergedProj.iconType;
      if (mergedProj.iconColor !== undefined) updateData.icon_color = mergedProj.iconColor;
      if (mergedProj.teamMemberIds !== undefined) updateData.team_member_ids = mergedProj.teamMemberIds;
      if (mergedProj.labelId !== undefined) updateData.label_id = mergedProj.labelId;
      if (mergedProj.labelColor !== undefined) updateData.label_color = mergedProj.labelColor;
      if (mergedProj.logoUrl !== undefined) updateData.logo_url = mergedProj.logoUrl;
      if (mergedProj.clientIds !== undefined) updateData.client_ids = mergedProj.clientIds;
      if (mergedProj.clientNames !== undefined) updateData.client_names = mergedProj.clientNames;
      if (mergedProj.clientId !== undefined) updateData.client_id = mergedProj.clientId;
      if (mergedProj.clientName !== undefined) updateData.client_name = mergedProj.clientName;
      if (mergedProj.colorPalette !== undefined) updateData.color_palette = mergedProj.colorPalette;
      if (mergedProj.brandManualUrl !== undefined) updateData.brand_manual_url = mergedProj.brandManualUrl;
      if (mergedProj.logosPackUrl !== undefined) updateData.logos_pack_url = mergedProj.logosPackUrl;
      if (mergedProj.typographyUrl !== undefined) updateData.typography_url = mergedProj.typographyUrl;
      if (mergedProj.additionalMaterialsUrl !== undefined) updateData.additional_materials_url = mergedProj.additionalMaterialsUrl;

      const { error: updateErr } = await supabase.from('projects').update(updateData).eq('id', id);
      if (updateErr) {
        console.warn('[Supabase] Falha no update detalhado, tentando apenas colunas base:', updateErr.message);
        // Fallback apenas com description e campos base
        const fallbackData: any = {
          description: packedDescription,
        };
        if (mergedProj.name !== undefined) fallbackData.name = mergedProj.name;
        if (mergedProj.category !== undefined) fallbackData.category = mergedProj.category;
        if (mergedProj.status !== undefined) fallbackData.status = mergedProj.status;
        if (mergedProj.progress !== undefined) fallbackData.progress = mergedProj.progress;
        if (mergedProj.logoUrl !== undefined) fallbackData.logo_url = mergedProj.logoUrl;
        await supabase.from('projects').update(fallbackData).eq('id', id);
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
