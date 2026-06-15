import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { getParshaIndex } from '../lib/parsha.js';

// Browse the Torah by book, then portion. The five books each open a list of
// their portions, every portion a link into its reading view. The canonical
// Hebrew name and the verse range load when the reader opens a portion, so this
// page carries only the stable transliterated names from parsha.js.
export default function Browse() {
  const index = getParshaIndex();

  return (
    <>
      <Breadcrumb trail={[{ label: 'Browse' }]} />
      <main className="app-main">
        <h1>The five books</h1>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          The Torah is read across the year in fifty-four portions. Open a book to
          read any portion at its own pace.
        </p>

        {index.map(({ book, parshiyot }) => (
          <section key={book.key} style={{ marginTop: 'var(--space-xl)' }}>
            <h2>
              {book.en}
              <span className="hebrew" style={{ marginRight: '0.5rem', color: 'var(--accent-2)', fontWeight: 500, float: 'right' }}>
                {book.he}
              </span>
            </h2>
            <ul className="parsha-list">
              {parshiyot.map((name) => (
                <li key={name} className="parsha-list__item">
                  <Link to={`/parsha/${encodeURIComponent(name)}`}>
                    <span className="parsha-list__name">{name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
