import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getVerseCommentaries, sefariaUrl } from '../lib/sefaria.js';
import TappableHebrew from './TappableHebrew.jsx';

// A per-verse control that opens the classical parshanim on this one verse:
// Onkelos, Rashi, Rashbam, Ibn Ezra, Ramban, and Sforno, in that order, fetched
// live from Sefaria when the reader opens the panel. It is collapsed by default
// and loads only on the first open, so a long portion does not fetch every
// verse's commentary up front.
//
// Every word of commentary comes from Sefaria, stripped of HTML but otherwise
// verbatim. The Hebrew is tappable for word lookup the same way the verse text
// is; the English reads as plain prose. A commentator Sefaria returns nothing
// for on this verse simply does not appear. On a fetch failure the panel reports
// the failure and offers a retry rather than show a perpetual spinner or invent
// any commentary.
//
// Props:
//   verseRef:    the exact Sefaria ref of this verse (e.g. "Numbers 16:1").
//   heSize:      the reader's chosen Hebrew type size, in pixels.
//   enSize:      the reader's chosen English type size, in pixels.
//   onWordTap:   the page's word-lookup handler, passed to the Hebrew.
export default function VerseCommentary({ verseRef, heSize, enSize, onWordTap }) {
  const [open, setOpen] = useState(false);
  // `attempt` bumps on a retry so the load effect re-runs against the same ref.
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]); // [{ commentator, heTitle, he, en }]

  // Load the commentary the first time the reader opens the panel, and again on a
  // retry. The effect keys on stable inputs only (open, verseRef, attempt) and
  // never on the status it sets, so React 18 StrictMode's double-invoke still
  // resolves to a real load rather than stalling. The data layer does not cache
  // links, so reopening a closed panel reuses the entries already in state.
  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const result = await getVerseCommentaries(verseRef);
        if (!live) return;
        setEntries(Array.isArray(result) ? result : []);
        setStatus('done');
      } catch (err) {
        if (!live) return;
        setError(err instanceof Error ? err.message : 'The commentary did not load.');
        setStatus('error');
      }
    })();

    return () => {
      live = false;
    };
  }, [open, verseRef, attempt]);

  return (
    <div style={{ marginTop: 'var(--space-sm)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={toggleStyle}
      >
        <BookOpen size={16} aria-hidden="true" />
        Commentaries
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div style={panelStyle}>
          {status === 'loading' && (
            <p style={mutedLine}>Loading the commentary from Sefaria. One moment.</p>
          )}

          {status === 'error' && (
            <div>
              <p style={mutedLine}>
                The commentary could not be loaded from Sefaria right now, so there
                is nothing to show. {error}
              </p>
              <button
                type="button"
                className="pill-button"
                style={{ marginTop: 'var(--space-sm)' }}
                onClick={() => setAttempt((n) => n + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {status === 'done' && entries.length === 0 && (
            <p style={mutedLine}>
              Sefaria carries none of these commentators on this verse.
            </p>
          )}

          {status === 'done' && entries.length > 0 && (
            <>
              <p style={introLine}>
                Each commentator below reads this one verse. Every word is from
                Sefaria.
              </p>
              {entries.map((entry) => (
                <div key={entry.commentator} style={rowStyle}>
                  <div style={labelRow}>
                    <span style={commentatorLabel}>{entry.commentator}</span>
                    {entry.heTitle && (
                      <span className="hebrew" style={heTitleLabel} dir="rtl">
                        {entry.heTitle}
                      </span>
                    )}
                  </div>

                  {entry.he.map((line, i) => (
                    <div key={`he-${i}`} style={{ marginBottom: 'var(--space-xs)' }}>
                      <TappableHebrew
                        html={line}
                        fontSize={heSize}
                        onWordTap={onWordTap}
                        showTranslit={false}
                      />
                    </div>
                  ))}

                  {entry.en.map((line, i) => (
                    <p
                      key={`en-${i}`}
                      style={{
                        fontFamily: 'var(--font-accent)',
                        fontSize: `${enSize}px`,
                        lineHeight: 1.6,
                        margin: 'var(--space-xs) 0 0',
                        color: 'var(--text)',
                      }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </>
          )}

          <a
            href={sefariaUrl(verseRef)}
            target="_blank"
            rel="noopener noreferrer"
            style={sefariaLink}
          >
            See this verse on Sefaria <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}

const toggleStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.25rem 0',
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const panelStyle = {
  marginTop: 'var(--space-sm)',
  padding: 'var(--space-md)',
  background: 'var(--bg-soft)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
};

const introLine = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  margin: '0 0 var(--space-md)',
};

const rowStyle = {
  paddingBottom: 'var(--space-md)',
  marginBottom: 'var(--space-md)',
  borderBottom: '1px solid var(--border)',
};

const labelRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 'var(--space-sm)',
  marginBottom: 'var(--space-xs)',
  flexWrap: 'wrap',
};

const commentatorLabel = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: 'var(--blue-light)',
};

const heTitleLabel = {
  fontFamily: 'var(--font-hebrew)',
  fontSize: '1rem',
  color: 'var(--gold)',
};

const mutedLine = {
  color: 'var(--muted)',
  margin: 0,
};

const sefariaLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.9rem',
  color: 'var(--accent)',
};
