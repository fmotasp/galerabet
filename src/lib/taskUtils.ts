import { Task } from '../types';
import { CurrentUserType } from '../context/AuthContext';

/**
 * Verifica se uma tarefa está atribuída ao usuário atual através de múltiplos critérios:
 * 1. Flag isMine
 * 2. Assignee direto (ID, employeeId, trelloMemberId, nome, username, prefixo de email, iniciais)
 * 3. Lista de membros da tarefa
 * 4. Metadados do Trello (idMembers se presentes na tarefa)
 * 5. Nome da lista/coluna do Trello (coluna nominal)
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
  const myTrelloId = (currentUser.trelloMemberId || '').toLowerCase().trim();

  // 1. Direct assignee check
  if (task.assigneeId) {
    const aId = task.assigneeId.toString().toLowerCase().trim();
    if (myId && aId === myId) return true;
    if (myEmployeeId && aId === myEmployeeId) return true;
    if (myTrelloId && aId === myTrelloId) return true;
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
      if (myTrelloId && mId === myTrelloId) return true;

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

  // 3. Trello idMembers if present
  const trelloMembers = (task as any).idMembers;
  if (trelloMembers && Array.isArray(trelloMembers)) {
    if (myTrelloId && trelloMembers.includes(myTrelloId)) return true;
    if (myId && trelloMembers.includes(myId)) return true;
  }

  // 4. Trello List Name (coluna nominal no Trello)
  if (task.trelloListName) {
    const lName = task.trelloListName.toLowerCase();
    if (
      (myFirstName && myFirstName.length > 2 && lName.includes(myFirstName)) ||
      (myEmailPrefix && myEmailPrefix.length > 2 && lName.includes(myEmailPrefix)) ||
      (myFirstName === 'bismarques' && lName.includes('marques')) ||
      (myFirstName === 'gerdson' && lName.includes('gerdeson')) ||
      (myFirstName === 'felipe' && (lName.includes('fmota') || lName.includes('mota'))) ||
      (myFirstName === 'daiane' && lName.includes('dai'))
    ) {
      return true;
    }
  }

  return false;
};
