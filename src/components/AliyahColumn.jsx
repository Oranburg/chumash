import { memo } from 'react';
import { stripCantillation } from '../lib/sefaria.js';

// An aliyah rendered as one flowing column of Hebrew, the way a column of the
// scroll reads, rather than a numbered list. The verses run continuously, right
// to left, in the Torah serif. The verse numbers are quiet superscripts the
// reader can hide entirely, so the eye follows the text and not the scaffolding.
// Each word stays a tappable lookup target, the same affordance as the reading
// view. Cantillation is off unless the reader asks for it.

const wordStyle = {
  cursor: 'help',
  textDecoration: 'underline',
  textDecorationStyle: 'dashed',
  textDecorationThickness: '1px',
  textUnderlineOffset: '0.22em',
  textDecorationColor: 'var(--border)',
  padding: '0 0.04em',
  borderRadius: 'var(--radius-sm)',
};

function wordHandlers(word, onWordTap) {
  return {
    role: 'button',
    tabIndex: 0,
    title: 'Look this word up',
    style: wordStyle,
    onClick: (e) => onWordTap(word, e.currentTarget),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onWordTap(word, e.currentTarget);
      }
    },
  };
}

function AliyahColumn({ verses, heSize = 32, showNumbers = true, showTaamim = false, onWordTap }) {
  if (!verses || verses.length === 0) return null;
  return (
    <div
      className="hebrew"
      dir="rtl"
      style={{ fontSize: `${heSize}px`, lineHeight: 2, margin: 0 }}
    >
      {verses.map((v) => {
        const he = showTaamim ? v.he : stripCantillation(v.he);
        if (!he) return null;
        const tokens = he.split(/(\s+)/).filter((t) => t.length > 0);
        return (
          <span key={v.ref || `${v.chapter}:${v.verse}`}>
            {showNumbers && (
              <sup
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.42em',
                  color: 'var(--muted)',
                  margin: '0 0.12em',
                  userSelect: 'none',
                }}
              >
                {v.verse}
              </sup>
            )}
            {tokens.map((tok, i) =>
              /^\s+$/.test(tok) ? (
                <span key={i}>{tok}</span>
              ) : (
                <span key={i} {...wordHandlers(tok, onWordTap)}>
                  {tok}
                </span>
              )
            )}{' '}
          </span>
        );
      })}
    </div>
  );
}

export default memo(AliyahColumn);
