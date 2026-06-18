import { memo } from 'react';
import { stripVowels } from '../lib/sefaria.js';

// The aliyah of the day rendered as a column of a sefer Torah. This is the
// centerpiece of the home: the first thing the reader sees. The text runs right
// to left, justified into a column on a parchment panel, in the scribal STaM
// letterforms (Stam Ashkenaz or Stam Sefarad, the reader's choice).
//
// A Torah scroll has no vowels and no cantillation, so the display is bare
// consonants: each word is shown with its nikud and te'amim stripped. But the
// transliteration popover needs the vowels, and the verses align one to one with
// the vocalized text Sefaria supplies, so a tapped word looks up the ORIGINAL
// vocalized word at the same position, not the consonantal form on screen. The
// display word and the lookup word are carried separately for exactly this.
//
// Verse numbers are quiet superscripts the reader can hide. They are not part of
// a real scroll, so they sit small and faint and out of the way.

function wordHandlers(vocalizedWord, onWordTap) {
  return {
    className: 'scroll-word',
    role: 'button',
    tabIndex: 0,
    title: 'Look this word up',
    onClick: (e) => onWordTap(vocalizedWord, e.currentTarget),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onWordTap(vocalizedWord, e.currentTarget);
      }
    },
  };
}

function ScrollColumn({ verses, tradition = 'ashkenazi', heSize = 40, showNumbers = true, onWordTap }) {
  if (!verses || verses.length === 0) return null;
  const sefardi = tradition === 'sefardi';
  return (
    <div
      className={'scroll-column hebrew' + (sefardi ? ' is-sefardi' : '')}
      dir="rtl"
      lang="he"
      style={{ fontSize: `${heSize}px` }}
    >
      {verses.map((v) => {
        // Split the vocalized verse into its words, keeping the whitespace runs
        // as their own tokens so the column spacing is the source's spacing. Each
        // word keeps its vowels for lookup; its display form has them stripped.
        const tokens = (v.he || '').split(/(\s+)/).filter((t) => t.length > 0);
        if (tokens.length === 0) return null;
        return (
          <span key={v.ref || `${v.chapter}:${v.verse}`}>
            {showNumbers && (
              <sup className="scroll-verse-num" aria-hidden="true">
                {v.verse}
              </sup>
            )}
            {tokens.map((tok, i) => {
              if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
              const display = stripVowels(tok);
              // A token that is pure punctuation strips to nothing; show it as
              // given and leave it untappable.
              if (!display) return <span key={i}>{tok}</span>;
              return (
                <span key={i} {...wordHandlers(tok, onWordTap)}>
                  {display}
                </span>
              );
            })}{' '}
          </span>
        );
      })}
    </div>
  );
}

export default memo(ScrollColumn);
