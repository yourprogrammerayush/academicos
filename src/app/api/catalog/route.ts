import { NextRequest, NextResponse } from 'next/server';
import { getCatalog, syncNow, cacheStatus } from '@/lib/drive-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog
 *   ?sync=1     force an upstream refresh (bypasses cache)
 *   ?status=1   cache diagnostics without touching Drive
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('status') === '1') {
    return NextResponse.json(cacheStatus(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const force = searchParams.get('sync') === '1';
  const result = force ? await syncNow() : await getCatalog({ force });

  return NextResponse.json(
    {
      files: result.catalog.files,
      folders: result.catalog.folders,
      rootName: result.catalog.rootName,
      driveConnected: result.mode === 'live',
      mode: result.mode,
      syncedAt: new Date(result.fetchedAt).toISOString(),
      fromCache: result.fromCache,
      changes: result.changes,
      ...(result.error ? { note: result.error } : {}),
    },
    {
      headers: {
        // Edge may serve a stale copy for a minute while we revalidate.
        'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300',
      },
    }
  );
}
