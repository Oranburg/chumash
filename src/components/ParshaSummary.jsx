import { ExternalLink } from 'lucide-react';
import { sefariaUrl } from '../lib/sefaria.js';
import { ALIYAH_LABELS } from '../lib/parsha.js';

// The portion's reading at a glance: the seven aliyot (plus the maftir when the
// week carries one) as entries, and the haftarah reference. Each aliyah is the
// verse range Sefaria returned for it, labeled with its traditional name. The
// haftarah carries its own reference and a link out to Sefaria. Nothing is
// invented; when the week has no aliyot breakdown the section says so.
export default function ParshaSummary({ parsha }) {
  if (!parsha) return null;
  const aliyot = Array.isArray(parsha.aliyot) ? parsha.aliyot : [];

  return (
    <div>
      <section style={{ marginTop: 'var(--space-lg)' }}>
        <h2>The seven aliyot</h2>
        {aliyot.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>
            Sefaria did not return an aliyah breakdown for this portion.
          </p>
        ) : (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-sm)' }}>
            {aliyot.map((range, i) => (
              <li
                key={range}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-headline)', color: 'var(--blue-light)' }}>
                  {ALIYAH_LABELS[i] || `Aliyah ${i + 1}`}
                </span>
                <a
                  href={sefariaUrl(range)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
                >
                  {range}
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ marginTop: 'var(--space-lg)' }}>
        <h2>Haftarah</h2>
        {parsha.haftarah ? (
          <p>
            <a
              href={sefariaUrl(parsha.haftarah.ref)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {parsha.haftarah.displayEn} <ExternalLink size={15} aria-hidden="true" />
            </a>
            {parsha.haftarah.displayHe && (
              <span className="hebrew" style={{ display: 'block', color: 'var(--accent-2)', marginTop: 'var(--space-xs)', fontSize: '1.2rem' }}>
                {parsha.haftarah.displayHe}
              </span>
            )}
          </p>
        ) : (
          <p style={{ color: 'var(--muted)' }}>
            Sefaria did not return a haftarah for this week.
          </p>
        )}
      </section>
    </div>
  );
}
