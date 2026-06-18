import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Library, Minus, Plus } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ParshaSummary from '../components/ParshaSummary.jsx';
import AliyahColumn from '../components/AliyahColumn.jsx';
import TappableHebrew from '../components/TappableHebrew.jsx';
import WordPopover from '../components/WordPopover.jsx';
import { getThisWeeksParsha, ALIYAH_LABELS } from '../lib/parsha.js';
import { getParshaText, stripCantillation } from '../lib/sefaria.js';
import { transliterate } from '../lib/transliterate.js';
import { readLocale, writeLocale } from '../lib/locale.js';
import { BLESSING_BEFORE, BLESSING_AFTER } from '../lib/blessings.js';

// The home page is the aliyah of the day. The Torah blessings frame the reading:
// the blessing said before the aliyah sits at the top in small gold Hebrew, the
// day's aliyah runs beneath it as one flowing column, and the blessing said after
// closes it. The aliyah maps to the weekday, Sunday's reading being the first
// aliyah (Rishon) and Shabbat's the seventh (Shvi'i). Every word is tappable for a
// lookup, the same affordance as the reading view. Nothing is generated; on a
// fetch failure the page reports it and offers a retry rather than a spinner.

const HE_MIN = 22;
const HE_MAX = 52;
const HE_SIZE_STORAGE = 'chumash-home-he-size';
const NUMBERS_STORAGE = 'chumash-home-numbers';
const TAAMIM_STORAGE = 'chumash-home-taamim';
const TRANSLIT_STORAGE = 'chumash-home-translit';
const DEFAULT_HE_SIZE = 34;

// The flowing transliteration of a verse: the Hebrew without cantillation, each
// word romanized and rejoined as one readable line, so a reader can sound the
// verse out without the interlinear stacking. It is exact, not a translation, so
// it does not mislead.
function transliterateVerse(he) {
  return stripCantillation(he)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => transliterate(w) || w)
    .join(' ')
    .trim();
}

function readSavedBool(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === 'on') return true;
    if (v === 'off') return false;
  } catch {
    // localStorage unavailable; use the default.
  }
  return fallback;
}

function readSavedSize(key, fallback, min, max) {
  try {
    const saved = Number(localStorage.getItem(key));
    if (Number.isFinite(saved) && saved >= min && saved <= max) return saved;
  } catch {
    // localStorage unavailable; use the default.
  }
  return fallback;
}

// Pick the aliyah for a given weekday: Sunday (0) reads the first aliyah, through
// Shabbat (6) the seventh. The index is clamped to the aliyot the week actually
// carries, so a portion with fewer than seven listed ranges still resolves.
function aliyahIndexForDate(date, aliyot) {
  const day = date.getDay();
  const last = Math.max(0, aliyot.length - 1);
  return Math.min(day, last);
}

const blessingStyle = {
  color: 'var(--gold)',
  fontSize: '1.05rem',
  lineHeight: 2,
  margin: 0,
  fontWeight: 500,
};

