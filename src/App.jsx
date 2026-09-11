import { useCallback, useEffect, useRef, useState } from 'react';
import GlobeCanvas from './components/GlobeCanvas';
import ProjectPreview from './components/ProjectPreview';
import ProjectDetail from './components/ProjectDetail';
import ProjectsIndex from './components/ProjectsIndex';
import SketchbookPage from './components/SketchbookPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import { projects } from './data/projects';

const PAGE_ORDER = ['index', 'projects', 'sketchbook', 'about', 'contact'];
const PAGE_HASH = { index: '#home', projects: '#projects', sketchbook: '#sketchbook', about: '#about', contact: '#contact' };
const CITY_COUNT = new Set(projects.map((project) => project.clusterCity ?? project.city)).size;

export default function App() {
  const [page, setPage] = useState(() => {
    if (window.location.hash === '#projects') return 'projects';
    if (window.location.hash === '#sketchbook') return 'sketchbook';
    if (window.location.hash === '#about') return 'about';
    if (window.location.hash === '#contact') return 'contact';
    return 'index';
  });
  const [hover, setHover] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [motionDirection, setMotionDirection] = useState('forward');
  const [transitionPhase, setTransitionPhase] = useState('idle');
  const shellRef = useRef(null);
  const wheelAmountRef = useRef(0);
  const wheelLockRef = useRef(0);
  const transitionLockRef = useRef(false);
  const transitionTimersRef = useRef([]);
  const closeProject = useCallback(() => setSelectedProject(null), []);

  const navigateTo = useCallback((nextPage, direction) => {
    if (nextPage === page || transitionLockRef.current) return;
    const currentIndex = PAGE_ORDER.indexOf(page);
    const nextIndex = PAGE_ORDER.indexOf(nextPage);
    transitionLockRef.current = true;
    wheelAmountRef.current = 0;
    setMotionDirection(direction || (nextIndex > currentIndex ? 'forward' : 'backward'));
    setTransitionPhase('leaving');
    setHover(null);

    const swapTimer = window.setTimeout(() => {
      setPage(nextPage);
      window.history.replaceState(null, '', PAGE_HASH[nextPage]);
      setTransitionPhase('entering');

      const finishTimer = window.setTimeout(() => {
        setTransitionPhase('idle');
        transitionLockRef.current = false;
      }, 900);
      transitionTimersRef.current.push(finishTimer);
    }, 620);
    transitionTimersRef.current.push(swapTimer);
  }, [page]);

  useEffect(() => () => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const showIndex = useCallback((event) => {
    event.preventDefault();
    navigateTo('index');
  }, [navigateTo]);
  const showProjects = useCallback((event) => {
    event.preventDefault();
    navigateTo('projects');
  }, [navigateTo]);
  const showSketchbook = useCallback((event) => {
    event.preventDefault();
    navigateTo('sketchbook');
  }, [navigateTo]);
  const showAbout = useCallback((event) => {
    event.preventDefault();
    navigateTo('about');
  }, [navigateTo]);
  const showContact = useCallback((event) => {
    event.preventDefault();
    navigateTo('contact');
  }, [navigateTo]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const handleWheel = (event) => {
      if (selectedProject || transitionLockRef.current || Math.abs(event.deltaY) < 4 || Date.now() < wheelLockRef.current) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const pageIndex = PAGE_ORDER.indexOf(page);
      const nextIndex = pageIndex + direction;
      if (nextIndex < 0 || nextIndex >= PAGE_ORDER.length) return;

      if (page === 'index') {
        if (event.clientX > window.innerWidth * .34) return;
      } else {
        const selector = page === 'projects' ? '.projects-index' : page === 'sketchbook' ? '.sketchbook-page' : page === 'about' ? '.about-page' : '.contact-page';
        const scroller = shell.querySelector(selector);
        if (!scroller) return;
        const atTop = scroller.scrollTop <= 2;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        if ((direction < 0 && !atTop) || (direction > 0 && !atBottom)) {
          wheelAmountRef.current = 0;
          return;
        }
      }

      wheelAmountRef.current += event.deltaY;
      if (Math.abs(wheelAmountRef.current) < 120) return;

      event.preventDefault();
      wheelAmountRef.current = 0;
      wheelLockRef.current = Date.now() + 1700;
      navigateTo(PAGE_ORDER[nextIndex], direction > 0 ? 'forward' : 'backward');
    };

    shell.addEventListener('wheel', handleWheel, { passive: false });
    return () => shell.removeEventListener('wheel', handleWheel);
  }, [navigateTo, page, selectedProject]);

  return (
    <main ref={shellRef} className={`portfolio-shell page-motion--${motionDirection} page-transition--${transitionPhase}`}>
      <div className="cosmic-field" aria-hidden="true">
        <svg className="orbital-field" viewBox="0 0 1600 1000" preserveAspectRatio="none">
          <ellipse cx="1150" cy="555" rx="690" ry="282" transform="rotate(-12 1150 555)" />
          <ellipse className="orbit-secondary" cx="1190" cy="510" rx="470" ry="176" transform="rotate(18 1190 510)" />
          <path d="M602 788C880 875 1275 842 1558 655" />
          <circle className="orbit-moon" cx="1502" cy="247" r="1.6" />
          <circle className="orbit-node" cx="689" cy="744" r="2" />
        </svg>
      </div>
      <div className="layout-grid" aria-hidden="true" />
      <header className="site-header">
        <nav aria-label="Primary navigation">
          <a className={page === 'index' ? 'is-active' : ''} href="#home" onClick={showIndex}>Index</a>
          <a className={page === 'projects' ? 'is-active' : ''} href="#projects" onClick={showProjects}>Projects</a>
          <a className={page === 'sketchbook' ? 'is-active' : ''} href="#sketchbook" onClick={showSketchbook}>SKETCHBOOK</a>
          <a className={page === 'about' ? 'is-active' : ''} href="#about" onClick={showAbout}>About</a>
          <a className={page === 'contact' ? 'is-active' : ''} href="#contact" onClick={showContact}>Contact</a>
        </nav>
      </header>

      {page === 'index' ? (
        <section className="hero" id="home" aria-labelledby="portfolio-title">
          <div className="identity-panel">
            <h1 id="portfolio-title"><span>Ziyuan</span><span>Cao</span></h1>
            <p className="degree">MLA — Portfolio</p>
          </div>

          <div className="globe-stage">
            <GlobeCanvas projects={projects} onHover={setHover} onSelect={setSelectedProject} />
          </div>

          <div className="work-label">
            <span>Landscape Architecture /</span>
            <span>Selected Works 2020—2026</span>
          </div>
          <p className="city-line">Based in Boston · Selected works worldwide</p>
          <p className="project-count">
            <strong>{String(projects.length).padStart(2, '0')}</strong>
            <span>{projects.length === 1 ? 'Project' : 'Projects'}<br />across {String(CITY_COUNT).padStart(2, '0')} {CITY_COUNT === 1 ? 'city' : 'cities'}</span>
          </p>
        </section>
      ) : page === 'projects' ? (
        <ProjectsIndex projects={projects} onSelect={setSelectedProject} />
      ) : page === 'sketchbook' ? (
        <SketchbookPage />
      ) : page === 'about' ? (
        <AboutPage />
      ) : (
        <ContactPage />
      )}

      <ProjectPreview hover={hover} />
      <ProjectDetail project={selectedProject} onClose={closeProject} />
    </main>
  );
}
