import { memo } from 'react';

function ProjectsIndex({ projects, onSelect }) {
  const cityCount = new Set(projects.map((project) => project.city)).size;

  return (
    <section className="projects-index" id="projects" aria-labelledby="projects-index-title">
      <div className="projects-index__intro">
        <div>
          <p>{String(projects.length).padStart(2, '0')} projects · {String(cityCount).padStart(2, '0')} cities</p>
          <h1 id="projects-index-title">Selected<br />Projects</h1>
        </div>
        <p className="projects-index__note">Landscape architecture<br />Selected works 2020—2026</p>
      </div>

      <div className={`projects-grid${projects.length === 1 ? ' projects-grid--single' : ''}`}>
        {projects.map((project, index) => (
          <button
            className="project-card"
            type="button"
            key={project.id}
            onClick={() => onSelect(project)}
            aria-label={`Open ${project.title}`}
          >
            <span className="project-card__image-wrap">
              <img src={project.image} alt="" className="project-card__image" />
              <span className="project-card__number">{String(index + 1).padStart(2, '0')}</span>
            </span>
            <span className="project-card__meta">
              <span>{project.city}, {project.country}</span>
              <span>{project.year}</span>
            </span>
            <span className="project-card__title-row">
              <strong>{project.title}</strong>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
            </span>
            <span className="project-card__type">{project.type}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(ProjectsIndex);

