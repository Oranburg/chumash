// Sefaria API client.
//
// Every text and image in this app comes from Sefaria. The partner never
// generates primary text. These endpoints were verified working on
// 2026-06-13; see docs/SOURCES.md. On any failure these functions throw a
// clear Error rather than returning invented data.

const API = 'https://www.sefaria.org/api';

// Fetch JSON from a URL and throw a readable error if the request fails.
async function getJson(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new Error(`Could not reach Sefaria at ${url}.`, { cause });
  }
  if (!res.ok) {
    throw new Error(`Sefaria returned ${res.status} for ${url}.`);
  }
  return res.json();
}

// Strip HTML tags and decode the few entities Sefaria's English uses.
function stripHtml(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&thinsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .trim();
}

// Flatten a segment field that may be a flat array of strings or nested
// arrays of strings into a single flat array of strings.
function flattenSegments(value) {
  const out = [];
  const walk = (item) => {
    if (Array.isArray(item)) {
      item.forEach(walk);
    } else if (typeof item === 'string') {
      out.push(item);
    }
  };
  walk(value);
  return out;
}

// Remove Hebrew cantillation marks (the te'amim) from a string while keeping the
// vowel points (nikud). The te'amim occupy U+0591 to U+05AF plus U+05BD, U+05BF,
// and U+05C0/U+05C3/U+05C5/U+05C6; the nikud (U+05B0 to U+05BC, U+05C1, U+05C2,
// U+05C7) are kept so the word still reads with its vowels. Used to render the
// Torah with cantillation off by default, as the reading view does.
const TAAMIM = /[֑-ֽֿ֯׀׃ׅׄ׆]/g;
export function stripCantillation(value) {
  if (typeof value !== 'string') return '';
  return value.replace(TAAMIM, '');
}

// Strip both the cantillation (te'amim) and the vowel points (nikud), leaving
// the bare consonantal text. A Torah scroll carries neither, so the scroll hero
// renders this form. The range U+0591 to U+05C7 covers every te'am and nekuda;
// the letters and the maqaf are kept. This is for display only; the vocalized
// original is kept alongside so word lookup still has its vowels.
const NIKUD_AND_TAAMIM = /[\u0591-\u05C7]/g;
export function stripVowels(value) {
  if (typeof value !== 'string') return '';
  return value.replace(NIKUD_AND_TAAMIM, '');
}

