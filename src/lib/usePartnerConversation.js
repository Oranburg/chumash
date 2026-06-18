// The conversation engine for the verse study partner.
//
// The unit is one verse. The learner commits an observation about the verse, the
// partner opens the conversation among the commentators about exactly that, and
// the two go back and forth. The streaming, the abort, the saved-record
// bookkeeping, and the never-leave-invented-text discipline live here.
//
// The human-acts-first gate is the caller's job and this hook's contract: the
// hook makes no model call until start() is called with the learner's committed
// observation already built into the first user message. There is no path that
// reaches the model before the learner has written something of her own.

import { useRef, useState } from 'react';
import { streamPartner } from './anthropic.js';
import { readProviderSettings, buildSystemPrompt } from './partner.js';
import { createSession, updateSession } from './sessions.js';

export function usePartnerConversation() {
  // turns holds the visible conversation: { role: 'partner' | 'reader', text }.
  const [turns, setTurns] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [partnerError, setPartnerError] = useState(null);
  const [noKey, setNoKey] = useState(false);
  // A transient line like "Reading Rashi on Genesis 1:1 on Sefaria" while a tool
  // runs.
  const [status, setStatus] = useState(null);

  // The API message history sent on each call, kept separate from the visible
  // turns so the saved record and the next call always carry the full exchange.
  const messagesRef = useRef([]);
  const sessionIdRef = useRef(null);
  const abortRef = useRef(null);
  const startedRef = useRef(false);
  const streamingTextRef = useRef('');
  const settingsRef = useRef(null);
  const verseRefRef = useRef('');

  // Run one streamed exchange: append an empty partner turn, then fill it as text
  // arrives. On completion, commit the partner turn to the message history and
  // the saved record. Never leaves invented or partial text standing.
  function runExchange() {
    const settings = settingsRef.current;
    if (!settings) return;
    setStreaming(true);
    setPartnerError(null);
    streamingTextRef.current = '';

    setTurns((prev) => [...prev, { role: 'partner', text: '', pending: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    const system = buildSystemPrompt(verseRefRef.current, settings.level);

    streamPartner({
      provider: settings.provider,
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      system,
      messages: messagesRef.current,
      signal: controller.signal,
      onStatus: (s) => setStatus(s),
      onText: (chunk) => {
        streamingTextRef.current += chunk;
        setTurns((prev) => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === 'partner') {
            next[next.length - 1] = {
              role: 'partner',
              text: streamingTextRef.current,
              pending: true,
            };
          }
          return next;
        });
      },
      onDone: () => {
        const finalText = streamingTextRef.current;
        abortRef.current = null;
        setStreaming(false);
        setStatus(null);

        setTurns((prev) => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === 'partner') {
            next[next.length - 1] = { role: 'partner', text: finalText };
          }
          return next;
        });

        if (finalText.trim().length > 0) {
          messagesRef.current = [
            ...messagesRef.current,
            { role: 'assistant', content: finalText },
          ];
          if (sessionIdRef.current) {
            updateSession(sessionIdRef.current, {
              messages: messagesRef.current,
            });
          }
        } else {
          setTurns((prev) =>
            prev.filter((t) => !(t.role === 'partner' && !t.text))
          );
        }
      },
      onError: (err) => {
        abortRef.current = null;
        setStreaming(false);
        setStatus(null);
        setPartnerError(err.message);
        setTurns((prev) =>
          prev.filter((t) => !(t.role === 'partner' && !t.text))
        );
      },
    });
  }

  // Open the conversation. The caller supplies the learner's committed
  // observation as the opening turn, the first user message (the verse text plus
  // that observation), the verse ref (for the system prompt), and the metadata to
  // save. Returns false and flips noKey when no provider key is set; the caller
  // shows the no-key panel. Guards against a double start under React strict mode.
  function start({ verseRef, firstUserMessage, openingReaderTurn, sessionMeta }) {
    if (startedRef.current) return true;

    const settings = readProviderSettings();
    if (!settings.apiKey) {
      setNoKey(true);
      return false;
    }

    startedRef.current = true;
    settingsRef.current = settings;
    verseRefRef.current = verseRef || '';
    messagesRef.current = [{ role: 'user', content: firstUserMessage }];

    const record = createSession({
      ...sessionMeta,
      messages: messagesRef.current,
    });
    sessionIdRef.current = record.id;

    setTurns([{ role: 'reader', text: openingReaderTurn }]);
    runExchange();
    return true;
  }

  // Send the learner's reply and run the next exchange. Returns false and flips
  // noKey if the key has gone missing; otherwise true.
  function sendReply(text) {
    const trimmed = (text || '').trim();
    if (trimmed.length === 0 || streaming) return false;

    const settings = readProviderSettings();
    if (!settings.apiKey) {
      setNoKey(true);
      return false;
    }
    settingsRef.current = settings;

    setTurns((prev) => [...prev, { role: 'reader', text: trimmed }]);
    messagesRef.current = [
      ...messagesRef.current,
      { role: 'user', content: trimmed },
    ];
    if (sessionIdRef.current) {
      updateSession(sessionIdRef.current, { messages: messagesRef.current });
    }
    runExchange();
    return true;
  }

  function stop() {
    if (abortRef.current) abortRef.current.abort();
  }

  return { turns, streaming, partnerError, noKey, status, start, sendReply, stop };
}
