import type { Catalog, CatalogFile, CatalogFolder } from './types';
import { enrichFile } from './catalog';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

async function driveFetch(path: string, apiKey: string): Promise<DriveFile[]> {
  const url = `${DRIVE_API}/files?${path}&key=${encodeURIComponent(apiKey)}&fields=files(id,name,mimeType,parents,modifiedTime,size,webViewLink),nextPageToken&pageSize=200`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text().then((t) => t.slice(0, 300))}`);
  const data = (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
  return data.files || [];
}

async function listFolder(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const q = `'${folderId}' in parents and trashed = false`;
  return driveFetch(`q=${encodeURIComponent(q)}`, apiKey);
}

async function getFileName(fileId: string, apiKey: string): Promise<string | null> {
  const res = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?key=${encodeURIComponent(apiKey)}&fields=id,name,mimeType`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { name?: string };
  return data.name || null;
}

/**
 * Recursively index the master Drive folder.
 * Uses API key (public files) — service-account path is documented in .env.example.
 */
export async function indexDriveFolder(rootId: string, apiKey: string): Promise<Catalog> {
  const rootName = (await getFileName(rootId, apiKey)) || 'MATERIALS BY AYUSH JHA, 2CSE-4';
  const folders: CatalogFolder[] = [];
  const files: CatalogFile[] = [];
  const nameById = new Map<string, string>([[rootId, rootName]]);
  const pathById = new Map<string, string[]>([[rootId, []]]);

  const queue: string[] = [rootId];
  const visited = new Set<string>();
  let guard = 0;

  while (queue.length && guard < 500) {
    guard++;
    const folderId = queue.shift()!;
    if (visited.has(folderId)) continue;
    visited.add(folderId);
    const items = await listFolder(folderId, apiKey);
    for (const item of items) {
      const parentPath = pathById.get(folderId) || [];
      if (item.mimeType === FOLDER_MIME) {
        const path = [...parentPath, item.name];
        nameById.set(item.id, item.name);
        pathById.set(item.id, path);
        folders.push({ id: item.id, name: item.name, parentId: folderId, path });
        queue.push(item.id);
      } else {
        files.push(
          enrichFile({
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            size: item.size,
            modifiedTime: item.modifiedTime,
            parents: item.parents,
            path: parentPath,
            type: 'Other',
            kind: 'other',
            webViewLink: item.webViewLink,
          })
        );
      }
    }
  }

  return {
    files,
    folders,
    indexedAt: new Date().toISOString(),
    source: 'drive',
    rootName,
  };
}
