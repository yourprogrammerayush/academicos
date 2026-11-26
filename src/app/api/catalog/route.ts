import { NextResponse } from 'next/server';
import { SEED_CATALOG } from '@/data/seed-catalog';
import { indexDriveFolder } from '@/lib/drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1WqBC4aCKdxNm14HIshBSwV-080svsNGC';

  if (!apiKey) {
    return NextResponse.json({ ...SEED_CATALOG, driveConnected: false, mode: 'curated' });
  }

  try {
    const catalog = await indexDriveFolder(rootId, apiKey);
    if (catalog.files.length === 0) {
      return NextResponse.json({ ...SEED_CATALOG, driveConnected: false, mode: 'curated' });
    }
    return NextResponse.json({ ...catalog, driveConnected: true, mode: 'live' });
  } catch (err) {
    console.error('[catalog] Drive indexing failed:', err);
    return NextResponse.json({ ...SEED_CATALOG, driveConnected: false, mode: 'curated' });
  }
}
