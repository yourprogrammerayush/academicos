/** Copies the pdf.js worker out of node_modules so /pdfjs/* is always in sync. */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const source = join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const target = join(root, 'public/pdfjs/pdf.worker.min.mjs');

if (!existsSync(source)) {
  console.warn('[pdfjs] worker not found in node_modules — skipping');
  process.exit(0);
}
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('[pdfjs] worker copied to public/pdfjs');
