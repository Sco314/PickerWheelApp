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

export interface Project {
  id: string;
  classId: string;
  title: string;
  pickable: string[]; // student IDs
  picked: string[];   // student IDs
  createdAt: string;
}

export interface AppData {
  classes: Class[];
  projects: Project[];
}

function genId(): string {
  return crypto.randomUUID();
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch { /* corrupted data — start fresh */ }
  return { classes: [], projects: [] };
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
  // Also remove projects that reference this class
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
  // Also remove from any projects that reference this class
  for (const project of data.projects) {
    if (project.classId === classId) {
      project.pickable = project.pickable.filter(id => id !== studentId);
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
    pickable: cls.students.map(s => s.id),
    picked: [],
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

// ─── Picker operations ──────────────────────────────────

export function spinPick(projectId: string): string | null {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project || project.pickable.length === 0) return null;
  const idx = Math.floor(Math.random() * project.pickable.length);
  const [picked] = project.pickable.splice(idx, 1);
  project.picked.push(picked);
  save(data);
  return picked;
}

export function resetProject(projectId: string): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.pickable = [...project.pickable, ...project.picked];
  project.picked = [];
  save(data);
}

export function moveBackToPickable(projectId: string, studentId: string): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.picked = project.picked.filter(id => id !== studentId);
  if (!project.pickable.includes(studentId)) {
    project.pickable.push(studentId);
  }
  save(data);
}

export function removeFromPickable(projectId: string, studentId: string): void {
  const data = load();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  project.pickable = project.pickable.filter(id => id !== studentId);
  save(data);
}

// ─── Helpers ─────────────────────────────────────────────

/** Resolve student IDs to names using the class roster */
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
  const data = JSON.parse(json) as AppData;
  // Basic validation
  if (!Array.isArray(data.classes) || !Array.isArray(data.projects)) {
    throw new Error('Invalid data format');
  }
  save(data);
}
