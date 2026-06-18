import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Library, Minus, Plus, ScrollText } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ParshaSummary from '../components/ParshaSummary.jsx';
import ScrollColumn from '../components/ScrollColumn.jsx';
import StudyTable from '../components/StudyTable.jsx';
import WordPopover from '../components/WordPopover.jsx';
import ShnayimMikraTracker from '../components/ShnayimMikraTracker.jsx';
import { getThisWeeksParsha, ALIYAH_LABELS } from '../lib/parsha.js';
import { getParshaText } from '../lib/sefaria.js';
import { readLocale, writeLocale } from '../lib/locale.js';
import { BLESSING_BEFORE, BLESSING_AFTER } from '../lib/blessings.js';
import {
  readProgress,
  writeProgress,
  toggleMark,
  marksDone,
  passProgress,
  MARKS,
} from '../lib/shnayimMikra.js';

// The home page is the aliyah of the day, and the first thing the reader sees is
// the scroll. The day's aliyah renders as a column of a sefer Torah: the scribal
// STaM letterforms, bare consonants (a scroll has no vowels and no te'amim),
// justified into a column on a parchment panel. The Torah blessings frame it, the
// blessing said before in small gold above and the blessing said after in gold
// below. Beneath the scroll a switch opens the study table, where each verse is a
// small chart of transliteration, vocalized Hebrew, and English.
//
// The aliyah maps to the weekday, Sunday's reading being the first aliyah
// (Rishon) and Shabbat's the seventh (Shvi'i). Every word is tappable for a
// lookup. On the scroll, a tapped consonantal word looks up the vocalized word at
// the same position, so the transliteration is correct. Nothing is generated; on
// a fetch failure the page reports it and offers a retry rather than a spinner.

const HE_MIN = 22;
const HE_MAX = 56;
const HE_SIZE_STORAGE = 'chumash-home-he-size';
const NUMBERS_STORAGE = 'chumash-home-numbers';
const TAAMIM_STORAGE = 'chumash-home-taamim';
const VIEW_STORAGE = 'chumash-home-view';
const TRADITION_STORAGE = 'chumash-home-tradition';
const DEFAULT_HE_SIZE = 40;

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

