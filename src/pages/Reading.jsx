import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ParshaReader from '../components/ParshaReader.jsx';
import ParshaSummary from '../components/ParshaSummary.jsx';
import { getParshaReading, PARSHIYOT } from '../lib/parsha.js';
import { readLocale } from '../lib/locale.js';
import { transliterate } from '../lib/transliterate.js';

// The reading view for a named portion. It resolves the name to its reading
// record (the canonical Hebrew name, the verse range, the aliyot, the haftarah)
// from Sefaria, then renders the portion verse by verse with the summary beneath.
// The name in the URL is one of the fifty-four transliterations from parsha.js, or
// a doubled name like "Matot-Masei" the calendar returns.
export default function Reading() {
  const { name } = useParams();
  const decoded = decodeURIComponent(name || '');
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The name to resolve on the calendar: a doubled URL name resolves under its
  // first half, which the Sedra reports on the shared Shabbat.
  const resolveName = decoded.includes('-') ? decoded.split('-')[0] : decoded;
  const known = PARSHIYOT.includes(resolveName) || decoded.includes('-');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getParshaReading(resolveName, readLocale());
      setReading(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setReading(null);
    } finally {
      setLoading(false);
    }
  }, [resolveName]);

  useEffect(() => {
    if (known) load();
    else {
      setError(`There is no portion named ${decoded}.`);
      setLoading(false);
    }
  }, [known, load, decoded]);

  const titleHe = reading ? reading.he : '';
  const titleName = reading ? reading.name : decoded;

  return (
    <>
      <Breadcrumb trail={[{ label: titleName }]} />
      <main className="app-main">
        <header style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="hebrew" style={{ fontSize: '2.4rem', color: 'var(--accent-2)', margin: '0 0 var(--space-xs)' }}>
            {titleHe || titleName}
          </h1>
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.2rem', margin: 0 }}>
            {titleHe ? `${titleName} (${transliterate(titleHe)})` : titleName}
          </p>
          {reading && (
            <p style={{ color: 'var(--muted)', margin: 'var(--space-xs) 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              {reading.ref}
            </p>
          )}
        </header>

        {loading && (
          <p style={{ color: 'var(--muted)' }}>
            Resolving this portion on the calendar. One moment.
          </p>
        )}

        {error && (
          <div className="card">
            <p>
              This portion could not be loaded. The app shows only what Sefaria
              supplies, so there is nothing to display.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
            {known && (
              <button type="button" className="pill-button" onClick={load}>
                Try again
              </button>
            )}
          </div>
        )}

        {!loading && !error && reading && (
          <>
            <ParshaReader rangeRef={reading.ref} title={reading.name} />
            <ParshaSummary parsha={reading} />
          </>
        )}
      </main>
    </>
  );
}
