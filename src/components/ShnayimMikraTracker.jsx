// The shnayim mikra v'echad targum tracker for one aliyah.
//
// The practice is to read the week's parsha before Shabbat: each portion twice
// in the Hebrew and once in the Aramaic of Targum Onkelos. This is the learner's
// own record of that reading, marked for the aliyah on screen: three checkboxes,
// the first Hebrew reading, the second Hebrew reading, and the Onkelos reading.
// It records what the learner has read. It is not a score and it does not nag.
//
// The marks and their toggling live in src/lib/shnayimMikra.js and persist there
// keyed by the portion, so the record resets cleanly to each new week. This
// component renders the three checkboxes for the chosen aliyah and the quiet
// running count across the whole portion.
export default function ShnayimMikraTracker({ aliyahLabel, marks, done, onToggle, overall }) {
  if (!Array.isArray(marks) || marks.length === 0) return null;
  return (
    <section className="card" style={{ marginTop: 'var(--space-lg)' }}>
      <h2
        style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.05rem',
          margin: '0 0 var(--space-xs)',
          color: 'var(--text)',
        }}
      >
        Shnayim mikra v&rsquo;echad targum
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 var(--space-md)', lineHeight: 1.5 }}>
        A record of reading {aliyahLabel || 'this aliyah'} twice in the Hebrew and
        once in Targum Onkelos. Mark what you have read.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {marks.map((mark) => {
          const checked = Boolean(done && done[mark.id]);
          return (
            <li key={mark.id}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(mark.id)}
                  style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--gold)' }}
                />
                <span>{mark.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {overall && overall.total > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 'var(--space-md) 0 0' }}>
          Across the whole portion, {overall.done} of {overall.total} marks kept.
        </p>
      )}
    </section>
  );
}
