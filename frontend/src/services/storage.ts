// localStorage data layer for PickerWheelApp
// All data persists in the browser — no backend needed.

const STORAGE_KEY = 'pickerWheelData';

export interface Student {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  students: Student[];
}

// Record of a single spin
export interface SpinRecord {
  entryId: string;
  entryName: string;     // snapshot at spin time
  timestamp: number;
  removedFromPool: boolean;
}

export interface Session {
  id: string;
  classId: string;
  name?: string;
  eligible: string[];    // student IDs in pool
  picked: string[];      // student IDs picked (ordered)
  history: SpinRecord[];
  mode: 'remove' | 'keep';
  createdAt: string;
  lastSpinAt?: string;
}

export interface QuickSpinItem {
  id: string;
  name: string;
}

export interface QuickSpin {
  items: QuickSpinItem[];
  eligible: string[];    // item IDs in pool
  picked: string[];      // item IDs picked (ordered)
  history: SpinRecord[];
  mode: 'remove' | 'keep';
}

export interface AppData {
  classes: Class[];
  sessions: Session[];
  quickSpin?: QuickSpin;
}

function genId(): string {
  return crypto.randomUUID();
}

/** Cryptographically secure random index in [0, length).
 *  Uses Web Crypto API; modulo bias is negligible for classroom-sized lists. */
export function secureRandomIndex(length: number): number {
  if (length <= 0) return 0;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}

const DEFAULT_QUICK_SPIN_NAMES = ['Abby', 'Bess', 'Collin', 'Della', 'Emmett', 'Finn', 'Greer', 'Holly'];

function makeQuickSpin(names: string[]): QuickSpin {
  const items = names.map(name => ({ id: genId(), name }));
  return { items, eligible: items.map(i => i.id), picked: [], history: [], mode: 'remove' };
}

// Migrate old data formats
function migrateData(data: AppData): AppData {
  // Migrate projects → sessions
  const raw = data as unknown as Record<string, unknown>;
  if ('projects' in raw && !('sessions' in raw)) {
    const projects = raw.projects as Array<Record<string, unknown>>;
    (data as AppData).sessions = projects.map(p => ({
      id: p.id as string,
      classId: p.classId as string,
      name: (p.title as string) || undefined,
      eligible: (p.eligible ?? p.pickable ?? []) as string[],
      picked: (p.picked ?? []) as string[],
      history: (p.history ?? []) as SpinRecord[],
      mode: (p.mode as 'remove' | 'keep') || 'remove',
      createdAt: (p.createdAt as string) || new Date().toISOString(),
      lastSpinAt: undefined,
    }));
    delete raw.projects;
  }

  // Ensure sessions array exists
  if (!data.sessions) data.sessions = [];

  // Migrate individual sessions
  for (const session of data.sessions) {
    const s = session as unknown as Record<string, unknown>;
    // Rename pickable → eligible
    if ('pickable' in s && !('eligible' in s)) {
      session.eligible = s.pickable as string[];
      delete s.pickable;
    }
    // Rename title → name
    if ('title' in s && !('name' in s)) {
      session.name = s.title as string;
      delete s.title;
    }
    if (!session.history) session.history = [];
    if (!session.mode) session.mode = 'remove';
  }

  // Migrate quickSpin
  if (data.quickSpin) {
    const qs = data.quickSpin as unknown as Record<string, unknown>;
    if ('pickable' in qs && !('eligible' in qs)) {
      data.quickSpin!.eligible = qs.pickable as string[];
      delete qs.pickable;
    }
    if (!data.quickSpin!.history) data.quickSpin!.history = [];
    if (!data.quickSpin!.mode) data.quickSpin!.mode = 'remove';
  }
  return data;
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let data = JSON.parse(raw) as AppData;
      data = migrateData(data);
      if (!data.quickSpin) {
        data.quickSpin = makeQuickSpin(DEFAULT_QUICK_SPIN_NAMES);
      }
      return data;
    }
  } catch { /* corrupted data — start fresh */ }
  return { classes: [], sessions: [], quickSpin: makeQuickSpin(DEFAULT_QUICK_SPIN_NAMES) };
}