// Parse a verse-range ref like "Genesis 1:1-6:8" or "Numbers 30:2-36:13" into its
// book name, start chapter, and start verse, so the per-verse refs of a parsha can
// be reconstructed from the nested text the API returns. Returns null when the ref
// is not in the expected book-chapter-verse-range form.
function parseRangeRef(ref) {
  // The book name may contain spaces and Roman numerals ("I Samuel 11:14-12:22").
  const m = /^(.*?)\s+(\d+):(\d+)-(?:(\d+):)?(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const [, book, startCh, startV] = m;
  return { book, startChapter: Number(startCh), startVerse: Number(startV) };
}

// Load the verse-by-verse text of a portion's verse range, e.g. the ref a parsha
// reading carries ("Genesis 1:1-6:8"). The texts API returns the Hebrew and the
// English nested by chapter when the range crosses a chapter boundary, and flat
// when it stays inside one chapter. This flattens both shapes into an ordered list
// of verse records, each carrying the exact Sefaria ref for that one verse so the
// reading view can address it for translation-compare and word lookup. The Hebrew
// keeps its vowels and (here) its cantillation; the view strips the te'amim for
// display. Returns { ref, heRef, verses:[{ ref, chapter, verse, he, en }] }.
export async function getParshaText(rangeRef) {
  if (!rangeRef) {
    throw new Error('No portion reference was given to load.');
  }
  const url = `${API}/texts/${encodeURIComponent(rangeRef)}?context=0&commentary=0`;
  const data = await getJson(url);

  const parsed = parseRangeRef(data.ref || rangeRef);
  const book = parsed ? parsed.book : String(rangeRef).replace(/\s+\d.*$/, '');
  const startChapter = parsed ? parsed.startChapter : 1;
  const startVerse = parsed ? parsed.startVerse : 1;

  const heRaw = data.he;
  const enRaw = data.text;

  // Detect the nested-by-chapter shape (cross-chapter range) versus the flat
  // single-chapter shape, by looking at whether the first element is an array.
  const nested = Array.isArray(heRaw) && heRaw.length > 0 && Array.isArray(heRaw[0]);

  const verses = [];
  if (nested) {
    // heRaw[i] is the verses of chapter (startChapter + i); the first chapter
    // begins at startVerse, every later chapter begins at verse 1.
    heRaw.forEach((chapterVerses, ci) => {
      const chapter = startChapter + ci;
      const firstVerse = ci === 0 ? startVerse : 1;
      const enChapter = Array.isArray(enRaw) && Array.isArray(enRaw[ci]) ? enRaw[ci] : [];
      chapterVerses.forEach((he, vi) => {
        const verse = firstVerse + vi;
        verses.push({
          ref: `${book} ${chapter}:${verse}`,
          chapter,
          verse,
          he: stripHtml(typeof he === 'string' ? he : ''),
          en: stripHtml(typeof enChapter[vi] === 'string' ? enChapter[vi] : ''),
        });
      });
    });
  } else {
    // Flat single-chapter range: every verse is in startChapter, counting up from
    // startVerse.
    const heFlat = Array.isArray(heRaw) ? heRaw : [];
    const enFlat = Array.isArray(enRaw) ? enRaw : [];
    heFlat.forEach((he, vi) => {
      const verse = startVerse + vi;
      verses.push({
        ref: `${book} ${startChapter}:${verse}`,
        chapter: startChapter,
        verse,
        he: stripHtml(typeof he === 'string' ? he : ''),
        en: stripHtml(typeof enFlat[vi] === 'string' ? enFlat[vi] : ''),
      });
    });
  }

  return {
    ref: data.ref || rangeRef,
    heRef: data.heRef || '',
    verses,
  };
}

// Load any Sefaria ref's text: a commentary, a cited verse, a halakhic code,
// a parallel passage. Returns { ref, heRef, he:[...], en:[...] }.
export async function getSefariaText(ref) {
  if (!ref) {
    throw new Error('No reference was given to load.');
  }
  const url = `${API}/texts/${encodeURIComponent(ref)}?context=0&commentary=0`;
  const data = await getJson(url);
  return {
    ref: data.ref || ref,
    heRef: data.heRef || '',
    he: flattenSegments(data.he),
    en: flattenSegments(data.text).map(stripHtml),
  };
}

// Fetch the link objects for one ref (one amud, or one verse).
// `with_text=0` keeps the payload small; the text loads on demand when the
// reader opens a connection or a commentator.
async function getLinks(ref) {
  const url = `${API}/links/${encodeURIComponent(ref)}?with_text=0`;
  const data = await getJson(url);
  return Array.isArray(data) ? data : [];
}

// Normalize one Sefaria link object to the small shape the UI renders.
// Returns null for a link that lacks the fields the UI needs.
function normalizeLink(link) {
  if (!link || !link.ref) return null;
  const collective = link.collectiveTitle || {};
  const name = collective.en || link.index_title || link.ref;
  return {
    category: link.category || 'Other',
    name,
    heName: collective.he || '',
    ref: link.ref,
    anchorRef: link.anchorRef || '',
  };
}

// The six classical parshanim this app surfaces on a Torah verse, in the fixed
// order a reader meets them: the Aramaic Targum of Onkelos first, then Rashi,
// his grandson Rashbam, Ibn Ezra, Ramban (Nachmanides), and Sforno. Each entry
// carries the display label, the Hebrew title Sefaria uses, and a matcher that
// recognizes the work by its Sefaria title. Onkelos sits in the Targum category
// and titles its work "Onkelos <Book>" rather than "X on <Book>", so it gets its
// own matcher; the other five sit in the Commentary category under a
// collectiveTitle.en that is exactly the commentator's name.
const TARGET_COMMENTATORS = [
  { commentator: 'Onkelos', heTitle: 'אונקלוס', match: (c) => /onkelos/i.test(c) },
  { commentator: 'Rashi', heTitle: 'רש"י', match: (c) => c === 'Rashi' },
  { commentator: 'Rashbam', heTitle: 'רשב"ם', match: (c) => c === 'Rashbam' },
  { commentator: 'Ibn Ezra', heTitle: 'אבן עזרא', match: (c) => c === 'Ibn Ezra' },
  { commentator: 'Ramban', heTitle: 'רמב"ן', match: (c) => c === 'Ramban' },
  { commentator: 'Sforno', heTitle: 'ספורנו', match: (c) => c === 'Sforno' },
];

// Pull the Hebrew and English text out of one link object returned with
// with_text=1. Sefaria gives `he` and `text` as either a single string or a
// (possibly nested) array of strings; flatten both shapes, strip the HTML, and
// drop empties so a segment with text in only one language still reads.
function commentSegments(link) {
  const he = flattenSegments(link.he).map(stripHtml).filter(Boolean);
  const en = flattenSegments(link.text != null ? link.text : link.en)
    .map(stripHtml)
    .filter(Boolean);
  return { he, en };
}

// Load the classical commentary on a single Torah verse, limited to the six
// parshanim in TARGET_COMMENTATORS and returned in that fixed order. The links
// API with with_text=1 returns every linked work with its text inline, so one
// request gets the verse's whole apparatus; this keeps only the six targets and
// ignores the rest (Midrash, Chasidut, later supercommentary, and so on).
//
// One commentator can carry several comment segments on a single verse: Sefaria
// splits Rashi, Ibn Ezra, and the others into numbered pieces (".../16:1:1",
// ".../16:1:2"). Those arrive as separate link objects sharing a collectiveTitle.
// They are collected in the order their refs sort, so the segments read in the
// order the commentator wrote them rather than the order the links API happened
// to return. A commentator with no comment on this verse simply does not appear.
//
// Every word here is Sefaria's, stripped of HTML but otherwise verbatim. On a
// request failure this throws, like the other loaders, so the caller can report
// the failure and offer a retry rather than invent commentary.
// Returns [{ commentator, heTitle, he:[...], en:[...] }].
export async function getVerseCommentaries(verseRef) {
  if (!verseRef) {
    throw new Error('No verse reference was given to load commentary for.');
  }
  const url = `${API}/links/${encodeURIComponent(verseRef)}?with_text=1`;
  const data = await getJson(url);
  const raw = Array.isArray(data) ? data : [];

  return TARGET_COMMENTATORS.map((target) => {
    // Every link object for this commentator on this verse, sorted by ref so the
    // numbered segments (":1", ":2", ...) read in their written order.
    const links = raw
      .filter((link) => {
        if (!link || (link.category !== 'Commentary' && link.category !== 'Targum')) {
          return false;
        }
        const collective = (link.collectiveTitle && link.collectiveTitle.en) || '';
        const title = link.index_title || '';
        return target.match(collective) || target.match(title);
      })
      .sort((a, b) => String(a.ref).localeCompare(String(b.ref), undefined, { numeric: true }));

    const he = [];
    const en = [];
    links.forEach((link) => {
      const seg = commentSegments(link);
      he.push(...seg.he);
      en.push(...seg.en);
    });

    return { commentator: target.commentator, heTitle: target.heTitle, he, en };
  }).filter((entry) => entry.he.length > 0 || entry.en.length > 0);
}

// Turn a manuscript slug into a human label.
// 'romm-vilna-pressing-(1880-86-ce)' -> 'Romm Vilna (1880-86)'
function labelFromSlug(slug) {
  if (!slug) return 'Manuscript';
  // Pull a year or year range out of the slug if one is present.
  const yearMatch = slug.match(/(\d{4}(?:-\d{2,4})?)/);
  const year = yearMatch ? yearMatch[1] : '';
  // Build the name from the slug, dropping the year chunk and noise words.
  const name = slug
    .replace(/[()]/g, ' ')
    .replace(/\d{4}(?:-\d{2,4})?/g, ' ')
    .replace(/\bce\b/gi, ' ')
    .replace(/\bpressing\b/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
    .trim();
  return year ? `${name} (${year})` : name;
}

// Build the canonical Sefaria web page URL for a ref. Sefaria addresses a page
// with spaces replaced by underscores and the colon verse separator replaced by
// a dot, so "Chullin 44a" becomes "Chullin_44a" and "Ecclesiastes 2:14" becomes
// "Ecclesiastes_2.14". Both forms were verified to resolve (HTTP 200) on
// 2026-06-13. The link opens the same text on Sefaria itself.
export function sefariaUrl(ref) {
  if (!ref) return 'https://www.sefaria.org/';
  const path = String(ref).trim().replace(/ /g, '_').replace(/:/g, '.');
  return `https://www.sefaria.org/${encodeURI(path)}`;
}

// Remove Hebrew vowel points (nikud) and cantillation marks from a word, so a
// lookup that fails on the pointed form can be retried on the bare consonants.
// The range U+0591 to U+05C7 covers the te'amim and the nekudot.
function stripNikud(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[֑-ׇ]/g, '');
}

// Strip the surrounding punctuation a word may carry when it is split out of a
// running line: the Talmud's gershayim and geresh, ordinary quotation marks,
// commas, the maqaf, and the like. The Hebrew letters themselves are kept.
function trimWordPunctuation(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/^[\s.,;:!?'"׳״()\[\]{}־–—“”‘’]+/, '')
    .replace(/[\s.,;:!?'"׳״()\[\]{}־–—“”‘’]+$/, '')
    .trim();
}

// Reduce one lexicon entry from Sefaria to the small shape the popover renders.
// The senses come from entry.content.senses, each of which may carry HTML
// (italics, cross-reference links, embedded Hebrew). Strip the HTML so the
// definition reads as plain text, and drop senses that reduce to nothing (some
// entries carry a bare "(b. h.)" marker sense with no definition).
function normalizeLexiconEntry(entry) {
  if (!entry) return null;
  const content = entry.content || {};
  const rawSenses = Array.isArray(content.senses) ? content.senses : [];
  const senses = rawSenses
    .map((sense) => {
      const def = stripHtml(sense && sense.definition);
      const num = sense && sense.number ? `${sense.number} ` : '';
      return (num + def).trim();
    })
    .filter((text) => text.length > 0);
  return {
    lexicon: entry.parent_lexicon || 'Dictionary',
    headword: entry.headword || entry.word || '',
    senses,
  };
}

// In-memory cache for word lookups, keyed by the exact string queried, so
// tapping the same word twice in a session costs no second request. Sefaria's
// API is open and the app should be a good citizen about repeat calls.
const lexiconCache = new Map();

// Fetch the raw lexicon array for one query string, caching the result. An
// empty array (no entry) is a real, cacheable answer, not an error.
async function fetchLexicon(query) {
  if (lexiconCache.has(query)) return lexiconCache.get(query);
  const url = `${API}/words/${encodeURIComponent(query)}`;
  const data = await getJson(url);
  const arr = Array.isArray(data) ? data : [];
  lexiconCache.set(query, arr);
  return arr;
}

// Order entries so Jastrow comes first. For the Talmud's Aramaic, Jastrow is
// the dictionary that covers the rabbinic vocabulary; the biblical lexicons
// (BDB, Klein) follow when present.
function orderJastrowFirst(entries) {
  return [...entries].sort((a, b) => {
    const aj = /jastrow/i.test(a.lexicon) ? 0 : 1;
    const bj = /jastrow/i.test(b.lexicon) ? 0 : 1;
    return aj - bj;
  });
}

// Look one Hebrew or Aramaic word up in Sefaria's lexicons.
//
// Returns { found, word, query, entries } where each entry is
// { lexicon, headword, senses:[strings] }, with Jastrow ordered first.
//
// The Talmud is heavily Aramaic and the text Sefaria supplies carries vowel
// points, so a word as it appears on the page is often an inflected, pointed
// form that no dictionary indexes. The lookup tries three things in order: the
// word as given, the word with its surrounding punctuation removed, and the
// word with nikud and cantillation stripped. The first try that returns any
// entry wins. When all three come back empty, the word genuinely has no
// dictionary entry under any of these forms, and the function says so with
// { found:false } rather than inventing a definition. The caller still offers
// a Sefaria link so the reader can search the word there.
export async function lookupWord(word) {
  const original = typeof word === 'string' ? word.trim() : '';
  if (!original) {
    return { found: false, word: '', query: '', entries: [] };
  }

  const trimmed = trimWordPunctuation(original);
  const bare = stripNikud(trimmed);

  // Try the forms in order, skipping duplicates (a word with no nikud and no
  // punctuation collapses the three attempts into one).
  const attempts = [];
  [original, trimmed, bare].forEach((q) => {
    if (q && !attempts.includes(q)) attempts.push(q);
  });

  for (const query of attempts) {
    let raw;
    try {
      raw = await fetchLexicon(query);
    } catch {
      // A network failure on one form should not invent a definition; move on
      // and let a later form (or the final not-found) answer.
      continue;
    }
    const entries = raw
      .map(normalizeLexiconEntry)
      .filter((e) => e && e.senses.length > 0);
    if (entries.length > 0) {
      return {
        found: true,
        word: trimmed || original,
        query,
        entries: orderJastrowFirst(entries),
      };
    }
  }

  return { found: false, word: trimmed || original, query: attempts[0], entries: [] };
}

// In-memory caches for translation work: the version list per ref, and each
// named version's text per ref, so opening and reopening the compare panel
// costs at most one request per version.
const versionsCache = new Map();
const versionTextCache = new Map();

// List the English translations Sefaria carries for a ref. The versions API
// returns every version in every language; this keeps the ones marked English.
// Some versions tagged English are actually another language (their title ends
// in a bracketed code like "[de]"); they are kept as Sefaria returns them and
// shown under their own title, so the label is always honest about what it is.
// Returns [{ versionTitle, language }], the default William Davidson first.
export async function getTranslations(ref) {
  if (!ref) return [];
  if (versionsCache.has(ref)) return versionsCache.get(ref);

  const url = `${API}/texts/versions/${encodeURIComponent(ref)}`;
  const data = await getJson(url);
  const arr = Array.isArray(data) ? data : (data && data.versions) || [];
  const english = arr
    .filter((v) => v && v.language === 'en' && v.versionTitle)
    .map((v) => ({ versionTitle: v.versionTitle, language: v.language }));

  // Put the William Davidson edition first; it is the default the page shows,
  // and the comparison reads as "here is the default, and here are the others".
  english.sort((a, b) => {
    const aw = /william davidson/i.test(a.versionTitle) ? 0 : 1;
    const bw = /william davidson/i.test(b.versionTitle) ? 0 : 1;
    return aw - bw;
  });

  versionsCache.set(ref, english);
  return english;
}

// Fetch one named English version's text for a ref, verbatim from Sefaria, and
// return it as a single joined string with HTML stripped. The `ven` parameter
// on the texts API selects a version by its exact title; this was the form that
// reliably returned a named version on 2026-06-13 (the v3 version=lang|title
// form did not). A segment-level ref returns that segment; an amud or verse ref
// returns its segments joined. Returns '' when the version carries no text for
// this ref, which the caller reports plainly rather than filling in.
export async function getTranslationText(ref, versionTitle) {
  if (!ref || !versionTitle) return '';
  const cacheKey = `${ref}||${versionTitle}`;
  if (versionTextCache.has(cacheKey)) return versionTextCache.get(cacheKey);

  const url =
    `${API}/texts/${encodeURIComponent(ref)}` +
    `?context=0&commentary=0&ven=${encodeURIComponent(versionTitle)}`;
  const data = await getJson(url);
  const text = flattenSegments(data.text).map(stripHtml).filter(Boolean).join(' ');
  versionTextCache.set(cacheKey, text);
  return text;
}

// Group the links for any single ref into the canon's families, in the order a
// study partner consults them: parallel Talmud sugyot first, the cited Tanakh
// next, then commentary, halakhah, Kabbalah, Midrash, and the rest. Each entry
// is { name, ref }. Used by the partner's sefaria_links tool. Verbatim from the
// Sefaria links API; nothing is invented.
export async function getLinksForRef(ref) {
  const raw = await getLinks(ref);
  const seen = new Set();
  const buckets = {
    talmud: [],
    tanakh: [],
    commentary: [],
    halakhah: [],
    kabbalah: [],
    midrash: [],
    other: [],
  };
  for (const item of raw) {
    const link = normalizeLink(item);
    if (!link || seen.has(link.ref)) continue;
    seen.add(link.ref);
    const cat = (link.category || '').toLowerCase();
    const entry = { name: link.name, ref: link.ref };
    if (cat === 'talmud') buckets.talmud.push(entry);
    else if (cat === 'tanakh') buckets.tanakh.push(entry);
    else if (cat === 'commentary' || cat === 'quoting commentary')
      buckets.commentary.push(entry);
    else if (cat === 'halakhah') buckets.halakhah.push(entry);
    else if (cat === 'kabbalah') buckets.kabbalah.push(entry);
    else if (cat === 'midrash') buckets.midrash.push(entry);
    else buckets.other.push(entry);
  }
  return buckets;
}

// Full-text search across the Sefaria library, verbatim from the search API
// (verified 2026-06-14: POST /api/search-wrapper returns Elasticsearch hits with
// hits.hits[]._id naming the ref and highlight.exact carrying the snippet). The
// search reaches only Sefaria, so it cannot surface non-canonical sources.
// Returns [{ ref, snippet }], deduped by ref. Throws on a transport failure
// rather than inventing results.
const searchCache = new Map();
export async function searchSefaria(query, size = 6) {
  const q = typeof query === 'string' ? query.trim() : '';
  if (!q) return [];
  const cacheKey = `${size}|${q}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  let res;
  try {
    res = await fetch(`${API}/search-wrapper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, type: 'text', size }),
    });
  } catch (cause) {
    throw new Error('Could not reach Sefaria search.', { cause });
  }
  if (!res.ok) throw new Error(`Sefaria search returned ${res.status}.`);
  const data = await res.json();
  const hits =
    data && data.hits && Array.isArray(data.hits.hits) ? data.hits.hits : [];

  const seen = new Set();
  const out = [];
  for (const h of hits) {
    const id = h && h._id ? String(h._id) : '';
    // _id looks like "Bava Kamma 2a:1 (Version Title [he])"; drop the version.
    const ref = id.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!ref || seen.has(ref)) continue;
    seen.add(ref);
    const hl =
      h.highlight && (h.highlight.exact || h.highlight.naive_lemmatizer);
    const snippet = Array.isArray(hl) ? stripHtml(hl.join(' … ')) : '';
    out.push({ ref, snippet });
    if (out.length >= size) break;
  }
  searchCache.set(cacheKey, out);
  return out;
}
