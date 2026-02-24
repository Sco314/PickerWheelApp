import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HeaderProjectSelector from './components/HeaderProjectSelector';
import ListPanel from './components/ListPanel';
import SpinnerWheel from './components/SpinnerWheel';
import {
  addNames,
  clearLists,
  createProject,
  getState,
  listProjects,
  resetRound,
  shuffle,
  spin,
  undo,
  updateTitle,
} from './services/api';
import './styles/app.css';

type State = {
  pickable?: { title: string; items: string[] };
  picked?: { title: string; items: string[] };
};

function App() {
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [state, setState] = useState<State>({});
  const [namesInput, setNamesInput] = useState('');
  const [lastPicked, setLastPicked] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const refreshProjects = async () => {
    const data = await listProjects();
    setProjects(data);
    if (data.length === 0) {
      const defaultProject = await createProject('Default Project');
      setProjects([defaultProject]);
      setProjectId(defaultProject.id);
      return;
    }
    if (!projectId) {
      setProjectId(data[0].id);
    }
  };

  const refreshState = async (id: number) => {
    const data = await getState(id);
    setState(data);
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem('lastProjectId', String(projectId));
      refreshState(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    const saved = localStorage.getItem('lastProjectId');
    if (saved) {
      setProjectId(Number(saved));
    }
  }, []);

  const onCreateProject = async () => {
    const title = prompt('Project title?', 'My Project') || 'My Project';
    const project = await createProject(title);
    await refreshProjects();
    setProjectId(project.id);
  };

  const onAddNames = async () => {
    if (!projectId) return;
    await addNames(projectId, namesInput);
    setNamesInput('');
    await refreshState(projectId);
  };

  const onSpin = async () => {
    if (!projectId) return;
    setSpinning(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const result = await spin(projectId);
    setLastPicked(result.picked);
    setSpinning(false);
    await refreshState(projectId);
  };

  const onUndo = async () => {
    if (!projectId) return;
    const result = await undo(projectId);
    setLastPicked(`Undid: ${result.picked}`);
    await refreshState(projectId);
  };

  const onReset = async () => {
    if (!projectId) return;
    await resetRound(projectId);
    await refreshState(projectId);
  };

  const onShuffle = async () => {
    if (!projectId) return;
    await shuffle(projectId);
    await refreshState(projectId);
  };

  const onClear = async () => {
    if (!projectId) return;
    await clearLists(projectId);
    setLastPicked(null);
    await refreshState(projectId);
  };

  const onSaveTitle = async (kind: 'pickable' | 'picked', title: string) => {
    if (!projectId) return;
    await updateTitle(projectId, kind, title);
    await refreshState(projectId);
  };

  return (
    <>
      <header>
        <h1>PickerWheelApp</h1>
        <HeaderProjectSelector projects={projects} projectId={projectId} onChange={setProjectId} />
        <button onClick={onCreateProject}>New Project</button>
      </header>
      <main>
        <section>
          <ListPanel
            title={state.pickable?.title ?? 'Pickable List'}
            items={state.pickable?.items ?? []}
            onSaveTitle={(title) => onSaveTitle('pickable', title)}
          />
          <textarea
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            placeholder="Paste names (comma/newline separated)"
          />
          <button onClick={onAddNames}>Add Names</button>
          <button onClick={onShuffle}>Shuffle</button>
        </section>
        <section>
          <SpinnerWheel picked={lastPicked} spinning={spinning} />
          <div className="actions">
            <button onClick={onSpin}>Spin</button>
            <button onClick={onUndo}>Undo</button>
            <button onClick={onReset}>Reset Round</button>
            <button onClick={onClear}>Clear</button>
          </div>
        </section>
        <ListPanel
          title={state.picked?.title ?? 'Picked List'}
          items={state.picked?.items ?? []}
          onSaveTitle={(title) => onSaveTitle('picked', title)}
        />
      </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
