import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';

// SCAFFOLD ONLY. This is the framework copied and adapted from havruta. The parsha
// reading experience is not built yet; the build-out is tracked in the repo Issues
// and planned in docs/ROADMAP.md and docs/PROJECT-PLAN.md. Routes below are
// placeholders so the shell runs and deep-links resolve under HashRouter.

function Placeholder({ title, children }) {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'Crimson Text, Georgia, serif' }}>
      <h1 style={{ fontFamily: 'Oswald, system-ui, sans-serif', letterSpacing: '.02em' }}>{title}</h1>
      {children}
      <p style={{ marginTop: '2rem', fontSize: '.9rem', opacity: 0.7 }}>
        <Link to="/">Home</Link>
      </p>
    </main>
  );
}

function Home() {
  return (
    <Placeholder title="Chumash">
      <p style={{ fontSize: '1.1rem' }}>
        A weekly Torah-portion study companion. Read the parsha with Targum, Rashi,
        a translation you tap to reveal, and transliteration, at the pace of the week.
      </p>
      <p style={{ opacity: 0.75 }}>
        This is the scaffold. The infrastructure (Sefaria client, transliteration,
        the study-partner libraries, the design system) is carried over from havruta;
        the parsha calendar, the reading view, the shnayim-mikra tracker, and the
        haftarah are the build, tracked in the repo Issues. See <code>docs/ROADMAP.md</code>.
      </p>
    </Placeholder>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Placeholder title="Not here yet"><p>That page is not built yet.</p></Placeholder>} />
      </Routes>
    </HashRouter>
  );
}
