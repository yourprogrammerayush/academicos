import type { Catalog, CatalogFile } from './types';
import { indexDriveFolder } from './drive';
import { SEED_CATALOG } from '@/data/seed-catalog';

const ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1WqBC4aCKdxNm14HIshBSwV-080svsNGC';

/** Fresh-enough window: a re-visit inside this serves cache with zero latency. */
const FRESH_MS = 45_000;
/** Hard ceiling — never serve data older than this without a synchronous refresh. */
const MAX_STALE_MS = 10 * 60_000;

type Entry = {
  catalog: Catalog;
  fetchedAt: number;
  mode: 'live' | 'curated';
  error?: string;
};

let entry: Entry | null = null;
let inflight: Promise<Entry> | null = null;

export type SyncResult = {
  catalog: Catalog;
  mode: 'live' | 'curated';
  fetchedAt: number;
  ageMs: number;
  fromCache: boolean;
  changes?: { added: CatalogFile[]; removed: string[]; unchanged: number };
  error?: string;
};

function seedEntry(error?: string): Entry {
  return { catalog: SEED_CATALOG, fetchedAt: Date.now(), mode: 'curated', error };
}

/**
 * Fetch the Drive folder, collapsing concurrent callers into one request.
 * Vercel reuses function instances, so this cache survives across requests
 * for the lifetime of the instance.
 */
async function refresh(apiKey: string): Promise<Entry> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const catalog = await indexDriveFolder(ROOT, apiKey);
      if (!catalog.files.length) {
        return seedEntry('Drive folder returned no files');
      }
      // Preserve rootName so the UI can show the real folder title
      return {
        catalog: { ...catalog, rootName: catalog.rootName || SEED_CATALOG.rootName },
        fetchedAt: Date.now(),
        mode: 'live' as const,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[drive-cache] refresh failed:', message);
      // Last known good beats the seed
      if (entry?.mode === 'live') {
        return { ...entry, error: message };
      }
      return seedEntry(message);
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

function diff(prev: Catalog, next: Catalog) {
  const before = new Map(prev.files.map((f) => [f.id, f]));
  const after = new Map(next.files.map((f) => [f.id, f]));
  const added: CatalogFile[] = [];
  for (const [id, f] of after) if (!before.has(id)) added.push(f);
  const removed: string[] = [];
  for (const id of before.keys()) if (!after.has(id)) removed.push(id);
  return { added, removed, unchanged: before.size - removed.length };
}

/**
 * Read the catalogue. Serves cache instantly when fresh, otherwise refreshes.
 * Concurrent callers share a single upstream fetch.
 */
export async function getCatalog(opts: { force?: boolean } = {}): Promise<SyncResult> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return {
      catalog: SEED_CATALOG,
      mode: 'curated',
      fetchedAt: Date.now(),
      ageMs: 0,
      fromCache: false,
      error: 'GOOGLE_DRIVE_API_KEY not configured',
    };
  }

  const now = Date.now();
  const age = entry ? now - entry.fetchedAt : Infinity;

  if (!opts.force && entry && age < FRESH_MS) {
    return {
      catalog: entry.catalog,
      mode: entry.mode,
      fetchedAt: entry.fetchedAt,
      ageMs: age,
      fromCache: true,
      error: entry.error,
    };
  }

  // Serve stale immediately (SWR) but kick a refresh when it is very old
  if (!opts.force && entry && entry.mode === 'live' && age < MAX_STALE_MS) {
    void refresh(apiKey);
    return {
      catalog: entry.catalog,
      mode: entry.mode,
      fetchedAt: entry.fetchedAt,
      ageMs: age,
      fromCache: true,
      error: entry.error,
    };
  }

  const prev = entry?.catalog;
  const next = await refresh(apiKey);
  entry = next;

  return {
    catalog: next.catalog,
    mode: next.mode,
    fetchedAt: next.fetchedAt,
    ageMs: 0,
    fromCache: false,
    changes: prev && next.mode === 'live' ? diff(prev, next.catalog) : undefined,
    error: next.error,
  };
}

/** Force a refresh and report what changed since the last known snapshot. */
export async function syncNow(): Promise<SyncResult> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return {
      catalog: SEED_CATALOG,
      mode: 'curated',
      fetchedAt: Date.now(),
      ageMs: 0,
      fromCache: false,
      error: 'GOOGLE_DRIVE_API_KEY not configured — add it in Vercel to enable live sync',
    };
  }
  const prev = entry?.catalog;
  const next = await refresh(apiKey);
  entry = next;
  return {
    catalog: next.catalog,
    mode: next.mode,
    fetchedAt: next.fetchedAt,
    ageMs: 0,
    fromCache: false,
    changes: prev && next.mode === 'live' ? diff(prev, next.catalog) : undefined,
    error: next.error,
  };
}

export function cacheStatus() {
  if (!entry) return { cached: false };
  return {
    cached: true,
    mode: entry.mode,
    fetchedAt: entry.fetchedAt,
    ageMs: Date.now() - entry.fetchedAt,
    files: entry.catalog.files.length,
    error: entry.error,
  };
}
