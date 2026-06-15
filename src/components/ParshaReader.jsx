import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus, ExternalLink } from 'lucide-react';
import {
  getParshaText,
  stripCantillation,
  sefariaUrl,
} from '../lib/sefaria.js';
import TappableHebrew from './TappableHebrew.jsx';
import WordPopover from './WordPopover.jsx';
import TranslationCompare from './TranslationCompare.jsx';

// The verse-by-verse reading view for a portion. It takes the portion's verse
// range (a Sefaria ref like "Numbers 16:1-18:32"), fetches the text from Sefaria,
// and renders each verse: the Hebrew with vowels (cantillation off by default),
// an English translation, the tappable transliteration carried over from havruta,
// and the per-verse translation-compare. Nothing is generated; on a fetch failure
// the view reports it and shows nothing invented, never a perpetual spinner.

const VIEWS = [
  { id: 'both', label: 'Both' },
  { id: 'hebrew', label: 'Hebrew only' },
  { id: 'english', label: 'English only' },
];

const HE_MIN = 18;
const HE_MAX = 44;
const EN_MIN = 14;
const EN_MAX = 28;

const VIEW_STORAGE = 'chumash-view';
const HE_SIZE_STORAGE = 'chumash-he-size';
const EN_SIZE_STORAGE = 'chumash-en-size';
const TRANSLIT_STORAGE = 'chumash-translit';
const TAAMIM_STORAGE = 'chumash-taamim';

const DEFAULT_VIEW = 'both';
const DEFAULT_HE_SIZE = 28;
const DEFAULT_EN_SIZE = 18;

const TRANSLIT_DISCLAIMER =
  'Transliteration follows the Shofar magazine chart for the consonants. It is a pronunciation guide, not authority.';

function readSavedView() {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE);
    if (VIEWS.some((v) => v.id === saved)) return saved;
  } catch {
    // localStorage unavailable; use the default.
  }
  return DEFAULT_VIEW;
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

