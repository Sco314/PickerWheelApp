type Project = { id: number; title: string };

type Props = {
  projects: Project[];
  projectId: number | null;
  onChange: (id: number) => void;
};

export default function HeaderProjectSelector({ projects, projectId, onChange }: Props) {
  return (
    <label>
      Project:
      <select value={projectId ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
        <option value="" disabled>
          Select project
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </label>
  );
}
