import { useEffect } from 'react';

export default function ProjectDetail({ project, onClose }) {
  useEffect(() => {
    if (!project) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, onClose]);

  if (!project) return null;
  const gallery = project.gallery?.length ? project.gallery : [project.image];
  return (
    <section className="project-detail" role="dialog" aria-modal="true" aria-label={project.title}>
      <button className="project-detail__close" type="button" onClick={onClose} aria-label="Close project">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
      </button>
      <div className="project-detail__gallery" aria-label={`${project.title} project boards`}>
        {gallery.map((image, index) => (
          <figure key={image}>
            <div className="project-detail__sheet-number">{String(index + 1).padStart(2, '0')}</div>
            <img src={image} alt={`${project.title} project board ${index + 1}`} loading={index > 1 ? 'lazy' : 'eager'} />
          </figure>
        ))}
      </div>
    </section>
  );
}

