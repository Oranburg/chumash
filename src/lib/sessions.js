// The saved record of study sessions.
//
// Requirement 5 of docs/CONSTITUTION.md: every session is saved. The verse, the
// learner's own observation, the partner's questions, and the learner's replies.
// The record stays on the device, is never sent anywhere, and is never committed.
// It keeps the partner's challenges even when the reading overcame them, because
// the challenge is the memory of what the reading had to survive.
//
// Storage is localStorage under one namespaced key holding an array of sessions.

const STORE_KEY = 'chumash-sessions';

// Read all saved sessions, newest first. Returns [] on any read or parse error
// rather than throwing, so a corrupt store never blocks the app.
export function listSessions() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch {
    return [];
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
  } catch {
    // QuotaExceededError or private-mode restriction: the write silently fails.
    // The session was valid in memory for this visit; it just cannot persist.
  }
}

// A short id. crypto.randomUUID when available, a fallback otherwise.
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Create a new session record and store it. The unit is one verse: verseRef is
// the exact Sefaria ref, verseDisplay is a human label, reading is the learner's
// first observation, and messages is the full exchange with the partner.
// Returns the stored record (with its id) so the caller can keep updating it.
export function createSession({ verseRef, verseDisplay, reading, messages }) {
  const record = {
    id: makeId(),
    verseRef: verseRef || '',
    verseDisplay: verseDisplay || verseRef || '',
    savedAt: Date.now(),
    // The learner's own observations, in order. The first opens the session; any
    // later observations she writes are appended here too.
    readings: reading ? [reading] : [],
    // The full message exchange: user turns and the partner's questions, in
    // order, exactly as sent and received.
    messages: Array.isArray(messages) ? messages : [],
  };
  const all = listSessions();
  all.push(record);
  writeAll(all);
  return record;
}

// Update an existing session in place by id. Pass the fields to replace.
export function updateSession(id, fields) {
  const all = listSessions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...fields, savedAt: Date.now() };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

// Delete one session by id.
export function deleteSession(id) {
  const all = listSessions().filter((s) => s.id !== id);
  writeAll(all);
}
