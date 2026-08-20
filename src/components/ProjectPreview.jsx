export default function ProjectPreview({ hover }) {
  if (!hover) return null;
  const project = hover.project;
  const cluster = hover.cluster;
  const clusterCity = hover.clusterCity ?? project.city;
  const cardWidth = window.innerWidth <= 900 ? Math.min(300, window.innerWidth - 32) : 340;
  const gap = 28;
  const preferredLeft = hover.screen.x > window.innerWidth * 0.56
    ? hover.screen.x - cardWidth - gap
    : hover.screen.x + gap;
  const left = Math.min(window.innerWidth - cardWidth - 16, Math.max(16, preferredLeft));
  const top = Math.min(window.innerHeight - 390, Math.max(88, hover.screen.y - 170));

  return (
    <aside
      className="project-preview"
      style={{ left, top }}
      aria-live="polite"
    >
      <div className="project-preview__image-wrap">
        <img src={project.image} alt="" className="project-preview__image" />
        <span className="project-preview__index">{cluster ? `${String(cluster.length).padStart(2, '0')} / ${clusterCity}` : project.year}</span>
      </div>
      <div className="project-preview__body">
        <p className="project-preview__place">{cluster ? clusterCity : project.city}, {project.country}</p>
        <h2>{cluster ? `${cluster.length} projects in ${clusterCity}` : project.title}</h2>
        {cluster ? (
          <p className="project-preview__cluster-hint">Click the marker to separate</p>
        ) : (
          <p className="project-preview__action">Click marker to view project <span>→</span></p>
        )}
      </div>
    </aside>
  );
}
