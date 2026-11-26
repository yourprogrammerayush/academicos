/**
 * Restores binary brand assets (fonts, icons, logo) from base64 copies in
 * deploy-assets/. This lets the project deploy through channels that only
 * accept text files. When the real binaries are already present (normal git
 * checkout) this script is a no-op.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'deploy-assets', 'manifest.json');

if (!existsSync(manifestPath)) {
  console.log('[assets] no manifest — assuming binary assets are present');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
let restored = 0;
for (const { path, base64File } of manifest) {
  const target = join(root, path);
  if (existsSync(target)) continue;
  const source = join(root, 'deploy-assets', base64File);
  if (!existsSync(source)) continue;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(readFileSync(source, 'utf8'), 'base64'));
  restored++;
}
console.log(`[assets] restored ${restored} binary asset(s)`);
