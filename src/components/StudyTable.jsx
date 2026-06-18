import { memo } from 'react';
import TappableHebrew from './TappableHebrew.jsx';
import { stripCantillation } from '../lib/sefaria.js';
import { transliterate } from '../lib/transliterate.js';

// The study table: a toggle beneath the scroll, not the default. Each verse is a
// small four-cell chart. Transliteration sits top-left, the vocalized Hebrew
// top-right, and the English translation spans the full width along the bottom.
// Every cell is a bordered box. On a narrow screen the chart collapses to one
// column in the order Hebrew, transliteration, English (the CSS handles the
// reorder; the DOM order here matches it so nothing reflows oddly).
//
// Cantillation is off by default; the showTaamim flag keeps the te'amim when the
// reader asks. The Hebrew words stay tappable for the same lookup popover the
// rest of the app uses.

// The flowing transliteration of a verse: the Hebrew without cantillation, each
// word romanized and rejoined as one readable line. It sounds the verse out; it
// is not a translation, so it does not mislead.
function transliterateVerse(he) {
  return stripCantillation(he)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => transliterate(w) || w)
    .join(' ')
    .trim();
}

function StudyTable({ verses, heSize = 28, showNumbers = true, showTaamim = false, onWordTap }) {
  if (!verses || verses.length === 0) return null;
  return (
    <div>
      {verses.map((v) => {
        const he = showTaamim ? v.he : stripCantillation(v.he);
        const translit = transliterateVerse(v.he);
        return (
          <div key={v.ref || `${v.chapter}:${v.verse}`} className="study-verse">
            <div className="study-cell study-cell--hebrew">
              {showNumbers && (
                <span className="study-verse-num" aria-hidden="true">{v.verse}</span>
              )}
              <TappableHebrew html={he} fontSize={heSize} onWordTap={onWordTap} showTranslit={false} />
            </div>
            <div className="study-cell study-cell--translit" dir="ltr">
              {showNumbers && <span className="study-verse-num">{v.verse}</span>}
              {translit}
            </div>
            <div className="study-cell study-cell--english" dir="ltr">
              {v.en || 'Sefaria carries no English for this verse.'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(StudyTable);
