import { useState } from 'react';
import { MessagesSquare, ChevronDown, ChevronUp } from 'lucide-react';
import TappableHebrew from './TappableHebrew.jsx';
import VerseHavruta from './VerseHavruta.jsx';
import { stripCantillation } from '../lib/sefaria.js';

// One prominent entry to the study partner, on the home page where the reader
// already is. The day's aliyah is right here, so this opens the verse-by-verse
// partner on it without the reader having to find the full reading view. It is
// closed by default; opening it lays out each verse of today's aliyah with the
// "Study this verse with your havruta" box beneath it.
//
// The partner itself is unchanged. This component only surfaces it and shows the
// verse text so the reader has something to read before she writes what she
// noticed. Nothing is generated here; VerseHavruta quotes only the verse and
// what Sefaria returns, and asks the reader to set a key in Settings if none is
// saved yet.
//
// Props:
//   aliyah:     the loaded aliyah { verses: [{ ref, chapter, verse, he, en }] }.
//   aliyahLabel: the aliyah's name, for the heading.
//   showTaamim: whether to keep the cantillation marks on the Hebrew.
//   heSize:     the home page's Hebrew size, capped here so the verse list reads
//               at a comfortable size rather than the large scroll size.
//   onWordTap:  the word-lookup handler, shared with the rest of the page.
export default function AliyahHavruta({ aliyah, aliyahLabel, showTaamim, heSize, onWordTap }) {
  const [open, setOpen] = useState(false);
  if (!aliyah || !Array.isArray(aliyah.verses) || aliyah.verses.length === 0) return null;
  const label = aliyahLabel || 'today’s aliyah';
  const verseHeSize = Math.min(heSize || 26, 28);

  return (
    <section className="card" style={{ marginTop: 'var(--space-lg)', borderColor: 'var(--gold)' }}>
      <button
        type="button"
        className="pill-button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          color: 'var(--gold)',
          borderColor: 'var(--gold)',
          fontSize: '1rem',
        }}
      >
        <MessagesSquare size={18} aria-hidden="true" />
        Study {label} with your havruta
        {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 'var(--space-md) 0 0' }}>
            Read a verse, then write what you noticed or found hard. Your havruta
            answers what you wrote and opens the commentators on that difficulty.
            It quotes only the verse and what Sefaria returns, and it never
            invents. Set an AI key in Settings the first time.
          </p>

          <ol style={{ listStyle: 'none', padding: 0, margin: 'var(--space-md) 0 0' }}>
            {aliyah.verses.map((verse) => (
              <li
                key={verse.ref}
                style={{ padding: 'var(--space-md) 0', borderTop: '1px solid var(--border)' }}
              >
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}
                >
                  {verse.chapter}:{verse.verse}
                </span>
                {verse.he && (
                  <div style={{ marginTop: 'var(--space-xs)' }}>
                    <TappableHebrew
                      html={showTaamim ? verse.he : stripCantillation(verse.he)}
                      fontSize={verseHeSize}
                      onWordTap={onWordTap}
                    />
                  </div>
                )}
                {verse.en && (
                  <p
                    style={{
                      fontFamily: 'var(--font-accent)',
                      fontSize: '18px',
                      lineHeight: 1.7,
                      margin: 'var(--space-sm) 0 0',
                      color: 'var(--text)',
                    }}
                  >
                    {verse.en}
                  </p>
                )}
                <VerseHavruta verse={verse} enSize={18} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