export default function ParshaReader({ rangeRef, title }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [view, setView] = useState(readSavedView);
  const [heSize, setHeSize] = useState(() =>
    readSavedSize(HE_SIZE_STORAGE, DEFAULT_HE_SIZE, HE_MIN, HE_MAX)
  );
  const [enSize, setEnSize] = useState(() =>
    readSavedSize(EN_SIZE_STORAGE, DEFAULT_EN_SIZE, EN_MIN, EN_MAX)
  );
  const [showTranslit, setShowTranslit] = useState(() =>
    readSavedBool(TRANSLIT_STORAGE, false)
  );
  // Cantillation (te'amim) is off by default, as the design asks. The toggle lets
  // a reader who wants the marks bring them back.
  const [showTaamim, setShowTaamim] = useState(() =>
    readSavedBool(TAAMIM_STORAGE, false)
  );

  const [activeWord, setActiveWord] = useState(null);
  const openWord = useCallback((word, el) => {
    const rect = el ? el.getBoundingClientRect() : null;
    setActiveWord({ word, rect });
  }, []);
  const closeWord = useCallback(() => setActiveWord(null), []);

  const load = useCallback(async () => {
    if (!rangeRef) {
      setError('This portion has no verse reference to load.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setActiveWord(null);
    try {
      const result = await getParshaText(rangeRef);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [rangeRef]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try { localStorage.setItem(VIEW_STORAGE, view); } catch { /* no persistence */ }
  }, [view]);
  useEffect(() => {
    try { localStorage.setItem(HE_SIZE_STORAGE, String(heSize)); } catch { /* no persistence */ }
  }, [heSize]);
  useEffect(() => {
    try { localStorage.setItem(EN_SIZE_STORAGE, String(enSize)); } catch { /* no persistence */ }
  }, [enSize]);
  useEffect(() => {
    try { localStorage.setItem(TRANSLIT_STORAGE, showTranslit ? 'on' : 'off'); } catch { /* no persistence */ }
  }, [showTranslit]);
  useEffect(() => {
    try { localStorage.setItem(TAAMIM_STORAGE, showTaamim ? 'on' : 'off'); } catch { /* no persistence */ }
  }, [showTaamim]);

  if (loading) {
    return (
      <p style={{ color: 'var(--muted)' }}>
        Loading this portion from Sefaria. One moment.
      </p>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p>
          The text could not be loaded right now. The app shows only what Sefaria
          supplies, so there is nothing to display until the connection returns.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{error}</p>
        <button type="button" className="pill-button" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!data || data.verses.length === 0) {
    return (
      <p style={{ color: 'var(--muted)' }}>
        Sefaria returned no verses for this portion.
      </p>
    );
  }

  const showHebrew = view === 'both' || view === 'hebrew';
  const showEnglish = view === 'both' || view === 'english';

  return (
    <section>
      <Controls
        view={view}
        setView={setView}
        heSize={heSize}
        setHeSize={setHeSize}
        enSize={enSize}
        setEnSize={setEnSize}
        showTranslit={showTranslit}
        setShowTranslit={setShowTranslit}
        showTaamim={showTaamim}
        setShowTaamim={setShowTaamim}
      />

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {data.verses.map((v) => (
          <Verse
            key={v.ref}
            verse={v}
            showHebrew={showHebrew}
            showEnglish={showEnglish}
            heSize={heSize}
            enSize={enSize}
            showTranslit={showTranslit}
            showTaamim={showTaamim}
            onWordTap={openWord}
          />
        ))}
      </ol>

      <p style={{ margin: 'var(--space-lg) 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
        {data.ref} (text from Sefaria).{' '}
        <a
          href={sefariaUrl(rangeRef)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          Open {title || 'this portion'} on Sefaria <ExternalLink size={14} aria-hidden="true" />
        </a>
      </p>

      {activeWord && (
        <WordPopover word={activeWord.word} anchor={activeWord.rect} onClose={closeWord} />
      )}
    </section>
  );
}

// One verse: the verse number, the Hebrew (cantillation stripped unless the
// reader turned the te'amim on), the English, and the translation-compare.
function Verse({
  verse,
  showHebrew,
  showEnglish,
  heSize,
  enSize,
  showTranslit,
  showTaamim,
  onWordTap,
}) {
  const he = showTaamim ? verse.he : stripCantillation(verse.he);
  return (
    <li
      style={{
        padding: 'var(--space-md) 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--muted)',
        }}
      >
        {verse.chapter}:{verse.verse}
      </span>
      {showHebrew && he && (
        <div style={{ marginTop: 'var(--space-xs)' }}>
          <TappableHebrew
            html={he}
            fontSize={heSize}
            onWordTap={onWordTap}
            showTranslit={showTranslit}
          />
        </div>
      )}
      {showEnglish && verse.en && (
        <p
          style={{
            fontFamily: 'var(--font-accent)',
            fontSize: `${enSize}px`,
            lineHeight: 1.7,
            margin: showHebrew ? 'var(--space-sm) 0 0' : 'var(--space-xs) 0 0',
            color: 'var(--text)',
          }}
        >
          {verse.en}
        </p>
      )}
      {showEnglish && verse.en && (
        <TranslationCompare segmentRef={verse.ref} defaultEn={verse.en} enSize={enSize} />
      )}
    </li>
  );
}

function Controls({
  view,
  setView,
  heSize,
  setHeSize,
  enSize,
  setEnSize,
  showTranslit,
  setShowTranslit,
  showTaamim,
  setShowTaamim,
}) {
  const step = (set, value, delta, min, max) =>
    set(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div
        role="group"
        aria-label="Reading view"
        style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}
      >
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={view === v.id ? 'pill-button pill-button--active' : 'pill-button'}
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-lg)',
          flexWrap: 'wrap',
          marginTop: 'var(--space-md)',
        }}
      >
        <SizeControl
          label="Hebrew size"
          onMinus={() => step(setHeSize, heSize, -2, HE_MIN, HE_MAX)}
          onPlus={() => step(setHeSize, heSize, 2, HE_MIN, HE_MAX)}
        />
        <SizeControl
          label="Text size"
          onMinus={() => step(setEnSize, enSize, -1, EN_MIN, EN_MAX)}
          onPlus={() => step(setEnSize, enSize, 1, EN_MIN, EN_MAX)}
        />
      </div>

      <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={showTranslit ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showTranslit}
          onClick={() => setShowTranslit(!showTranslit)}
        >
          Show transliteration
        </button>
        <button
          type="button"
          className={showTaamim ? 'pill-button pill-button--active' : 'pill-button'}
          aria-pressed={showTaamim}
          onClick={() => setShowTaamim(!showTaamim)}
        >
          Show cantillation marks
        </button>
      </div>

      {showTranslit && (
        <p
          style={{
            color: 'var(--muted)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            margin: 'var(--space-sm) 0 0',
          }}
        >
          {TRANSLIT_DISCLAIMER}
        </p>
      )}
    </div>
  );
}

function SizeControl({ label, onMinus, onPlus }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</span>
      <button
        type="button"
        className="icon-button icon-button--sm"
        onClick={onMinus}
        aria-label={`Shrink ${label.toLowerCase()}`}
      >
        <Minus size={18} />
      </button>
      <button
        type="button"
        className="icon-button icon-button--sm"
        onClick={onPlus}
        aria-label={`Grow ${label.toLowerCase()}`}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