function save(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Class CRUD ──────────────────────────────────────────

export function getClasses(): Class[] {
  return load().classes;
}

export function getClass(id: string): Class | undefined {
  return load().classes.find(c => c.id === id);
}

export function createClass(name: string): Class {
  const data = load();
  const cls: Class = { id: genId(), name, students: [] };
  data.classes.push(cls);
  save(data);
  return cls;
}

export function updateClassName(id: string, name: string): void {
  const data = load();
  const cls = data.classes.find(c => c.id === id);
  if (cls) { cls.name = name; save(data); }
}

export function deleteClass(id: string): void {
  const data = load();
  data.classes = data.classes.filter(c => c.id !== id);
  data.sessions = data.sessions.filter(s => s.classId !== id);
  save(data);
}

// ─── Student CRUD (within a class) ──────────────────────

export function addStudent(classId: string, name: string): Student {
  const data = load();
  const cls = data.classes.find(c => c.id === classId);
  if (!cls) throw new Error('Class not found');
  const student: Student = { id: genId(), name };
  cls.students.push(student);
  save(data);
  return student;
}

export function addStudentsBulk(classId: string, names: string[]): Student[] {
  const data = load();
  const cls = data.classes.find(c => c.id === classId);
  if (!cls) throw new Error('Class not found');
  const added: Student[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed) {
      const student: Student = { id: genId(), name: trimmed };
      cls.students.push(student);
      added.push(student);
    }
  }
  save(data);
  return added;
}

export function updateStudentName(classId: string, studentId: string, name: string): void {
  const data = load();
  const cls = data.classes.find(c => c.id === classId);
  if (!cls) return;
  const student = cls.students.find(s => s.id === studentId);
  if (student) { student.name = name; save(data); }
}

export function deleteStudent(classId: string, studentId: string): void {
  const data = load();
  const cls = data.classes.find(c => c.id === classId);
  if (!cls) return;
  cls.students = cls.students.filter(s => s.id !== studentId);
  for (const session of data.sessions) {
    if (session.classId === classId) {
      session.eligible = session.eligible.filter(id => id !== studentId);
      session.picked = session.picked.filter(id => id !== studentId);
    }
  }
  save(data);
}

// ─── Session CRUD ────────────────────────────────────────

export function getSessions(): Session[] {
  return load().sessions;
}

export function getSessionsForClass(classId: string, limit = 10): Session[] {
  return load().sessions
    .filter(s => s.classId === classId)
    .sort((a, b) => {
      const aTime = a.lastSpinAt || a.createdAt;
      const bTime = b.lastSpinAt || b.createdAt;
      return bTime.localeCompare(aTime);
    })
    .slice(0, limit);
}

export function getSession(id: string): Session | undefined {
  return load().sessions.find(s => s.id === id);
}

export function getLatestSessionForClass(classId: string): Session | undefined {
  return getSessionsForClass(classId, 1)[0];
}

export function createSessionWithState(
  classId: string,
  eligible: string[],
  picked: string[],
  history: SpinRecord[],
  mode: 'remove' | 'keep',
  name?: string,
): Session {
  const data = load();
  const session: Session = {
    id: genId(),
    classId,
    name,
    eligible,
    picked,
    history,
    mode,
    createdAt: new Date().toISOString(),
    lastSpinAt: history.length > 0 ? new Date().toISOString() : undefined,
  };
  data.sessions.push(session);
  save(data);
  return session;
}

export function deleteSession(id: string): void {
  const data = load();
  data.sessions = data.sessions.filter(s => s.id !== id);
  save(data);
}

export function renameSession(id: string, name: string): void {
  const data = load();
  const session = data.sessions.find(s => s.id === id);
  if (session) {
    session.name = name || undefined;
    save(data);
  }
}

// ─── Deferred Spin (read-only pick + apply) ─────────────

