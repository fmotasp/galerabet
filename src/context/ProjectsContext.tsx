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
}

export const encodeProjectDescription = (description: string = '', brand: BrandMeta): string => {
  const cleanDesc = (description || '').replace(/\n?<!-- __BRAND_META__[\s\S]*?-->/g, '').trim();
  const hasMeta =
    (brand.colorPalette && brand.colorPalette.length > 0) ||
    Boolean(brand.brandManualUrl) ||
    Boolean(brand.logosPackUrl) ||
    Boolean(brand.typographyUrl) ||
    Boolean(brand.additionalMaterialsUrl);

  if (!hasMeta) return cleanDesc;
  const metaJson = JSON.stringify({
    colorPalette: brand.colorPalette || [],
    brandManualUrl: brand.brandManualUrl || '',
    logosPackUrl: brand.logosPackUrl || '',
    typographyUrl: brand.typographyUrl || '',
    additionalMaterialsUrl: brand.additionalMaterialsUrl || '',
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

const STORAGE_KEYS = {
  PROJECTS: 'spine_projects_v1',
};

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export const ProjectsProvider: React.FC<{
  children: React.ReactNode;
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addActivity: (userName: string, userInitials: string, message: string, dotColor?: any) => void;
}> = ({ children, addToast, addActivity }) => {
  // Projects / Clientes - Hidratação imediata de cache
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROJECTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  // Project Actions (Salva no Supabase + Local)
  const addProject = async (newProjData: Omit<Project, 'id'>) => {
    const id = `proj-${Date.now()}`;
    const newProj: Project = {
      ...newProjData,
      id,
      totalTasks: 0,
      completedTasks: 0,
    };

    setProjects((prev) => {
      const next = [newProj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    const { cleanDescription } = decodeProjectDescription(newProj.description);
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: newProj.colorPalette,
      brandManualUrl: newProj.brandManualUrl,
      logosPackUrl: newProj.logosPackUrl,
      typographyUrl: newProj.typographyUrl,
      additionalMaterialsUrl: newProj.additionalMaterialsUrl,
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
    let updatedMergedProj: Project | null = null;

    setProjects((prev) => {
      const next = prev.map((proj) => {
        if (proj.id === id) {
          const merged = { ...proj, ...updates };
          updatedMergedProj = merged;
          return merged;
        }
        return proj;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    const targetProj = updatedMergedProj || updates;
    const { cleanDescription } = decodeProjectDescription(targetProj.description || '');
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: targetProj.colorPalette,
      brandManualUrl: targetProj.brandManualUrl,
      logosPackUrl: targetProj.logosPackUrl,
      typographyUrl: targetProj.typographyUrl,
      additionalMaterialsUrl: targetProj.additionalMaterialsUrl,
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

      const { error } = await supabase.from('projects').upsert(payload);
      if (error) {
        // Fallback without dynamic columns
        delete payload.color_palette;
        delete payload.brand_manual_url;
        delete payload.logos_pack_url;
        delete payload.typography_url;
        delete payload.additional_materials_url;
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
