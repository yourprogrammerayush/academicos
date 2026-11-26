/**
 * AcademicOS build bootstrap.
 *
 * Vercel requires a GitHub login connection for git deployments. Until that
 * link exists, this project is deployed as a static file set: the build step
 * fetches the public repository tarball and overlays it onto the build
 * directory, then Next.js builds the real application.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const REPO = process.env.ACADEMICOS_REPO || 'yourprogrammerayush/academicos';
const REF = process.env.ACADEMICOS_REF || 'arena/4d8bd8fc-academicos';
const URL = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}`;

if (existsSync('src/app/layout.tsx')) {
  console.log('[bootstrap] sources already present — skipping fetch');
  process.exit(0);
}

console.log(`[bootstrap] fetching ${URL}`);
execFileSync('bash', ['-lc', `set -euo pipefail; curl -fsSL "${URL}" | tar -xz -C . --strip-components=1`], {
  stdio: 'inherit',
});
console.log('[bootstrap] sources restored');
