const MONTH_MAP: Record<string, number> = {
  jan: 0,
  janeiro: 0,
  'jan.': 0,
  january: 0,
  fev: 1,
  fevereiro: 1,
  'fev.': 1,
  feb: 1,
  february: 1,
  mar: 2,
  março: 2,
  marco: 2,
  'mar.': 2,
  march: 2,
  abr: 3,
  abril: 3,
  'abr.': 3,
  apr: 3,
  april: 3,
  mai: 4,
  maio: 4,
  'mai.': 4,
  may: 4,
  jun: 5,
  junho: 5,
  'jun.': 5,
  june: 5,
  jul: 6,
  julho: 6,
  'jul.': 6,
  july: 6,
  ago: 7,
  agosto: 7,
  'ago.': 7,
  aug: 7,
  august: 7,
  set: 8,
  setembro: 8,
  'set.': 8,
  sep: 8,
  sept: 8,
  september: 8,
  out: 9,
  outubro: 9,
  'out.': 9,
  oct: 9,
  october: 9,
  nov: 10,
  novembro: 10,
  'nov.': 10,
  november: 10,
  dez: 11,
  dezembro: 11,
  'dez.': 11,
  dec: 11,
  december: 11,
};

/**
 * Parses any date format (DD/MM/YYYY, YYYY-MM-DD, "02 julho de 2026", "May 12", ISO) into a valid Date object.
 */
export function parseTaskDueDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const str = dateStr.trim().toLowerCase();
  if (
    !str ||
    str === 'sem prazo' ||
    str === 'sem data' ||
    str === 'undefined' ||
    str === 'null' ||
    str === '-'
  ) {
    return null;
  }

  // 1. DD/MM/YYYY or DD/MM/YY
  if (str.includes('/')) {
    const parts = str.split('/').map((p) => parseInt(p.trim(), 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
      const d = new Date(year, parts[1] - 1, parts[0]);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 2. YYYY-MM-DD or DD-MM-YYYY
  if (str.includes('-')) {
    const parts = str.split('-').map((p) => parseInt(p.trim(), 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      if (parts[0] > 1000) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) return d;
      } else {
        const year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
        const d = new Date(year, parts[1] - 1, parts[0]);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  // 3. Text format: e.g. "02 julho de 2026", "2 de julho", "May 12", "12 de maio de 2026"
  const clean = str
    .replace(/\bde\b/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = clean.split(' ');

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  for (const token of tokens) {
    if (MONTH_MAP[token] !== undefined) {
      month = MONTH_MAP[token];
    } else {
      const num = parseInt(token, 10);
      if (!isNaN(num)) {
        if (num > 1000) {
          year = num;
        } else if (!day && num >= 1 && num <= 31) {
          day = num;
        } else if (day && !year && (num >= 20 || num < 100)) {
          year = num < 100 ? 2000 + num : num;
        }
      }
    }
  }

  if (month !== null && day !== null) {
    const finalYear = year || new Date().getFullYear();
    const d = new Date(finalYear, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 4. Standard Date parsing fallback
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d;
  }

  return null;
}

/**
 * Checks if a task is already completed, delivered, or in final approval status.
 */
export function isTaskCompleted(task: { status?: string; deliveredAt?: string }): boolean {
  if (task.deliveredAt && task.deliveredAt.trim() !== '') return true;
  const s = (task.status || '').toLowerCase().trim();
  return (
    s === 'done' ||
    s.includes('concl') ||
    s.includes('final') ||
    s.includes('postad') ||
    s.includes('aprov') ||
    s.includes('entreg')
  );
}

/**
 * Returns how many days overdue a task is relative to referenceDate (default: today).
 * If the task is not overdue or is completed, returns 0.
 */
export function getTaskOverdueDays(
  task: { dueDate?: string; status?: string; deliveredAt?: string },
  referenceDate = new Date()
): number {
  if (isTaskCompleted(task)) return 0;
  if (task.status === 'overdue' && (!task.dueDate || task.dueDate === 'Sem prazo')) return 1;

  const due = parseTaskDueDate(task.dueDate);
  if (!due) return 0;

  const now = new Date(referenceDate);
  now.setHours(0, 0, 0, 0);

  const dueMidnight = new Date(due);
  dueMidnight.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - dueMidnight.getTime();
  if (diffMs > 0) {
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  return 0;
}

/**
 * Returns true if the task is overdue based on its predicted due date compared to today.
 */
export function isTaskOverdue(
  task: { dueDate?: string; status?: string; deliveredAt?: string },
  referenceDate = new Date()
): boolean {
  if (isTaskCompleted(task)) return false;
  if (task.status === 'overdue') return true;
  return getTaskOverdueDays(task, referenceDate) > 0;
}