// Read-only: pick random eligible entry, return SpinRecord WITHOUT mutating storage
export function pickRandomFromSession(sessionId: string): SpinRecord | null {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session || session.eligible.length === 0) return null;

  const cls = data.classes.find(c => c.id === session.classId);
  const idx = secureRandomIndex(session.eligible.length);
  const winnerId = session.eligible[idx];
  const winnerName = cls?.students.find(s => s.id === winnerId)?.name ?? '(unknown)';

  return {
    entryId: winnerId,
    entryName: winnerName,
    timestamp: Date.now(),
    removedFromPool: false, // decided by winner dialog
  };
}

export function pickRandomFromQuickSpin(): SpinRecord | null {
  const data = load();
  const qs = data.quickSpin!;
  if (qs.eligible.length === 0) return null;

  const idx = secureRandomIndex(qs.eligible.length);
  const winnerId = qs.eligible[idx];
  const winnerName = qs.items.find(i => i.id === winnerId)?.name ?? '(unknown)';

  return {
    entryId: winnerId,
    entryName: winnerName,
    timestamp: Date.now(),
    removedFromPool: false, // decided by winner dialog
  };
}

// Read-only: pick from a draft session (in-memory eligible list, class for names)
export function pickRandomFromDraft(
  classId: string,
  eligible: string[],
): SpinRecord | null {
  if (eligible.length === 0) return null;

  const cls = getClass(classId);
  const idx = secureRandomIndex(eligible.length);
  const winnerId = eligible[idx];
  const winnerName = cls?.students.find(s => s.id === winnerId)?.name ?? '(unknown)';

  return {
    entryId: winnerId,
    entryName: winnerName,
    timestamp: Date.now(),
    removedFromPool: false, // decided by winner dialog
  };
}

// Write: apply the pick AFTER animation completes
export function applySessionPick(sessionId: string, record: SpinRecord): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;

  if (record.removedFromPool) {
    session.eligible = session.eligible.filter(id => id !== record.entryId);
    session.picked.push(record.entryId);
  }
  session.history.push(record);
  session.lastSpinAt = new Date().toISOString();
  save(data);
}

export function applyQuickSpinPick(record: SpinRecord): void {
  const data = load();
  const qs = data.quickSpin!;

  if (record.removedFromPool) {
    qs.eligible = qs.eligible.filter(id => id !== record.entryId);
    qs.picked.push(record.entryId);
  }
  qs.history.push(record);
  save(data);
}

// ─── Session operations ─────────────────────────────────

export function resetSession(sessionId: string): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;
  session.eligible = [...session.eligible, ...session.picked.filter(id => !session.eligible.includes(id))];
  session.picked = [];
  session.history = [];
  save(data);
}

export function sessionMoveBackToEligible(sessionId: string, studentId: string): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;
  session.picked = session.picked.filter(id => id !== studentId);
  if (!session.eligible.includes(studentId)) {
    session.eligible.push(studentId);
  }
  save(data);
}

export function sessionRemoveFromEligible(sessionId: string, studentId: string): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;
  session.eligible = session.eligible.filter(id => id !== studentId);
  save(data);
}

export function setSessionMode(sessionId: string, mode: 'remove' | 'keep'): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;
  session.mode = mode;
  save(data);
}

export function undoSessionSpin(sessionId: string, record: SpinRecord): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;
  const pickedIdx = session.picked.lastIndexOf(record.entryId);
  if (pickedIdx !== -1) session.picked.splice(pickedIdx, 1);
  if (record.removedFromPool && !session.eligible.includes(record.entryId)) {
    session.eligible.push(record.entryId);
  }
  const histIdx = session.history.findIndex(h => h.timestamp === record.timestamp && h.entryId === record.entryId);
  if (histIdx !== -1) session.history.splice(histIdx, 1);
  save(data);
}

