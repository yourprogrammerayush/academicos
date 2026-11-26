# AcademicOS — go-live checklist

The repository `yourprogrammerayush/academicos` is on `main` and building cleanly.
The Vercel project `academic-os` already exists and holds these environment variables:
GOOGLE_DRIVE_ROOT_FOLDER_ID, GROQ_MODEL_PRIMARY, GROQ_MODEL_FAST, NEXT_PUBLIC_APP_URL.

## Why the automated deploy stopped

Vercel's API refuses git deployments for this account until a **GitHub Login Connection**
is attached to the Vercel account ("You need to add a Login Connection to your GitHub
account first"), and the deploy endpoint additionally returned a GitHub API rate limit.
The Vercel connector in this session can create projects and env vars but cannot attach
that GitHub login or upload a project archive, so the final connect step is one click.

## One click

1. Open https://vercel.com/new and import `yourprogrammerayush/academicos`.
2. Project name: `academic-os` (already created — choose "link existing project").
3. Framework preset: Next.js. Build command and output: leave defaults.
4. Deploy.

Production URL will be https://academic-os.vercel.app

## Optional keys (both have graceful fallbacks)

| Key | Effect when set |
| --- | --- |
| `GROQ_API_KEY` | Turns Study AI and the in-viewer study tools from the local search fallback into live streaming gpt-oss answers |
| `GOOGLE_DRIVE_API_KEY` | Switches the catalog from the curated 67-file snapshot to a live re-index and serves media through the official Files API |

Add them under Project → Settings → Environment Variables, then redeploy.
