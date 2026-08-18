import { memo } from 'react';

function AboutPage() {
  return (
    <section className="about-page" id="about" aria-labelledby="about-title">
      <div className="about-page__identity">
        <h1 id="about-title">About</h1>
        <div className="about-page__footer">
          <div className="about-page__meta">
            <span>Ziyuan Cao</span>
            <span>Landscape Designer</span>
          </div>
          <div className="about-page__links" aria-label="Professional links">
            <a href="https://www.linkedin.com/in/ziyuan-cao" target="_blank" rel="noreferrer">
              LinkedIn
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12L12 4M6 4h6v6" /></svg>
            </a>
            <a href="https://drive.google.com/file/d/1Nm101wJLH9GkY8jpZ6NsnvfIGcz0FThh/view?usp=sharing" target="_blank" rel="noreferrer">
              Resume
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12L12 4M6 4h6v6" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="about-page__copy">
        <p className="about-page__lead">
          I am a landscape designer interested in how landscapes shape the relationship between people and place. To me, landscape design is not only about creating a beautiful space, but also about reading what already exists on a site: landform, materials, plants, water, traces of use, and memory.
        </p>
        <p>
          My early experience in residential courtyard design trained me to think from the user’s perspective. I learned to consider human scale, movement, views, planting, paving, water features, and small details as parts of one spatial experience.
        </p>
        <p>
          During my MLA studies, I expanded this user-centered way of thinking to more complex site conditions. Through site analysis, spatial organization, ecological strategies, and visual communication, I hope to make landscapes that connect past and future, environment and people, memory and daily life.
        </p>
      </div>
    </section>
  );
}

export default memo(AboutPage);

