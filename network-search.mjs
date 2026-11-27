// Shared bounded description search. No network requests, private data, or full-file search.
export function normalizeSearch(value) {
  return String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('de').replace(/ß/g, 'ss').trim();
}
export function searchNetwork(index, query, options = {}) {
  if (index?.schema !== 'halveth.network-search.v1' || !Array.isArray(index.documents)) throw new TypeError('Public network search index required');
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean).slice(0, 16);
  const limit = Number.isSafeInteger(options.limit) ? Math.min(500, Math.max(0, options.limit)) : 100;
  const kinds = Array.isArray(options.kinds) ? new Set(options.kinds) : null;
  const results = [];
  for (const document of index.documents) {
    if (!options.includeArchive && (document.historical || document.editorialState !== 'CURRENT')) continue;
    if (kinds && !kinds.has(document.kind)) continue;
    const title = normalizeSearch(Object.values(document.title).join(' '));
    const primaryNames = (document.primaryNames || []).map(normalizeSearch);
    const aliases = normalizeSearch([...primaryNames, ...document.aliases].join(' '));
    const body = normalizeSearch([Object.values(document.summary).join(' '), document.text, document.repositoryId || '', document.id].join(' '));
    if (!tokens.every(token => title.includes(token) || aliases.includes(token) || body.includes(token))) continue;
    const score = tokens.reduce((sum, token) => sum + (title.includes(token) ? 12 : aliases.includes(token) ? 7 : 2), 0) + (document.kind === 'module' && tokens.length ? 1 : 0);
    const exactProduct = tokens.length > 0 && primaryNames.includes(tokens.join(' '));
    results.push({...document, score: score + (exactProduct ? 32 : 0)});
  }
  return results.sort((a, b) => b.score - a.score || a.title.de.localeCompare(b.title.de, 'de') || a.id.localeCompare(b.id, 'en')).slice(0, limit);
}
