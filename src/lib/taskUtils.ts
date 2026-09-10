import { Task } from '../types';
import { CurrentUserType } from '../context/AuthContext';

/**
 * Verifica se uma tarefa está atribuída ao usuário atual através dos seguintes critérios:
 * 1. Flag isMine
 * 2. Assignee direto (ID, employeeId, nome, username, prefixo de email, iniciais)
 * 3. Lista de membros da tarefa
 */
export const isTaskAssignedToMe = (
  task: Task,
  currentUser: CurrentUserType | null | undefined
): boolean => {
  if (!currentUser) return false;
  if (task.isMine) return true;

  const myId = (currentUser.id || '').toString().toLowerCase().trim();
  const myEmployeeId = (currentUser.employeeId || '').toString().toLowerCase().trim();
  const myName = (currentUser.name || '').toLowerCase().trim();
  const myFirstName = myName.split(' ')[0].trim();
  const myUsername = (currentUser.username || '').toLowerCase().trim();
  const myEmailPrefix = (currentUser.email || '').split('@')[0].toLowerCase().trim();
  const myInitials = (currentUser.initials || '').toUpperCase().trim();

  // 1. Direct assignee check
  if (task.assigneeId) {
    const aId = task.assigneeId.toString().toLowerCase().trim();
    if (myId && aId === myId) return true;
    if (myEmployeeId && aId === myEmployeeId) return true;
  }

  if (task.assigneeName) {
    const aName = task.assigneeName.toLowerCase().trim();
    if (myName && (aName.includes(myName) || myName.includes(aName))) return true;
    if (myFirstName && myFirstName.length > 2 && (aName.includes(myFirstName) || myFirstName.includes(aName))) return true;
    if (myUsername && (aName.includes(myUsername) || myUsername.includes(aName))) return true;
    if (myEmailPrefix && (aName.includes(myEmailPrefix) || myEmailPrefix.includes(aName))) return true;
  }

  if (myInitials && task.assigneeInitials && task.assigneeInitials.toUpperCase().trim() === myInitials) {
    return true;
  }

  // 2. Members list check (onde o usuário está como membro da tarefa)
  if (task.members && task.members.length > 0) {
    const isMemberMatch = task.members.some((m) => {
      const mId = (m.id || '').toString().toLowerCase().trim();
      if (myId && mId === myId) return true;
      if (myEmployeeId && mId === myEmployeeId) return true;

      const mName = (m.name || '').toLowerCase().trim();
      if (myName && (mName.includes(myName) || myName.includes(mName))) return true;
      if (myFirstName && myFirstName.length > 2 && (mName.includes(myFirstName) || myFirstName.includes(mName))) return true;
      if (myUsername && (mName.includes(myUsername) || myUsername.includes(mName))) return true;

      const mInitials = (m.initials || '').toUpperCase().trim();
      if (myInitials && mInitials === myInitials) return true;

      return false;
    });
    if (isMemberMatch) return true;
  }

  return false;
};

/**
 * Helper para identificar colaboradores exclusivos de Design e Audiovisual/Vídeo (Designers e Videomakers)
 */
export const isDesignerOrVideomaker = (emp: {
  role?: string;
  department?: string;
  tags?: string[];
}): boolean => {
  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();
  const tags = (emp.tags || []).map((t) => t.toLowerCase());

  // Excluir expressamente Marketing, Social Media, Conteúdo se não tiver menção a Design/Vídeo
  const isMarketingOrOther =
    (role.includes('marketing') ||
      dept.includes('marketing') ||
      role.includes('social media') ||
      dept.includes('social media') ||
      role.includes('conteúdo') ||
      role.includes('conteudo') ||
      dept.includes('conteúdo') ||
      dept.includes('conteudo') ||
      role.includes('redator') ||
      role.includes('copywriter')) &&
    !role.includes('design') &&
    !role.includes('video') &&
    !role.includes('vídeo') &&
    !role.includes('audiovisual');

  if (isMarketingOrOther) return false;

  const matchesDesign =
    role.includes('design') ||
    dept.includes('design') ||
    tags.some((t) => t.includes('design'));

  const matchesVideo =
    role.includes('video') ||
    role.includes('vídeo') ||
    role.includes('audiovisual') ||
    role.includes('audio visual') ||
    role.includes('videomaker') ||
    role.includes('video maker') ||
    role.includes('motion') ||
    role.includes('editor') ||
    role.includes('filmmaker') ||
    dept.includes('video') ||
    dept.includes('vídeo') ||
    dept.includes('audiovisual') ||
    tags.some((t) => t.includes('video') || t.includes('audio') || t.includes('motion'));

  return matchesDesign || matchesVideo;
};

export const encodeTaskDescriptionWithChecklist = (
  description: string = '',
  checklists: { id: string; title: string; completed: boolean }[] = []
): string => {
  const cleanDesc = (description || '').replace(/\n?<!-- __TASK_CHECKLIST__[\s\S]*?-->/g, '').trim();
  if (!checklists || checklists.length === 0) return cleanDesc;
  const json = JSON.stringify(checklists);
  return `${cleanDesc}\n<!-- __TASK_CHECKLIST__ ${json} -->`.trim();
};

export const decodeTaskDescriptionWithChecklist = (
  rawDescription: string = ''
): { cleanDescription: string; checklists: { id: string; title: string; completed: boolean }[] } => {
  if (!rawDescription) return { cleanDescription: '', checklists: [] };
  const match = rawDescription.match(/<!-- __TASK_CHECKLIST__ ([\s\S]*?) -->/);
  let checklists: { id: string; title: string; completed: boolean }[] = [];
  let cleanDescription = rawDescription;

  if (match && match[1]) {
    try {
      checklists = JSON.parse(match[1]);
      cleanDescription = rawDescription.replace(match[0], '').trim();
    } catch {}
  }

  return { cleanDescription, checklists };
};

export const encodeEmployeeLocationWithAvatar = (
  location: string = 'Brasil',
  avatarUrl: string = ''
): string => {
  const cleanLoc = (location || 'Brasil').replace(/\n?<!-- __AVATAR_URL__[\s\S]*?-->/g, '').trim() || 'Brasil';
  if (!avatarUrl) return cleanLoc;
  return `${cleanLoc}\n<!-- __AVATAR_URL__ ${avatarUrl.trim()} -->`.trim();
};

export const decodeEmployeeLocationWithAvatar = (
  rawLocation: string = ''
): { cleanLocation: string; avatarUrl: string } => {
  if (!rawLocation) return { cleanLocation: 'Brasil', avatarUrl: '' };
  const match = rawLocation.match(/<!-- __AVATAR_URL__ ([\s\S]*?) -->/);
  let avatarUrl = '';
  let cleanLocation = rawLocation;

  if (match && match[1]) {
    avatarUrl = match[1].trim();
    cleanLocation = rawLocation.replace(match[0], '').trim() || 'Brasil';
  }

  return { cleanLocation, avatarUrl };
};

