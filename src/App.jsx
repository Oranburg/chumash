import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { Sun, Moon, CalendarDays, Library } from 'lucide-react';

import ThisWeek from './pages/ThisWeek.jsx';
import Reading from './pages/Reading.jsx';
import Browse from './pages/Browse.jsx';
import NotFound from './pages/NotFound.jsx';
import SiteFooter from './components/SiteFooter.jsx';

const THEME_KEY = 'chumash-theme';

function readTheme() {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') return current;
  }
  return 'dark';
}

function Header() {
  const [theme, setTheme] = useState(readTheme);

  // Keep React state in sync with the attribute the pre-paint script set.
  useEffect(() => {
    setTheme(readTheme());
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
    <header className="app-header">
      <Link to="/" className="app-header__brand">
        Chumash
      </Link>
      <button
        type="button"
        className="icon-button"
        onClick={toggleTheme}
        aria-label="Toggle dark and light mode"
      >
        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </header>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'This week', Icon: CalendarDays, end: true },
  { to: '/browse', label: 'Browse', Icon: Library, end: false },
];

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive ? 'bottom-nav__item is-active' : 'bottom-nav__item'
          }
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Header />
        <div style={{ flex: '1 1 auto' }}>
          <Routes>
            <Route path="/" element={<ThisWeek />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/parsha/:name" element={<Reading />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <SiteFooter />
        <BottomNav />
      </div>
    </HashRouter>
  );
}