// Read a saved value from a fixed set of allowed strings, for the view mode
// (scroll or study) and the scribal tradition (ashkenazi or sefardi).
function readSavedChoice(key, allowed, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v && allowed.includes(v)) return v;
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

  // The aliyah text, loaded once the parsha resolves and an aliyah is chosen.
  const [aliyah, setAliyah] = useState(null);
  const [aliyahLoading, setAliyahLoading] = useState(false);
  const [aliyahError, setAliyahError] = useState(null);

  // The aliyah the reader is looking at. It starts at the day's aliyah (Sunday's
  // Rishon through Shabbat's last), but the reader can jump to any aliyah in the
  // week; nothing is gated. A null index means "not chosen yet", which resolves
  // to the day's aliyah once the parsha and its aliyot are known.
  const [selectedIndex, setSelectedIndex] = useState(null);

  // The shnayim mikra record for this week's portion, keyed by its verse ref so
  // it resets cleanly to each new parsha. It is the learner's own record of
  // reading each aliyah twice in Hebrew and once in Onkelos.
  const [progress, setProgress] = useState({});

  // The view: the scroll hero by default, the study table on a toggle.
  const [view, setView] = useState(() =>
    readSavedChoice(VIEW_STORAGE, ['scroll', 'study'], 'scroll')
  );
  // The scribal tradition for the scroll: Ashkenazi or Sephardi letterforms.
  const [tradition, setTradition] = useState(() =>
    readSavedChoice(TRADITION_STORAGE, ['ashkenazi', 'sefardi'], 'ashkenazi')
  );

  // Reading controls, mirroring the reading view's patterns.
  const [showNumbers, setShowNumbers] = useState(() => readSavedBool(NUMBERS_STORAGE, true));
  const [showTaamim, setShowTaamim] = useState(() => readSavedBool(TAAMIM_STORAGE, false));
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
  const todayIndex = hasAliyot ? aliyahIndexForDate(today, aliyot) : -1;
  // The verse ref of the whole portion keys the week's record. A doubled portion
  // carries its own combined ref, so the record still resets to each new reading.
  const parshaRef = parsha ? parsha.ref : null;

  // The aliyah the reader is actually viewing: the chosen one if it is in range,
  // otherwise the day's aliyah. Selecting an aliyah never gates the others.
  const aliyahIndex =
    hasAliyot && selectedIndex != null && selectedIndex >= 0 && selectedIndex < aliyot.length
      ? selectedIndex
      : todayIndex;
  const aliyahRef = aliyahIndex >= 0 ? aliyot[aliyahIndex] : null;
  const aliyahLabel = aliyahIndex >= 0 ? ALIYAH_LABELS[aliyahIndex] || `Aliyah ${aliyahIndex + 1}` : '';

  // Load the week's shnayim mikra record when the portion changes (keyed on the
  // portion's verse ref), and clear any aliyah selection so the new week opens on
  // the day's aliyah. Keyed on the stable parshaRef, not on the record it sets.
  useEffect(() => {
    setProgress(parshaRef ? readProgress(parshaRef) : {});
    setSelectedIndex(null);
  }, [parshaRef]);

  // Persist the record whenever it changes, under the portion's key.
  const onToggleMark = useCallback(
    (markId) => {
      if (aliyahIndex < 0 || !parshaRef) return;
      setProgress((prev) => {
        const next = toggleMark(prev, aliyahIndex, markId);
        writeProgress(parshaRef, next);
        return next;
      });
    },
    [aliyahIndex, parshaRef]
  );

  const passes = passProgress(progress, aliyot.length);

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
    try { localStorage.setItem(VIEW_STORAGE, view); } catch { /* no persistence */ }
  }, [view]);
  useEffect(() => {
    try { localStorage.setItem(TRADITION_STORAGE, tradition); } catch { /* no persistence */ }
  }, [tradition]);

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
                  {selectedIndex != null && selectedIndex !== todayIndex
                    ? ' (jumped from today)'
                    : ''}
                </p>

                <AliyahWeek
                  aliyot={aliyot}
                  todayIndex={todayIndex}
                  selectedIndex={aliyahIndex}
                  progress={progress}
                  onSelect={setSelectedIndex}
                />

                <AliyahBody
                  aliyah={aliyah}
                  loading={aliyahLoading}
                  error={aliyahError}
                  onRetry={() => loadAliyah(aliyahRef)}
                  view={view}
                  tradition={tradition}
                  heSize={heSize}
                  showNumbers={showNumbers}
                  showTaamim={showTaamim}
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
                  view={view}
                  setView={setView}
                  tradition={tradition}
                  setTradition={setTradition}
                  showNumbers={showNumbers}
                  setShowNumbers={setShowNumbers}
                  showTaamim={showTaamim}
                  setShowTaamim={setShowTaamim}
                  heSize={heSize}
                  setHeSize={setHeSize}
                />

                <ShnayimMikraTracker
                  aliyahLabel={aliyahLabel}
                  marks={MARKS}
                  done={progress[aliyahIndex] || {}}
                  onToggle={onToggleMark}
                  passes={passes}
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

