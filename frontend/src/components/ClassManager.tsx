import { useState } from 'react';
import type { Class } from '../services/storage';
import {
  addStudentsBulk,
  createClass,
  deleteClass,
  deleteStudent,
  getClasses,
  updateClassName,
  updateStudentName,
} from '../services/storage';

export default function ClassManager() {
  const [classes, setClasses] = useState<Class[]>(getClasses);
  const [newClassName, setNewClassName] = useState('');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');

  const refresh = () => setClasses(getClasses());

  const handleCreateClass = () => {
    const name = newClassName.trim();
    if (!name) return;
    createClass(name);
    setNewClassName('');
    refresh();
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('Delete this class and all its projects?')) {
      deleteClass(id);
      if (expandedClassId === id) setExpandedClassId(null);
      refresh();
    }
  };

  const handleSaveClassName = (id: string) => {
    const name = editingClassName.trim();
    if (name) updateClassName(id, name);
    setEditingClassId(null);
    refresh();
  };

  const handleAddStudents = (classId: string) => {
    const raw = bulkInput.trim();
    if (!raw) return;
    const names = raw.split(/[,\n]/).map(n => n.trim()).filter(Boolean);
    addStudentsBulk(classId, names);
    setBulkInput('');
    refresh();
  };

  const handleSaveStudentName = (classId: string, studentId: string) => {
    const name = editingStudentName.trim();
    if (name) updateStudentName(classId, studentId, name);
    setEditingStudentId(null);
    refresh();
  };

  const handleDeleteStudent = (classId: string, studentId: string) => {
    deleteStudent(classId, studentId);
    refresh();
  };

  return (
    <div className="class-manager">
      {/* header provided by Modal wrapper */}

      <div className="create-class-form">
        <input
          type="text"
          value={newClassName}
          onChange={e => setNewClassName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreateClass()}
          placeholder="New class name (e.g., Period 3 Math)"
        />
        <button className="btn btn-primary" onClick={handleCreateClass}>
          + Add Class
        </button>
      </div>

      {classes.length === 0 && (
        <p className="empty-state">No classes yet. Create one above to get started!</p>
      )}

      <div className="class-list">
        {classes.map(cls => (
          <div key={cls.id} className="class-card">
            <div className="class-card-header" onClick={() =>
              setExpandedClassId(expandedClassId === cls.id ? null : cls.id)
            }>
              <span className="expand-icon">{expandedClassId === cls.id ? '\u25BC' : '\u25B6'}</span>
              {editingClassId === cls.id ? (
                <input
                  className="inline-edit"
                  value={editingClassName}
                  onChange={e => setEditingClassName(e.target.value)}
                  onBlur={() => handleSaveClassName(cls.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveClassName(cls.id);
                    if (e.key === 'Escape') setEditingClassId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className="class-name">{cls.name}</span>
              )}
              <span className="student-count">{cls.students.length} students</span>
              <div className="class-actions" onClick={e => e.stopPropagation()}>
                <button className="btn-icon" title="Rename" onClick={() => {
                  setEditingClassId(cls.id);
                  setEditingClassName(cls.name);
                }}>
                  &#9998;
                </button>
                <button className="btn-icon btn-danger" title="Delete" onClick={() => handleDeleteClass(cls.id)}>
                  &times;
                </button>
              </div>
            </div>

            {expandedClassId === cls.id && (
              <div className="class-card-body">
                <div className="add-students-form">
                  <textarea
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder="Add students (comma or newline separated)"
                    rows={3}
                  />
                  <button className="btn btn-primary" onClick={() => handleAddStudents(cls.id)}>
                    Add Students
                  </button>
                </div>

                {cls.students.length === 0 ? (
                  <p className="empty-state">No students yet. Add some above!</p>
                ) : (
                  <ul className="student-list">
                    {cls.students.map(student => (
                      <li key={student.id} className="student-item">
                        {editingStudentId === student.id ? (
                          <input
                            className="inline-edit"
                            value={editingStudentName}
                            onChange={e => setEditingStudentName(e.target.value)}
                            onBlur={() => handleSaveStudentName(cls.id, student.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveStudentName(cls.id, student.id);
                              if (e.key === 'Escape') setEditingStudentId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="student-name"
                            onClick={() => {
                              setEditingStudentId(student.id);
                              setEditingStudentName(student.name);
                            }}
                            title="Click to edit name"
                          >
                            {student.name}
                          </span>
                        )}
                        <button
                          className="btn-icon btn-danger"
                          title="Remove student"
                          onClick={() => handleDeleteStudent(cls.id, student.id)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
