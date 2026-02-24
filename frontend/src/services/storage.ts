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

export interface Project {
  id: string;
  classId: string;
  title: string;
  eligible: string[];    // student IDs in pool
  picked: string[];      // student IDs picked (ordered)
  history: SpinRecord[];
  mode: 'remove' | 'keep';
  createdAt: string;
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
  projects: Project[];
  quickSpin?: QuickSpin;
}

function genId(): string {
  return crypto.randomUUID();
}

const DEFAULT_QUICK_SPIN_NAMES = ['Abby', 'Bess', 'Collin', 'Della', 'Emmett', 'Finn', 'Greer', 'Holly'];

function makeQuickSpin(names: string[]): QuickSpin {
  const items = names.map(name => ({ id: genId(), name }));
  return { items, eligible: items.map(i => i.id), picked: [], history: [], mode: 'remove' };
}

// Migrate old data format (pickable → eligible, add history/mode)
function migrateData(data: AppData): AppData {
  // Migrate projects
  for (const project of data.projects) {
    const p = project as unknown as Record<string, unknown>;
    // Rename pickable → eligible
    if ('pickable' in p && !('eligible' in p)) {
      project.eligible = p.pickable as string[];
      delete p.pickable;
    }
    if (!project.history) project.history = [];
    if (!project.mode) project.mode = 'remove';
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
  return { classes: [], projects: [], quickSpin: makeQuickSpin(DEFAULT_QUICK_SPIN_NAMES) };
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
  data.projects = data.projects.filter(p => p.classId !== id);
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
  for (const project of data.projects) {
    if (project.classId === classId) {
      project.eligible = project.eligible.filter(id => id !== studentId);
      project.picked = project.picked.filter(id => id !== studentId);
    }
  }
  save(data);
}

// ─── Project CRUD ────────────────────────────────────────

export function getProjects(): Project[] {
  return load().projects;
}

export function getProjectsForClass(classId: string): Project[] {
  return load().projects.filter(p => p.classId === classId);
}

export function getProject(id: string): Project | undefined {
  return load().projects.find(p => p.id === id);
}

export function createProject(classId: string, title: string): Project {
  const data = load();
  const cls = data.classes.find(c => c.id === classId);
  if (!cls) throw new Error('Class not found');
  const project: Project = {
    id: genId(),
    classId,
    title,
    eligible: cls.students.map(s => s.id),
    picked: [],
    history: [],
    mode: 'remove',
    createdAt: new Date().toISOString(),
  };
  data.projects.push(project);
  save(data);
  return project;
}

export function deleteProject(id: string): void {
  const data = load();
  data.projects = data.projects.filter(p => p.id !== id);
  save(data);
}

// ─── Picker operations (Projects) ────────────────────────

export function spinPick(projectId: string): SpinRecord | null {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project || project.eligible.length === 0) return null;

  const cls = data.classes.find(c => c.id === project.classId);
  const idx = Math.floor(Math.random() * project.eligible.length);
  const winnerId = project.eligible[idx];
  const winnerName = cls?.students.find(s => s.id === winnerId)?.name ?? '(unknown)';

  const record: SpinRecord = {
    entryId: winnerId,
    entryName: winnerName,
    timestamp: Date.now(),
    removedFromPool: project.mode === 'remove',
  };

  if (project.mode === 'remove') {
    project.eligible.splice(idx, 1);
  }
  project.picked.push(winnerId);
  project.history.push(record);
  save(data);
  return record;
}

export function resetProject(projectId: string): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.eligible = [...project.eligible, ...project.picked.filter(id => !project.eligible.includes(id))];
  project.picked = [];
  project.history = [];
  save(data);
}

export function moveBackToEligible(projectId: string, studentId: string): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.picked = project.picked.filter(id => id !== studentId);
  if (!project.eligible.includes(studentId)) {
    project.eligible.push(studentId);
  }
  save(data);
}

export function removeFromEligible(projectId: string, studentId: string): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.eligible = project.eligible.filter(id => id !== studentId);
  save(data);
}

export function setProjectMode(projectId: string, mode: 'remove' | 'keep'): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.mode = mode;
  save(data);
}

export function undoProjectSpin(projectId: string, record: SpinRecord): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  // Remove last occurrence from picked
  const pickedIdx = project.picked.lastIndexOf(record.entryId);
  if (pickedIdx !== -1) project.picked.splice(pickedIdx, 1);
  // Restore to eligible if it was removed
  if (record.removedFromPool && !project.eligible.includes(record.entryId)) {
    project.eligible.push(record.entryId);
  }
  // Remove from history
  const histIdx = project.history.findIndex(h => h.timestamp === record.timestamp && h.entryId === record.entryId);
  if (histIdx !== -1) project.history.splice(histIdx, 1);
  save(data);
}

export function restoreProjectState(projectId: string, eligible: string[], picked: string[], history: SpinRecord[]): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.eligible = eligible;
  project.picked = picked;
  project.history = history;
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
      // Same name at same position — preserve ID
      newItems.push(existing.items[i]);
    } else {
      // New or changed — generate new ID
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

export function quickSpinPick(): SpinRecord | null {
  const data = load();
  const qs = data.quickSpin!;
  if (qs.eligible.length === 0) return null;

  const idx = Math.floor(Math.random() * qs.eligible.length);
  const winnerId = qs.eligible[idx];
  const winnerName = qs.items.find(i => i.id === winnerId)?.name ?? '(unknown)';

  const record: SpinRecord = {
    entryId: winnerId,
    entryName: winnerName,
    timestamp: Date.now(),
    removedFromPool: qs.mode === 'remove',
  };

  if (qs.mode === 'remove') {
    qs.eligible.splice(idx, 1);
  }
  qs.picked.push(winnerId);
  qs.history.push(record);
  save(data);
  return record;
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
  // Remove last occurrence from picked
  const pickedIdx = qs.picked.lastIndexOf(record.entryId);
  if (pickedIdx !== -1) qs.picked.splice(pickedIdx, 1);
  // Restore to eligible if it was removed
  if (record.removedFromPool && !qs.eligible.includes(record.entryId)) {
    qs.eligible.push(record.entryId);
  }
  // Remove from history
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
  if (!Array.isArray(data.classes) || !Array.isArray(data.projects)) {
    throw new Error('Invalid data format');
  }
  data = migrateData(data);
  save(data);
}
