import { memo, useState } from 'react';

const EMAIL_ADDRESS = 'ziyuancao2000@gmail.com';
const gmailComposeUrl = (subject = '', body = '') =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_ADDRESS)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

function ContactPage() {
  const [status, setStatus] = useState('idle');

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const subject = `Portfolio inquiry — ${name}`;
    const body = `Hello Ziyuan,\n\n${message}\n\n—\nFrom: ${name}\nEmail: ${email}`;

    setStatus('ready');
    window.open(gmailComposeUrl(subject, body), '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="contact-page" id="contact" aria-labelledby="contact-title">
      <div className="contact-page__intro">
        <div>
          <h1 id="contact-title"><span>Let’s shape</span><span>what’s next.</span></h1>
        </div>

        <a className="contact-page__email" href={gmailComposeUrl()} target="_blank" rel="noreferrer">
          <span>Send a direct email</span>
          <strong>{EMAIL_ADDRESS}</strong>
        </a>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-form__row">
          <label className="contact-form__question">
            <span>Your name</span>
            <input name="name" type="text" autoComplete="name" placeholder="Name" required />
          </label>
          <label className="contact-form__question">
            <span>Your email</span>
            <input name="email" type="email" autoComplete="email" placeholder="Email address" required />
          </label>
        </div>

        <label className="contact-form__question contact-form__question--message">
          <span>What would you like to explore?</span>
          <textarea name="message" placeholder="Share a project, possibility, or idea…" rows="4" required />
        </label>

        <div className="contact-form__submit-row">
          <p>{status === 'ready' ? 'Your Gmail draft is ready.' : 'This will open a prepared message in Gmail.'}</p>
          <button type="submit">
            Send inquiry
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>
          </button>
        </div>
      </form>
    </section>
  );
}

export default memo(ContactPage);

