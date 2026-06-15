import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb.jsx';

export default function NotFound() {
  return (
    <>
      <Breadcrumb trail={[{ label: 'Not found' }]} />
      <main className="app-main">
        <h1>That page is not here</h1>
        <p>
          The page you asked for does not exist. Read this week&rsquo;s portion or
          browse the five books.
        </p>
        <p style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Link to="/" className="pill-button">This week</Link>
          <Link to="/browse" className="pill-button">Browse</Link>
        </p>
      </main>
    </>
  );
}
