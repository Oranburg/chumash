import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const THEME_KEY = 'chumash-theme';

// The dark/light toggle in the header.
//
// The theme itself is set on <html data-theme> before first paint by an
// inline script in Layout.astro (so there is never a flash of the wrong
// theme), and that script runs identically on every page since every page
// now shares the same Layout. This component only needs to show the right
// icon and flip the attribute plus the saved preference when clicked.
//
// Two-pass hydration: this island mounts with client:load, so it renders
// once at build time (Node, no document) and once again during client
// hydration. Both passes render the same hard-coded 'dark' default; the
// mount effect below then reads whatever the inline script actually set on
// <html data-theme> (which may be 'light' if that was the reader's saved
// choice) and corrects the icon. That one extra render happens after
// hydration has already committed, so there is no mismatch warning.
export default function ThemeToggle() {
  // Both the build-time render and the client's first hydration render start
  // from this same fixed default, so there is nothing for React to warn
  // about at hydration; the mount effect below then corrects it a moment
  // later, off the critical hydration path.
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private-browsing or storage-quota failure; the toggle still works for
      // this session, it just will not persist.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggleTheme}
      aria-label="Toggle dark and light mode"
    >
      {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}
