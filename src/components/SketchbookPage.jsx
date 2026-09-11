import { useCallback, useState } from 'react';
import { sketchbookItems } from '../data/sketchbook';
import SketchbookViewer from './SketchbookViewer';
import './Sketchbook.css';

export default function SketchbookPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const closeViewer = useCallback(() => setActiveIndex(null), []);
  const stepViewer = useCallback((direction) => {
    setActiveIndex((index) => (index + direction + sketchbookItems.length) % sketchbookItems.length);
  }, []);

  return (
    <section className="sketchbook-page" id="sketchbook" aria-labelledby="sketchbook-title">
      <header className="sketchbook-header">
        <h1 id="sketchbook-title">SKETCHBOOK</h1>
        <p>Drawings, studies, and visual observations.</p>
      </header>
      <div className="sketchbook-grid">
        {sketchbookItems.map((item, index) => (
          <button className="sketchbook-item" type="button" key={item.id}
            onClick={() => setActiveIndex(index)} aria-label={`Open drawing ${item.order} of ${sketchbookItems.length}`}>
            <img src={item.image} width={item.width} height={item.height}
              alt={`Hand drawing ${item.order}`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
          </button>
        ))}
      </div>
      {activeIndex !== null && (
        <SketchbookViewer items={sketchbookItems} activeIndex={activeIndex}
          onClose={closeViewer} onStep={stepViewer} />
      )}
    </section>
  );
}