export function restoreSessionState(sessionId: string, eligible: string[], picked: string[], history: SpinRecord[]): void {
  const data = load();
  const session = data.sessions.find(s => s.id === sessionId);
  if (!session) return;
  session.eligible = eligible;
  session.picked = picked;
  session.history = history;
  save(data);
}

// ─── Quick Spin ──────────────────────────────────────────

export function getQuickSpin(): QuickSpin {
  return load().quickSpin!;
}

export function setQuickSpinNames(names: string[]): void {
  const data = load();
  const existing = data.quickSpin!;
  // ID reconciliation: positional matching
  const newItems: QuickSpinItem[] = [];
  const filteredNames = names.filter(n => n.trim());
  for (let i = 0; i < filteredNames.length; i++) {
    const name = filteredNames[i].trim();
    if (i < existing.items.length && existing.items[i].name === name) {
      newItems.push(existing.items[i]);
    } else {
      newItems.push({ id: genId(), name });
    }
  }
  data.quickSpin = {
    items: newItems,
    eligible: newItems.map(i => i.id),
    picked: [],
    history: [],
    mode: existing.mode,
  };
  save(data);
}

export function quickSpinReset(): void {
  const data = load();
  const qs = data.quickSpin!;
  qs.eligible = [...qs.eligible, ...qs.picked.filter(id => !qs.eligible.includes(id))];
  qs.picked = [];
  qs.history = [];
  save(data);
}

export function quickSpinMoveBack(itemId: string): void {
  const data = load();
  const qs = data.quickSpin!;
  qs.picked = qs.picked.filter(id => id !== itemId);
  if (!qs.eligible.includes(itemId)) {
    qs.eligible.push(itemId);
  }
  save(data);
}

export function quickSpinRemove(itemId: string): void {
  const data = load();
  const qs = data.quickSpin!;
  qs.eligible = qs.eligible.filter(id => id !== itemId);
  qs.picked = qs.picked.filter(id => id !== itemId);
  qs.items = qs.items.filter(i => i.id !== itemId);
  save(data);
}

export function setQuickSpinMode(mode: 'remove' | 'keep'): void {
  const data = load();
  data.quickSpin!.mode = mode;
  save(data);
}

export function undoQuickSpin(record: SpinRecord): void {
  const data = load();
  const qs = data.quickSpin!;
  const pickedIdx = qs.picked.lastIndexOf(record.entryId);
  if (pickedIdx !== -1) qs.picked.splice(pickedIdx, 1);
  if (record.removedFromPool && !qs.eligible.includes(record.entryId)) {
    qs.eligible.push(record.entryId);
  }
  const histIdx = qs.history.findIndex(h => h.timestamp === record.timestamp && h.entryId === record.entryId);
  if (histIdx !== -1) qs.history.splice(histIdx, 1);
  save(data);
}

export function restoreQuickSpinState(eligible: string[], picked: string[], history: SpinRecord[]): void {
  const data = load();
  data.quickSpin!.eligible = eligible;
  data.quickSpin!.picked = picked;
  data.quickSpin!.history = history;
  save(data);
}

export function resolveQuickSpinNames(ids: string[]): { id: string; name: string }[] {
  const qs = getQuickSpin();
  return ids.map(id => {
    const item = qs.items.find(i => i.id === id);
    return { id, name: item?.name ?? '(removed)' };
  });
}

// ─── Helpers ─────────────────────────────────────────────

export function resolveNames(classId: string, studentIds: string[]): { id: string; name: string }[] {
  const cls = getClass(classId);
  if (!cls) return [];
  return studentIds.map(id => {
    const student = cls.students.find(s => s.id === id);
    return { id, name: student?.name ?? '(removed)' };
  });
}

// ─── Export / Import ─────────────────────────────────────

export function exportData(): string {
  return JSON.stringify(load(), null, 2);
}

export function importData(json: string): void {
  let data = JSON.parse(json) as AppData;
  data = migrateData(data);
  if (!Array.isArray(data.classes) || !Array.isArray(data.sessions)) {
    throw new Error('Invalid data format');
  }
  save(data);
}
