# Vercel deployment — exact steps

> Setting up Google Drive live sync? See [`DRIVE_KEY_SETUP.md`](./DRIVE_KEY_SETUP.md).

## Why it failed automatically

Vercel returned:

```
ready_state: ERROR
errorCode:   git_info_fail
reason:      "Git information retrieval failed for this deployment."
```

The Vercel account has **no GitHub Login Connection**. Without it, Vercel cannot read
`yourprogrammerayush/academicos`, so every git deployment dies before the build starts.
Creating that connection is a browser login — it cannot be done through the API.

Everything else is already done:

- GitHub repo `academicos` is public, `main` is current
- Vercel project `academic-os` exists (`prj_18mYwfGUDYVJBfUuVmQEUR6SZhtt`)
- Env vars already set: `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GROQ_MODEL_PRIMARY`,
  `GROQ_MODEL_FAST`, `NEXT_PUBLIC_APP_URL`

---

## Step 1 — Connect GitHub (the part only you can do)

Option A, fastest:

1. Open the failed deployment:
   https://vercel.com/ayushjhaayush2006-3880s-projects/academic-os
2. Click **Connect Git Repository** (or **Settings → Git → Connect Git Repository**).
3. Authorise Vercel on GitHub if prompted → choose **yourprogrammerayush/academicos**.
4. Vercel redeploys automatically.

Option B, if you prefer importing fresh:

1. Go to https://vercel.com/new
2. **Import Git Repository** → `yourprogrammerayush/academicos`
3. When it asks for the project, pick the existing **academic-os**
4. Framework preset is auto-detected as **Next.js** — leave build/install/output blank
5. **Deploy**

The build runs `npm install` → `npm run assets` (restores fonts/icons, copies the pdf.js
worker) → `next build`. Expect roughly 1–2 minutes.

---

## Step 2 — Your URL

Production alias: **https://academicos-app.vercel.app**

Deployment-specific URLs look like
`academic-os-<hash>-ayushjhaayush2006-3880s-projects.vercel.app`.

Quick check once it is live:

| Path | Expected |
| --- | --- |
| `/` | Home with 67 files, "MATERIALS BY AYUSH JHA, 2CSE-4" |
| `/api/health` | JSON, `integrations.groq` and `.drive` both false until keys are added |
| `/api/catalog` | `mode: "curated"`, `files: 67` |
| `/manifest.webmanifest` | PWA manifest, installable |

---

## Step 3 — Optional keys (each has a fallback)

| Key | Where to get it | What changes |
| --- | --- | --- |
| `GROQ_API_KEY` | ✅ **configured** | Study AI streams from `openai/gpt-oss-120b` with `gpt-oss-20b` fallback |
| `GOOGLE_DRIVE_API_KEY` | Google Cloud Console → enable Drive API → API key | Catalog re-indexes the folder live instead of the curated 67-file snapshot, and media streams through the official Files API |

`GROQ_API_KEY` is set as a **sensitive** variable: encrypted at rest, write-only, and
never readable back through the API or dashboard. Verified live — both models returned
HTTP 200 on deployment `dpl_9Yn3me3mT7XwFwtewoqABrBK9owP`. `/api/health` reports
`"groq": true`.

`GOOGLE_DRIVE_API_KEY` is still unset, so the catalog uses the curated 67-file snapshot
and media streams via the direct-download URL.

---

## Notes

- If Drive streaming returns 424 in production, the file is not link-shared.
  Set `GOOGLE_DRIVE_API_KEY`, or share the folder as "Anyone with the link – Viewer".
- Once the GitHub connection exists, every push to `main` deploys automatically.
