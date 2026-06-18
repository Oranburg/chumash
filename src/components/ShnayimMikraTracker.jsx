// The shnayim mikra v'echad targum tracker for one aliyah.
//
// Shnayim mikra v'echad targum is an old weekly practice: before Shabbat you
// read the week's Torah portion on your own, the whole portion twice in Hebrew
// and once in the Aramaic translation of Onkelos. This box is the learner's
// private record of that reading. It is not shared and it is not graded.
//
// The three checkboxes belong to the aliyah currently on screen: the first
// Hebrew reading, the second Hebrew reading, and the Onkelos reading. The reader
// moves through the week's aliyot with the row above, and the lines at the
// bottom show how far each of the three readings has gone across the whole
// portion.
//
// The marks and their toggling live in src/lib/shnayimMikra.js and persist there
// keyed by the portion, so the record resets cleanly to each new week.
export default function ShnayimMikraTracker({ aliyahLabel, marks, done, onToggle, passes }) {
  if (!Array.isArray(marks) || marks.length === 0) return null;
  const aliyahName = aliyahLabel || 'this aliyah';
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
        Read it through before Shabbat
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 var(--space-sm)', lineHeight: 1.5 }}>
        An old practice, shnayim mikra v&rsquo;echad targum, is to read the whole
        week&rsquo;s portion on your own before Shabbat: twice in the Hebrew and
        once in the Aramaic translation of Onkelos. This is your own record of
        that reading. Nothing here is shared or graded.
      </p>
      <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: '0 0 var(--space-md)', lineHeight: 1.5 }}>
        These three boxes are for {aliyahName}. Check each reading as you finish
        it, then use the week above to move to the next aliyah.
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

      {Array.isArray(passes) && passes.length > 0 && passes[0].total > 0 && (
        <div style={{ margin: 'var(--space-md) 0 0' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 var(--space-xs)' }}>
            Across the whole portion, by reading:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {passes.map((pass) => (
              <li key={pass.id} style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                {pass.label}: {pass.done} of {pass.total} aliyot
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
