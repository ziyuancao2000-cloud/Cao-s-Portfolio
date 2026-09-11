import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function SketchbookViewer({ items, activeIndex, onClose, onStep }) {
  const viewerRef = useRef(null);
  const closeRef = useRef(null);
  const item = items[activeIndex];

  useEffect(() => {
    const previousFocus = document.activeElement;
    const shell = document.querySelector('.portfolio-shell');
    const previousInert = shell?.inert;
    const previousOverflow = document.body.style.overflow;
    if (shell) shell.inert = true;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); onStep(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); onStep(1); }
      if (event.key === 'Tab') {
        const buttons = viewerRef.current.querySelectorAll('button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (shell) shell.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose, onStep]);

  return createPortal(
    <div className="sketchbook-viewer" ref={viewerRef} role="dialog" aria-modal="true"
      aria-label="Sketchbook image viewer" onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <button className="sketchbook-viewer-close" ref={closeRef} type="button" onClick={onClose}
        aria-label="Close image viewer">Close <span aria-hidden="true">×</span></button>
      <div className="sketchbook-viewer-stage">
        <img key={item.id} src={item.image} width={item.width} height={item.height}
          alt={`Hand drawing ${item.order} of ${items.length}`} />
      </div>
      <div className="sketchbook-viewer-controls">
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous drawing">← Previous</button>
        <span aria-live="polite" aria-atomic="true">{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => onStep(1)} aria-label="Next drawing">Next →</button>
      </div>
    </div>,
    document.body,
  );
}
