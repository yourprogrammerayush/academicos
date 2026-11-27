# Getting the Google Drive API key

AcademicOS reads your master folder through the **Google Drive Files API**.
Without a key it serves the curated 67-file snapshot that ships in the repo.
With a key it crawls the whole folder live and new uploads appear on the site
immediately.

You need one key. It takes about five minutes.

---

## 1. Create (or pick) a Google Cloud project

1. Go to **https://console.cloud.google.com/**
2. Sign in with the Google account **that owns the Drive folder**.
3. Top bar → project dropdown → **New project**.
4. Name it `academicos` → **Create**, then make sure it is the selected project.

## 2. Enable the Drive API

1. Left menu → **APIs & Services → Library**
   (or open https://console.cloud.google.com/apis/library)
2. Search for **Google Drive API**.
3. Open it → **Enable**. Wait for it to turn on.

## 3. Create the API key

1. Left menu → **APIs & Services → Credentials**
   (or https://console.cloud.google.com/apis/credentials)
2. **+ Create credentials → API key**
3. Copy the key. It looks like `AIza...` — about 39 characters.

That is the whole key. You do **not** need OAuth, a service account, or a
client secret, because the app only ever *reads* public files through the
Files API.

## 4. Restrict the key (recommended)

The same dialog shows **Edit API key**. Do this before you close it:

- **Application restrictions** → *None*.
  (Do **not** set HTTP referrers — the key is used from a server, not a
  browser, and referrer restrictions would block it.)
- **API restrictions** → **Restrict key** → tick **Google Drive API** only.
- **Save**.

That way the key cannot be used for anything except listing Drive files.

> Optional extra: under **APIs & Services → Credentials → OAuth consent screen
> → Quotas**, you can cap daily requests. The free tier is 1,000,000 quota
> units/day; a full crawl of this folder costs a handful.

## 5. Put the key in Vercel — never in the repo

The key must live **only** as a Vercel environment variable. Never paste it
into a file, a commit, a README, a Drive doc, or a chat message.

1. Open **https://vercel.com/ayushjhaayush2006-3880s-projects/academic-os/settings/environment-variables**
2. **Add New**
3. Key: `GOOGLE_DRIVE_API_KEY`
4. Value: paste the `AIza...` key
5. Environments: tick **Production**, **Preview**, **Development**
6. **Save** → it will be stored as a **Sensitive** variable.

Then redeploy so the running build picks it up:

- **Deployments** tab → newest deployment → **⋯ → Redeploy**.

## 6. Confirm it worked

Open:

```
https://academicos-app.vercel.app/api/health
```

`integrations.drive` should flip from `false` to `true`.

Then open:

```
https://academicos-app.vercel.app/api/catalog?sync=1
```

The response should say `"driveConnected": true` and `"mode": "live"`, and
`note` should disappear. If it still says `GOOGLE_DRIVE_API_KEY not
configured`, the variable did not reach that deployment — redeploy again.

## 7. Make sure the folder is readable

The crawler walks the folder set in `GOOGLE_DRIVE_ROOT_FOLDER_ID`
(currently `1WqBC4aCKdxNm14HIshBSwV-080svsNGC`).

The folder and everything inside it must be shared as
**"Anyone with the link — Viewer"**. If a subfolder is private, it is skipped
and simply will not appear.

To check one file, open it in Drive and look at **Share** — if it says
"Restricted", the crawler cannot see it, and the in-app viewer and download
will 404 even though the file is listed.

---

## What happens once the key is set

- `/api/catalog` crawls the master folder recursively, server-side.
- Results are cached for **45 seconds** (fresh) and up to **10 minutes**
  (stale-while-revalidate), so the site never blocks on a Drive call.
- Uploading a file to the master folder makes it appear on the site within
  about a minute, without a reload — the app refetches on window focus.
- The chip next to **Library** switches from **Snapshot** to **Live**, and a
  toast reports how many files were added.

## Keeping the key safe

| Do | Don't |
| --- | --- |
| Store it as a Vercel **Sensitive** env var | Commit it to git |
| Restrict it to the Drive API | Put it in a `NEXT_PUBLIC_*` variable |
| Rotate it in Google Cloud → Credentials if it leaks | Paste it into chat, docs, or screenshots |

If the key ever leaks: open Google Cloud → **APIs & Services → Credentials**,
click the key, **Regenerate Key**, and update the Vercel variable. The app
reads it at request time, so a redeploy is all that is needed.
