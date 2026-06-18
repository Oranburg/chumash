import { useEffect, useState, useCallback } from 'react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ParshaReader from '../components/ParshaReader.jsx';
import { getThisWeeksParsha } from '../lib/parsha.js';
import { readLocale } from '../lib/locale.js';
import { transliterate } from '../lib/transliterate.js';

// The haftarah view for the week's portion. The haftarah is the reading from
// the Prophets that follows the Torah reading on Shabbat and is chosen to echo
// it. This page resolves the current week's parsha, takes the haftarah ref it
// carries, and reads it through the same verse-by-verse view the portion uses,
// so the Hebrew, the English, the transliteration, the commentaries, and the
// per-verse partner are all there. The text comes from Sefaria verbatim; on a
// failure the page reports it and offers a retry rather than inventing a reading.
//
// A haftarah ref can be a single contiguous range ("I Samuel 11:14-12:22") or,
// in some weeks, a ref that spans more than one stretch. The reading view loads
// whatever Sefaria returns for the ref and never fills in a missing piece.
export default function Haftarah() {
  const [parsha, setParsha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getThisWeeksParsha(new Date(), readLocale());
      setParsha(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setParsha(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The haftarah record is an object { ref, displayEn, displayHe } when Sefaria
  // carried one, and null when it did not (or the week resolved offline).
  const haftarah = parsha && parsha.haftarah ? parsha.haftarah : null;
  const haftarahRef = haftarah ? haftarah.ref : null;
  const titleHe = haftarah ? haftarah.displayHe : '';
  const titleEn = haftarah ? haftarah.displayEn : '';

  return (
    <>
      <Breadcrumb trail={[{ label: 'This week', to: '/' }, { label: 'Haftarah' }]} />
      <main className="app-main">
        <header style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="hebrew" style={{ fontSize: '2.4rem', color: 'var(--accent-2)', margin: '0 0 var(--space-xs)' }}>
            {titleHe || 'Haftarah'}
          </h1>
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.2rem', margin: 0 }}>
            {titleHe ? `Haftarah (${transliterate(titleHe)})` : 'The reading from the Prophets'}
          </p>
          {parsha && (parsha.he || parsha.name) && (
            <p style={{ color: 'var(--muted)', margin: 'var(--space-xs) 0 0', fontSize: '0.95rem' }}>
              The haftarah for {parsha.he || parsha.name} follows the Torah reading
              and is chosen to echo it.
            </p>
          )}
          {haftarahRef && (
            <p style={{ color: 'var(--muted)', margin: 'var(--space-xs) 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              {haftarahRef}
            </p>
          )}
        </header>

        {loading && (
          <p style={{ color: 'var(--muted)' }}>
            Resolving this week&rsquo;s haftarah from Sefaria. One moment.
          </p>
        )}

        {error && (
          <div className="card">
            <p>
              This week&rsquo;s haftarah could not be loaded right now. The app
              shows only what Sefaria supplies, so there is nothing to display
              until the connection returns.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
            <button type="button" className="pill-button" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !haftarahRef && (
          <div className="card">
            <p>
              Sefaria did not return a haftarah for this week, so there is no
              reading from the Prophets to show. You can still read the portion.
            </p>
          </div>
        )}

        {!loading && !error && haftarahRef && (
          <ParshaReader rangeRef={haftarahRef} title={titleEn || 'this haftarah'} />
        )}
      </main>
    </>
  );
}
