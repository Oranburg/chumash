import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ParshaSummary from '../components/ParshaSummary.jsx';
import { getThisWeeksParsha } from '../lib/parsha.js';
import { readLocale, writeLocale } from '../lib/locale.js';
import { transliterate } from '../lib/transliterate.js';

// Format a Gregorian date range as "June 14 to 20, 2026", or with both months
// named when the range crosses a month, in plain house style.
function formatGregorianRange(start, end) {
  const month = (d) => d.toLocaleDateString('en-US', { month: 'long' });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${month(start)} ${start.getDate()} to ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${month(start)} ${start.getDate()} to ${month(end)} ${end.getDate()}, ${end.getFullYear()}`;
}

// The home page: this week's portion. It names the parsha in Hebrew, in
// transliteration, and in English, gives the Gregorian and Hebrew date ranges,
// lists the seven aliyot and the haftarah, and opens into the reading view.
export default function ThisWeek() {
  const [locale, setLocale] = useState(readLocale);
  const [parsha, setParsha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (loc) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getThisWeeksParsha(new Date(), loc);
      setParsha(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setParsha(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(locale);
  }, [load, locale]);

  function changeLocale(loc) {
    writeLocale(loc);
    setLocale(loc);
  }

  return (
    <>
      <Breadcrumb trail={[{ label: 'This week' }]} />
      <main className="app-main">
        <LocaleToggle locale={locale} onChange={changeLocale} />

        {loading && (
          <p style={{ color: 'var(--muted)' }}>
            Reading this week&rsquo;s portion from Sefaria. One moment.
          </p>
        )}

        {error && (
          <div className="card">
            <p>
              This week&rsquo;s portion could not be loaded right now. The app
              shows only what Sefaria supplies, so there is nothing to display
              until the connection returns.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
            <button type="button" className="pill-button" onClick={() => load(locale)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && parsha && (
          <article>
            <p style={{ color: 'var(--muted)', margin: '0 0 var(--space-xs)', fontFamily: 'var(--font-headline)', letterSpacing: '0.04em' }}>
              This week&rsquo;s portion
            </p>
            <h1 className="hebrew" style={{ fontSize: '3rem', color: 'var(--accent-2)', margin: '0 0 var(--space-xs)' }}>
              {parsha.he || parsha.name}
            </h1>
            <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.4rem', margin: '0 0 var(--space-xs)' }}>
              {transliterate(parsha.he) && parsha.he ? `${parsha.name} (${transliterate(parsha.he)})` : parsha.name}
            </p>

            <p style={{ color: 'var(--muted)', margin: '0 0 var(--space-lg)' }}>
              {formatGregorianRange(parsha.gregorian.start, parsha.gregorian.end)}
              {'. '}
              {parsha.hebrewDate.startHe} to {parsha.hebrewDate.endHe}.
            </p>

            {parsha.description && (
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '1.15rem', lineHeight: 1.7 }}>
                {parsha.description}
              </p>
            )}

            {parsha.offline ? (
              <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                <p style={{ margin: 0 }}>
                  Sefaria could not be reached, so the portion name comes from the
                  offline calendar. The verses, the aliyot, and the haftarah load
                  from Sefaria once the connection returns.
                </p>
              </div>
            ) : (
              <>
                <p style={{ marginTop: 'var(--space-lg)' }}>
                  <Link
                    to={`/parsha/${encodeURIComponent(parsha.name)}`}
                    className="pill-button pill-button--active"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <BookOpen size={18} aria-hidden="true" />
                    Read {parsha.name}
                  </Link>
                </p>

                <ParshaSummary parsha={parsha} />
              </>
            )}
          </article>
        )}
      </main>
    </>
  );
}

function LocaleToggle({ locale, onChange }) {
  return (
    <div
      role="group"
      aria-label="Reading calendar"
      style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}
    >
      <button
        type="button"
        className={locale === 'diaspora' ? 'pill-button pill-button--active' : 'pill-button'}
        aria-pressed={locale === 'diaspora'}
        onClick={() => onChange('diaspora')}
      >
        Diaspora
      </button>
      <button
        type="button"
        className={locale === 'israel' ? 'pill-button pill-button--active' : 'pill-button'}
        aria-pressed={locale === 'israel'}
        onClick={() => onChange('israel')}
      >
        Israel
      </button>
    </div>
  );
}
