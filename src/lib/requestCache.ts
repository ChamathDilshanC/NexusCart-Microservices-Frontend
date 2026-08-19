/**
 * A tiny in-memory, module-scoped cache for GET-style fetches, keyed by
 * request URL. Lives outside React so it survives component unmount —
 * navigating away from /shop and back no longer means every product,
 * category, and banner fetch starts from a blank loading state; the last
 * result renders instantly while a fresh copy loads quietly behind it.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_MAX_AGE_MS = 60_000;

export function getCached<T>(key: string, maxAgeMs = DEFAULT_MAX_AGE_MS): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > maxAgeMs) return undefined;
  return entry.data as T;
}

export function setCached<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}