export default function ThisWeek() {
  const [locale, setLocale] = useState(readLocale);
  const [parsha, setParsha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The day's aliyah text, loaded once the parsha resolves.
  const [aliyah, setAliyah] = useState(null);
  const [aliyahLoading, setAliyahLoading] = useState(false);
  const [aliyahError, setAliyahError] = useState(null);

  // Reading controls, mirroring the reading view's patterns.
  const [showNumbers, setShowNumbers] = useState(() => readSavedBool(NUMBERS_STORAGE, true));
  const [showTaamim, setShowTaamim] = useState(() => readSavedBool(TAAMIM_STORAGE, false));
  const [showTranslit, setShowTranslit] = useState(() => readSavedBool(TRANSLIT_STORAGE, false));
  const [showEnglish, setShowEnglish] = useState(false);
  const [heSize, setHeSize] = useState(() =>
    readSavedSize(HE_SIZE_STORAGE, DEFAULT_HE_SIZE, HE_MIN, HE_MAX)
  );

  // Word lookup, wired exactly as the reading view wires it.
  const [activeWord, setActiveWord] = useState(null);
  const openWord = useCallback((word, el) => {
    const rect = el ? el.getBoundingClientRect() : null;
    setActiveWord({ word, rect });
  }, []);
  const closeWord = useCallback(() => setActiveWord(null), []);

  const today = new Date();

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

  // Which aliyah today's reading is, once the parsha is known and carries aliyot.
  const aliyot = parsha && Array.isArray(parsha.aliyot) ? parsha.aliyot : [];
  const hasAliyot = !parsha?.offline && aliyot.length > 0;
  const aliyahIndex = hasAliyot ? aliyahIndexForDate(today, aliyot) : -1;
  const aliyahRef = aliyahIndex >= 0 ? aliyot[aliyahIndex] : null;
  const aliyahLabel = aliyahIndex >= 0 ? ALIYAH_LABELS[aliyahIndex] || `Aliyah ${aliyahIndex + 1}` : '';

  const loadAliyah = useCallback(async (rangeRef) => {
    if (!rangeRef) return;
    setAliyahLoading(true);
    setAliyahError(null);
    setActiveWord(null);
    try {
      const result = await getParshaText(rangeRef);
      setAliyah(result);
    } catch (err) {
      setAliyahError(err instanceof Error ? err.message : 'Something went wrong.');
      setAliyah(null);
    } finally {
      setAliyahLoading(false);
    }
  }, []);

  useEffect(() => {
    if (aliyahRef) {
      loadAliyah(aliyahRef);
    } else {
      setAliyah(null);
      setAliyahError(null);
    }
  }, [aliyahRef, loadAliyah]);

  // Persist the reading preferences.
  useEffect(() => {
    try { localStorage.setItem(HE_SIZE_STORAGE, String(heSize)); } catch { /* no persistence */ }
  }, [heSize]);
  useEffect(() => {
    try { localStorage.setItem(NUMBERS_STORAGE, showNumbers ? 'on' : 'off'); } catch { /* no persistence */ }
  }, [showNumbers]);
  useEffect(() => {
    try { localStorage.setItem(TAAMIM_STORAGE, showTaamim ? 'on' : 'off'); } catch { /* no persistence */ }
  }, [showTaamim]);
  useEffect(() => {
    try { localStorage.setItem(TRANSLIT_STORAGE, showTranslit ? 'on' : 'off'); } catch { /* no persistence */ }
  }, [showTranslit]);

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
            {parsha.offline || !hasAliyot ? (
              <OfflineHero parsha={parsha} />
            ) : (
              <>
                <p
                  className="hebrew"
                  dir="rtl"
                  lang="he"
                  style={{ ...blessingStyle, marginBottom: 'var(--space-lg)' }}
                >
                  {BLESSING_BEFORE}
                </p>

                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-headline)',
                    letterSpacing: '0.04em',
                    margin: '0 0 var(--space-md)',
                  }}
                >
                  {(parsha.he || parsha.name)} {'·'} {aliyahLabel}
                </p>

                <AliyahBody
                  aliyah={aliyah}
                  loading={aliyahLoading}
                  error={aliyahError}
                  onRetry={() => loadAliyah(aliyahRef)}
                  heSize={heSize}
                  showNumbers={showNumbers}
                  showTaamim={showTaamim}
                  showTranslit={showTranslit}
                  showEnglish={showEnglish}
                  onWordTap={openWord}
                />

                {aliyah && !aliyahLoading && !aliyahError && (
                  <p
                    className="hebrew"
                    dir="rtl"
                    lang="he"
                    style={{ ...blessingStyle, marginTop: 'var(--space-lg)' }}
                  >
                    {BLESSING_AFTER}
                  </p>
                )}

                <Controls
                  showNumbers={showNumbers}
                  setShowNumbers={setShowNumbers}
                  showTaamim={showTaamim}
                  setShowTaamim={setShowTaamim}
                  showTranslit={showTranslit}
                  setShowTranslit={setShowTranslit}
                  showEnglish={showEnglish}
                  setShowEnglish={setShowEnglish}
                  heSize={heSize}
                  setHeSize={setHeSize}
                />

                <OnwardPaths parsha={parsha} />

                <ParshaSummary parsha={parsha} />
              </>
            )}
          </article>
        )}
      </main>

      {activeWord && (
        <WordPopover word={activeWord.word} anchor={activeWord.rect} onClose={closeWord} />
      )}
    </>
  );
}