// The aliyah itself: the scroll column on a parchment panel by default, the
// study table when the reader toggles to it, and the loading and error states
// when the text is not in.
function AliyahBody({
  aliyah,
  loading,
  error,
  onRetry,
  view,
  tradition,
  heSize,
  showNumbers,
  showTaamim,
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

  return (
    <>
      {view === 'study' ? (
        <StudyTable
          verses={aliyah.verses}
          heSize={Math.max(22, Math.round(heSize * 0.75))}
          showNumbers={showNumbers}
          showTaamim={showTaamim}
          onWordTap={onWordTap}
        />
      ) : (
        <div className="scroll-panel">
          <ScrollColumn
            verses={aliyah.verses}
            tradition={tradition}
            heSize={heSize}
            showNumbers={showNumbers}
            onWordTap={onWordTap}
          />
        </div>
      )}

      <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
        {aliyah.ref} (text from Sefaria).
      </p>
    </>
  );
}

// The controls: a clear switch between the scroll and the study table, the
// scribal-tradition switch for the scroll, and the per-view options (verse
// numbers, cantillation in the study table, Hebrew size).
function Controls({
  view,
  setView,
  tradition,
  setTradition,
  showNumbers,
  setShowNumbers,
  showTaamim,
  setShowTaamim,
  heSize,
  setHeSize,
}) {
  const step = (delta) => setHeSize((s) => Math.min(HE_MAX, Math.max(HE_MIN, s + delta)));
  const labelStyle = { color: 'var(--muted)', fontSize: '0.85rem' };
  return (
    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
      <div role="group" aria-label="View" style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={view === 'scroll' ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={view === 'scroll'}
          onClick={() => setView('scroll')}
        >
          Scroll
        </button>
        <button
          type="button"
          className={view === 'study' ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={view === 'study'}
          onClick={() => setView('study')}
        >
          Study table
        </button>
      </div>

      {view === 'scroll' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
          <span style={labelStyle}>Scribal tradition</span>
          <button
            type="button"
            className={tradition === 'ashkenazi' ? 'pill-button pill-button--active' : 'pill-button'}
            aria-pressed={tradition === 'ashkenazi'}
            onClick={() => setTradition('ashkenazi')}
          >
            Ashkenazi
          </button>
          <button
            type="button"
            className={tradition === 'sefardi' ? 'pill-button pill-button--active' : 'pill-button'}
            aria-pressed={tradition === 'sefardi'}
            onClick={() => setTradition('sefardi')}
          >
            Sephardi
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
        <button
          type="button"
          className={showNumbers ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showNumbers}
          onClick={() => setShowNumbers(!showNumbers)}
        >
          Verse numbers
        </button>
        {view === 'study' && (
          <button
            type="button"
            className={showTaamim ? 'pill-button pill-button--active' : 'pill-button'}
            aria-pressed={showTaamim}
            onClick={() => setShowTaamim(!showTaamim)}
          >
            Cantillation marks
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: 'var(--space-md)' }}>
        <span style={labelStyle}>Hebrew size</span>
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
        to="/haftarah"
        className="pill-button"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ScrollText size={18} aria-hidden="true" />
        Read the haftarah
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

// The week as seven aliyot (and a maftir where the portion carries one). Each
// aliyah is a button: today's is marked, the one being read is pressed, and each
// carries its shnayim mikra count so the reader sees at a glance how far the
// reading has gone. Selecting one jumps the reading to it; nothing is gated, so
// any aliyah stays reachable on any day.
function AliyahWeek({ aliyot, todayIndex, selectedIndex, progress, onSelect }) {
  if (!Array.isArray(aliyot) || aliyot.length === 0) return null;
  return (
    <section style={{ marginBottom: 'var(--space-lg)' }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 var(--space-sm)' }}>
        The portion across the week. Today&rsquo;s aliyah is marked. You can read
        any aliyah on any day.
      </p>
      <div
        role="group"
        aria-label="The week's aliyot"
        style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}
      >
        {aliyot.map((ref, i) => {
          const label = ALIYAH_LABELS[i] || `Aliyah ${i + 1}`;
          const count = marksDone(progress, i);
          const isToday = i === todayIndex;
          const isActive = i === selectedIndex;
          return (
            <button
              key={ref || i}
              type="button"
              className={isActive ? 'pill-button pill-button--active' : 'pill-button'}
              aria-pressed={isActive}
              onClick={() => onSelect(i)}
              style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem', lineHeight: 1.2 }}
            >
              <span>{label}{isToday ? ' (today)' : ''}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                {count} of {MARKS.length}
              </span>
            </button>
          );
        })}
      </div>
    </section>
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
