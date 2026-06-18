import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Music, ExternalLink } from 'lucide-react';
import {
  aliyahAudioUrl,
  isDoubledName,
  LEYNING_CREDIT,
} from '../lib/leyning.js';

// The leyning player: the week's reading chanted in the Ashkenazi (Avery-Binder)
// trope, one recording per aliyah, from PocketTorah. The audio is never bundled
// and never autoplays. It loads only when the reader presses play, streams from
// raw.githubusercontent.com (which sends permissive CORS and honors range
// requests, so the native scrubber works cross-origin), and reports a missing or
// failed file plainly rather than spinning forever.
//
// This is the real chant, not a text-to-speech reading. A doubled portion is
// recorded under each half, so for a combined week the player plays the first
// half's recording and says so.
//
// Props:
//   parshaName:  the Sefaria display name of the portion (e.g. "Korach").
//   aliyahIndex: zero-based aliyah (0..6). Ignored when kind is 'haftarah'.
//   aliyahLabel: the human label for the aliyah, shown in the heading.
//   kind:        'aliyah' (default) or 'haftarah'.
export default function LeyningPlayer({
  parshaName,
  aliyahIndex,
  aliyahLabel,
  kind = 'aliyah',
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = aliyahAudioUrl(parshaName, aliyahIndex, kind);
  const doubled = kind === 'aliyah' && isDoubledName(parshaName);

  // Whenever the source changes (a new aliyah, a new week), stop the current
  // playback and clear the failure flag. Keyed on the stable src string, not on
  // the playing flag it resets, so React 18 StrictMode's double-invoke is safe.
  useEffect(() => {
    setPlaying(false);
    setFailed(false);
    const el = audioRef.current;
    if (el) {
      el.pause();
      // Move the playhead back so pressing play starts the new aliyah cleanly.
      try { el.currentTime = 0; } catch { /* not ready yet */ }
    }
  }, [src]);

  // On unmount (a navigation away, a route change), pause the audio so it does
  // not keep chanting after the reader leaves the page.
  useEffect(() => {
    const el = audioRef.current;
    return () => {
      if (el) el.pause();
    };
  }, []);

  function toggle() {
    const el = audioRef.current;
    if (!el || !src) return;
    if (el.paused) {
      const started = el.play();
      if (started && typeof started.catch === 'function') {
        started.catch(() => setFailed(true));
      }
    } else {
      el.pause();
    }
  }

  if (!src) {
    return (
      <div className="card" style={{ marginTop: 'var(--space-md)' }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
          There is no recording to play for this reading.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <Music size={18} aria-hidden="true" style={{ color: 'var(--gold)' }} />
        <span style={{ fontFamily: 'var(--font-headline)', letterSpacing: '0.03em' }}>
          {kind === 'haftarah' ? 'Chant the haftarah' : 'Chant this aliyah'}
          {aliyahLabel ? ` (${aliyahLabel})` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="pill-button pill-button--active"
          onClick={toggle}
          aria-pressed={playing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </button>

        {/*
          The native audio element carries the scrubber and the buffering. It is
          not set to autoplay and has no preload, so nothing streams until the
          reader presses play. The element reads the bytes cross-origin, which
          the CORS headers on the host allow.
        */}
        <audio
          ref={audioRef}
          src={src}
          preload="none"
          controls
          crossOrigin="anonymous"
          style={{ flex: '1 1 220px', minWidth: '220px' }}
          onPlay={() => { setPlaying(true); setFailed(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => { setFailed(true); setPlaying(false); }}
        >
          Your browser cannot play this recording.
        </audio>
      </div>

      {failed && (
        <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--accent-red)', fontSize: '0.9rem' }}>
          The recording could not be loaded right now. It streams from
          PocketTorah, so there is nothing to play until the connection returns.
        </p>
      )}

      {doubled && (
        <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
          This is a doubled week. PocketTorah recorded each portion separately, so
          this plays the chant of the first portion of the pair.
        </p>
      )}

      <p style={{ margin: 'var(--space-sm) 0 0', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
        Recording from{' '}
        <a href={LEYNING_CREDIT.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          {LEYNING_CREDIT.source} <ExternalLink size={12} aria-hidden="true" />
        </a>
        , chanted in the {LEYNING_CREDIT.reader}. Released under{' '}
        <a href={LEYNING_CREDIT.licenseUrl} target="_blank" rel="noopener noreferrer">
          {LEYNING_CREDIT.license}
        </a>
        .
      </p>
    </div>
  );
}
