import { Link } from 'react-router-dom';

// The breadcrumb bar at the top of every page. The first link leaves the app for
// oranburg.law, the way the other Oranburg sites do, so the reader can always get
// back up to the family. Pass `trail` as an ordered list of crumbs, each either a
// { label, to } in-app link or a plain { label } for the current page.
export default function Breadcrumb({ trail = [] }) {
  return (
    <nav className="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="https://oranburg.law" target="_blank" rel="noreferrer">
        oranburg.law
      </a>
      <span className="breadcrumb-bar__sep" aria-hidden="true">
        /
      </span>
      <Link to="/">Chumash</Link>
      {trail.map((crumb, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className="breadcrumb-bar__sep" aria-hidden="true">
            /
          </span>
          {crumb.to ? (
            <Link to={crumb.to}>{crumb.label}</Link>
          ) : (
            <span className="breadcrumb-bar__current" aria-current="page">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
