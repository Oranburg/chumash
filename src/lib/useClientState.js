// Two-pass SSR hydration for browser-only state (localStorage, window size,
// and the like).
//
// This app is now built as a multi-page static Astro site: every route ships
// as real, server-rendered HTML at build time, and the interactive React
// screen mounts on top of that HTML as a client:load island. Astro renders
// each island once on the server (in Node, at build time) to produce that
// HTML, and once again on the client (during hydration) to attach event
// handlers to the existing markup.
//
// Node has no localStorage and no window, so any state whose *first* render
// tries to read one of those directly will compute a different value on the
// server (a caught error, or a hard-coded fallback) than it computes on the
// client (the reader's actual saved preference). React's hydration pass
// compares the client's first render against the server-rendered HTML, and a
// mismatch there produces a hydration warning and, in the worst case, a
// flash of the wrong content as React discards the mismatched DOM.
//
// The fix, matching the pattern BA's progress.js and PhaseSection.jsx use for
// the same problem: render the same fixed fallback on both the server and
// the client's first pass, then correct it in a useEffect, which only runs
// after hydration has already committed. The `restored` flag this hook
// returns lets a caller gate a debounced localStorage *write* until after
// the real value has landed, so the default never overwrites a saved one.
import { useEffect, useState } from 'react';

// read: a zero-argument function that is safe to call only in the browser
//   (it may itself use try/catch, but it should not be called during SSR).
// fallback: the value to render before the client-only read has run. This is
//   what both the server and the client's first paint show.
export function useClientState(read, fallback) {
  const [restored, setRestored] = useState(false);
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(read());
    setRestored(true);
    // Intentionally run once on mount: `read` is expected to be a stable
    // closure (or safely re-creatable) supplied by the caller, and re-running
    // this on every render would defeat the point of a one-time restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue, restored];
}
