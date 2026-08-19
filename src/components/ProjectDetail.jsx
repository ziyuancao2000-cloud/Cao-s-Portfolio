import { useCallback, useEffect, useState } from 'react';

export default function ProjectDetail({ project, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const requestClose = useCallback(() => setIsClosing(true), []);

  useEffect(() => {
    if (!project) return undefined;
    setIsClosing(false);
    const onKey = (event) => event.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, requestClose]);

  if (!project) return null;
  const gallery = project.gallery?.length ? project.gallery : [project.image];
  return (
    <section
      className={`project-detail${isClosing ? ' project-detail--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onAnimationEnd={(event) => {
        if (isClosing && event.target === event.currentTarget) onClose();
      }}
    >
      <button className="project-detail__close" type="button" onClick={requestClose} aria-label="Close project">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
      </button>
      <div
        className="project-detail__gallery"
        aria-label={`${project.title} project boards`}
        onClick={(event) => event.target === event.currentTarget && requestClose()}
      >
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