// The aliyah itself: the flowing column when the text is in, the loading and
// error states when it is not, and the optional English beneath when the reader
// asks to see it.
function AliyahBody({
  aliyah,
  loading,
  error,
  onRetry,
  heSize,
  showNumbers,
  showTaamim,
  showTranslit,
  showEnglish,
  onWordTap,
}) {
  if (loading) {
    return (
      <p style={{ color: 'var(--muted)' }}>
        Loading today&rsquo;s aliyah from Sefaria. One moment.
      </p>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p>
          Today&rsquo;s aliyah could not be loaded right now. The app shows only
          what Sefaria supplies, so there is nothing to display until the
          connection returns.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
        <button type="button" className="pill-button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (!aliyah || aliyah.verses.length === 0) {
    return (
      <p style={{ color: 'var(--muted)' }}>
        Sefaria returned no verses for today&rsquo;s aliyah.
      </p>
    );
  }

  // With English or transliteration on, the aliyah reads as a small chart: each
  // verse a row of two boxes, the Hebrew on the right and the chosen companion
  // (English by default, transliteration when asked) on the left. With both off,
  // it is the flowing column. The two are mutually exclusive, so it is always two
  // boxes, never three.
  const pairMode = showEnglish || showTranslit;

  return (
    <>
      {pairMode ? (
        <div>
          {aliyah.verses.map((v) => {
            const he = showTaamim ? v.he : stripCantillation(v.he);
            const companion = showTranslit ? transliterateVerse(v.he) : (v.en || '');
            return (
              <div key={v.ref} className="aliyah-pair">
                <div className="pair-cell pair-hebrew">
                  {showNumbers && (
                    <sup className="pair-num" aria-hidden="true">{v.verse}</sup>
                  )}
                  <TappableHebrew html={he} fontSize={heSize} onWordTap={onWordTap} showTranslit={false} />
                </div>
                <div className={'pair-cell pair-second' + (showTranslit ? ' is-translit' : '')}>
                  {showNumbers && <span className="pair-num">{v.verse}</span>}
                  {companion}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AliyahColumn
          verses={aliyah.verses}
          heSize={heSize}
          showNumbers={showNumbers}
          showTaamim={showTaamim}
          onWordTap={onWordTap}
        />
      )}

      <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
        {aliyah.ref} (text from Sefaria).
      </p>
    </>
  );
}

// The quiet controls row: verse numbers, cantillation, the English reveal, and
// Hebrew size. The reading view's patterns, kept to what the home page needs.
function Controls({
  showNumbers,
  setShowNumbers,
  showTaamim,
  setShowTaamim,
  showTranslit,
  setShowTranslit,
  showEnglish,
  setShowEnglish,
  heSize,
  setHeSize,
}) {
  const step = (delta) => setHeSize((s) => Math.min(HE_MAX, Math.max(HE_MIN, s + delta)));
  return (
    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={showNumbers ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showNumbers}
          onClick={() => setShowNumbers(!showNumbers)}
        >
          Verse numbers
        </button>
        <button
          type="button"
          className={showTaamim ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showTaamim}
          onClick={() => setShowTaamim(!showTaamim)}
        >
          Cantillation marks
        </button>
        <button
          type="button"
          className={showEnglish ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showEnglish}
          onClick={() => { setShowEnglish(!showEnglish); if (!showEnglish) setShowTranslit(false); }}
        >
          English
        </button>
        <button
          type="button"
          className={showTranslit ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showTranslit}
          onClick={() => { setShowTranslit(!showTranslit); if (!showTranslit) setShowEnglish(false); }}
        >
          Transliteration
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: 'var(--space-md)' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Hebrew size</span>
        <button
          type="button"
          className="icon-button icon-button--sm"
          onClick={() => step(-2)}
          aria-label="Shrink the Hebrew"
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
          className="icon-button icon-button--sm"
          onClick={() => step(2)}
          aria-label="Grow the Hebrew"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

// The two onward paths: into the verse-by-verse study view for the whole portion,
// and out to the browse-by-book navigation.
function OnwardPaths({ parsha }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        flexWrap: 'wrap',
        marginTop: 'var(--space-lg)',
      }}
    >
      <Link
        to={`/parsha/${encodeURIComponent(parsha.name)}`}
        className="pill-button pill-button--active"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <BookOpen size={18} aria-hidden="true" />
        Read the whole portion
      </Link>
      <Link
        to="/browse"
        className="pill-button"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <Library size={18} aria-hidden="true" />
        Browse the books
      </Link>
    </div>
  );
}

// When Sefaria is unreachable, or the week carries no aliyot breakdown, the page
// names the portion and says plainly what is missing, then offers the onward
// paths. It never spins and never invents the text.
function OfflineHero({ parsha }) {
  return (
    <>
      <h1 className="hebrew" style={{ fontSize: '2.5rem', color: 'var(--accent-2)', margin: '0 0 var(--space-xs)' }}>
        {parsha.he || parsha.name}
      </h1>
      <p style={{ fontFamily: 'var(--font-headline)', fontSize: '1.3rem', margin: '0 0 var(--space-md)' }}>
        {parsha.name}
      </p>
      <div className="card">
        <p style={{ margin: 0 }}>
          {parsha.offline
            ? 'Sefaria could not be reached, so the portion name comes from the offline calendar. The aliyah text and the blessings load from Sefaria once the connection returns.'
            : 'Sefaria did not return an aliyah breakdown for this week, so there is no single aliyah to show. You can still read the whole portion.'}
        </p>
      </div>
      <OnwardPaths parsha={parsha} />
      {!parsha.offline && <ParshaSummary parsha={parsha} />}
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
