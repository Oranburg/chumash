import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, ChevronDown, ChevronUp, Square } from 'lucide-react';
import { usePartnerConversation } from '../lib/usePartnerConversation.js';
import { buildFirstUserMessage } from '../lib/partner.js';

// The per-verse study partner. It is a distinct action under one verse, labeled
// "Study this verse with your havruta," and it enforces the human-acts-first
// gate: opening it shows an input box, and the partner stays silent until the
// learner submits her own observation. Only then is the conversation started,
// which is the only path that makes a model call. The partner is silent on every
// verse the learner has not opened.
//
// Never-invent is enforced upstream: the partner quotes only the verse it is
// handed and what the Sefaria tools return (see usePartnerConversation.js,
// partner.js, sefariaTools.js). This component does no text generation of its own.
//
// Props:
//   verse:   the verse record { ref, chapter, verse, he, en } from getParshaText.
//   enSize:  the reader's chosen English type size, in pixels.
export default function VerseHavruta({ verse, enSize }) {
  const [open, setOpen] = useState(false);
  // The learner's first observation, held locally until she submits it. The
  // partner is started only on submit, so it cannot speak before she does.
  const [firstReading, setFirstReading] = useState('');
  const [reply, setReply] = useState('');

  const { turns, streaming, partnerError, noKey, status, start, sendReply, stop } =
    usePartnerConversation();
  const startedRef = useRef(false);

  function submitFirstReading(e) {
    e.preventDefault();
    const reading = firstReading.trim();
    if (reading.length === 0 || startedRef.current) return;
    const ok = start({
      verseRef: verse.ref,
      firstUserMessage: buildFirstUserMessage(verse.ref, verse, reading),
      openingReaderTurn: reading,
      sessionMeta: {
        verseRef: verse.ref,
        verseDisplay: `${verse.chapter}:${verse.verse}`,
        reading,
      },
    });
    // start() returns false and flips noKey when no key is set; leave the box
    // filled so the learner can submit again after adding a key.
    if (ok) startedRef.current = true;
  }

  function submitReply(e) {
    e.preventDefault();
    if (reply.trim().length === 0 || streaming) return;
    if (sendReply(reply)) setReply('');
  }

  // The conversation has been started once the learner submitted her first
  // observation. Until then, only the gate box shows.
  const started = startedRef.current;

  return (
    <div style={{ marginTop: 'var(--space-sm)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={toggleStyle}
      >
        <MessagesSquare size={16} aria-hidden="true" />
        Study this verse with your havruta
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div style={panelStyle}>
          {noKey && (
            <div>
              <p style={mutedLine}>
                The study partner needs an AI key to run. The app calls the
                provider directly from your browser with your own key, which is
                stored only on this device.
              </p>
              <p style={{ ...mutedLine, marginTop: 'var(--space-sm)' }}>
                Add a key in{' '}
                <Link to="/settings" style={{ color: 'var(--accent)' }}>
                  Settings
                </Link>
                , then come back and write what you noticed in this verse.
              </p>
            </div>
          )}

          {!started && (
            <form onSubmit={submitFirstReading}>
              <p style={introLine}>
                Write what you noticed in this verse, the question you came with,
                or what you think it means. The partner stays quiet until you do.
                Then it names the difficulty you are circling and brings a
                commentator on exactly that.
              </p>
              <textarea
                value={firstReading}
                onChange={(e) => setFirstReading(e.target.value)}
                placeholder="What I noticed, or what I find hard, in this verse..."
                rows={4}
                style={textareaStyle}
              />
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <button
                  type="submit"
                  className="pill-button pill-button--active"
                  disabled={firstReading.trim().length === 0}
                >
                  Begin the conversation
                </button>
              </div>
            </form>
          )}

          {started && (
            <div>
              {turns.map((turn, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 'var(--space-md)',
                    paddingBottom: 'var(--space-md)',
                    borderBottom:
                      i < turns.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={turn.role === 'reader' ? readerLabel : partnerLabel}>
                    {turn.role === 'reader' ? 'You' : 'Havruta'}
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-accent)',
                      fontSize: `${enSize}px`,
                      lineHeight: 1.7,
                      margin: 0,
                      color: 'var(--text)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {turn.text}
                    {turn.pending && turn.text.length === 0 && (
                      <span style={{ color: 'var(--muted)' }}>
                        The partner is reading the commentators...
                      </span>
                    )}
                  </p>
                </div>
              ))}

              {status && <p style={mutedLine}>{status}.</p>}

              {partnerError && (
                <p style={{ ...mutedLine, color: 'var(--accent-red)' }}>
                  The partner could not answer just now. {partnerError}
                </p>
              )}

              {streaming ? (
                <button
                  type="button"
                  className="pill-button"
                  onClick={stop}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Square size={14} aria-hidden="true" /> Stop
                </button>
              ) : (
                <form onSubmit={submitReply}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Your reply..."
                    rows={3}
                    style={textareaStyle}
                  />
                  <div style={{ marginTop: 'var(--space-sm)' }}>
                    <button
                      type="submit"
                      className="pill-button pill-button--active"
                      disabled={reply.trim().length === 0}
                    >
                      Reply
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const toggleStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.25rem 0',
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const panelStyle = {
  marginTop: 'var(--space-sm)',
  padding: 'var(--space-md)',
  background: 'var(--bg-soft)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
};

const introLine = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
  lineHeight: 1.6,
  margin: '0 0 var(--space-md)',
};

const mutedLine = {
  color: 'var(--muted)',
  margin: 0,
  lineHeight: 1.6,
};

const textareaStyle = {
  width: '100%',
  padding: 'var(--space-md)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  resize: 'vertical',
};

const readerLabel = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--blue-light)',
  marginBottom: 'var(--space-xs)',
};

const partnerLabel = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--gold)',
  marginBottom: 'var(--space-xs)',
};
