import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side Google Drive proxy.
 * Users never see drive.google.com — bytes stream through this origin.
 *
 * Strategy:
 *  1. GOOGLE_DRIVE_API_KEY configured  → official Files API (alt=media / export).
 *  2. No key                           → public "usercontent" link, works for
 *                                        files shared as "Anyone with the link".
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id');
  const download = sp.get('download') === '1';
  const name = sp.get('name') || 'file';
  const safeName = name.replace(/["\\\r\n]/g, '');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (id.startsWith('demo-')) {
    const text = `AcademicOS demo file: ${safeName}\n\nPlaceholder for the curated catalog.\nConnect Google Drive (GOOGLE_DRIVE_API_KEY) to stream real files from "MATERIALS BY AYUSH JHA, 2CSE-4".\n\nWeb App Created By - Ayush Jha, 2CSE-4`;
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': download ? `attachment; filename="${safeName}"` : 'inline',
      },
    });
  }

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  try {
    if (!apiKey) {
      const publicUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
      const res = await fetch(publicUrl, {
        cache: 'no-store',
        redirect: 'follow',
        headers: { 'User-Agent': 'AcademicOS/1.0' },
      });
      if (!res.ok || !res.body) {
        return NextResponse.json(
          {
            error: 'File is not publicly accessible.',
            hint: 'Share the file (or its parent folder) as "Anyone with the link – Viewer", or set GOOGLE_DRIVE_API_KEY in Vercel.',
            status: res.status,
          },
          { status: 424 }
        );
      }
      const headers = new Headers();
      headers.set('Content-Type', res.headers.get('content-type') || 'application/octet-stream');
      headers.set('Content-Disposition', download ? `attachment; filename="${safeName}"` : 'inline');
      headers.set('Cache-Control', 'public, max-age=3600');
      return new Response(res.body, { headers });
    }

    // Metadata (content type + display filename)
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?key=${encodeURIComponent(apiKey)}&fields=id,name,mimeType,size`,
      { cache: 'no-store' }
    );
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: `Drive metadata failed (${metaRes.status})`, hint: 'Check that the folder is shared with the API key owner.' },
        { status: metaRes.status }
      );
    }
    const meta = (await metaRes.json()) as { name?: string; mimeType?: string; size?: string };
    const mime = meta.mimeType || 'application/octet-stream';
    const filename = (meta.name || safeName).replace(/["\\\r\n]/g, '');

    const isGoogleDoc = mime.startsWith('application/vnd.google-apps.');
    const exportMime =
      mime === 'application/vnd.google-apps.spreadsheet' ? 'text/csv' : 'application/pdf';

    const fileUrl = isGoogleDoc
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(exportMime)}&key=${encodeURIComponent(apiKey)}`
      : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&key=${encodeURIComponent(apiKey)}`;

    const fileRes = await fetch(fileUrl, { cache: 'no-store' });
    if (!fileRes.ok || !fileRes.body) {
      return NextResponse.json({ error: `Drive download failed (${fileRes.status})` }, { status: fileRes.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', isGoogleDoc ? exportMime : mime);
    if (meta.size && !isGoogleDoc) headers.set('Content-Length', meta.size);
    headers.set('Content-Disposition', download ? `attachment; filename="${filename}"` : 'inline');
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('Accept-Ranges', 'bytes');
    return new Response(fileRes.body, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown proxy error';
    console.error('[drive] proxy failed:', message);
    return NextResponse.json(
      {
        error: 'Could not reach Google Drive from the server.',
        detail: message,
        hint: 'On Vercel this normally resolves itself — check the deployment region and that the file is shared.',
      },
      { status: 502 }
    );
  }
}
