# 5-Ball Catch Tracker

A mobile-first PWA for tracking daily 5-ball juggling catches and posting results automatically to a shared Google Sheet.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| PWA | vite-plugin-pwa (Workbox) |
| Styling | Plain CSS with design tokens |
| Data write | Google Apps Script Web App (no secrets in frontend) |

---

## Quick start (local development)

```bash
# 1. Install dependencies
npm install

# 2. Generate PWA icons from the SVG source (only needed once)
npm run generate-icons

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser or on your phone (same network).

> **Note:** PWA installation is only available from a production build served over HTTPS.  
> To test it: `npm run build && npm run preview`, then use ngrok or deploy.

---

## Production build & deploy

```bash
npm run build       # Outputs to dist/
npm run preview     # Preview locally at http://localhost:4173
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.).  
The app must be served over **HTTPS** for PWA installability.

---

## Google Apps Script setup

### 1. Create the Apps Script project

1. Open [script.google.com](https://script.google.com) → **New project**
2. Rename the project to "5-Ball Catch Tracker"
3. Delete all content from `Code.gs` and paste the contents of **`Code.gs`** from this repo
4. Save (`Ctrl+S`)

### 2. Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Fill in:
   - **Description:** `v1` (or anything)
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` ← **required for the app to post without login**
4. Click **Deploy** → copy the **Web App URL** (looks like `https://script.google.com/macros/s/ABC.../exec`)

### 3. Set the endpoint in the app

1. Open the app → go to **Settings**
2. Paste the Web App URL into the **Apps Script endpoint** field
3. Tap **Save endpoint**

### 4. Verify sheet tab names

Each player needs a tab named **`5 Bälle Name`** or **`5 Ballen Name`** (both spellings are tried).  
E.g. for player "Thomas": the tab must be `5 Bälle Thomas` or `5 Ballen Thomas`.

### 5. Sheet column layout

The script writes to these columns, **starting from the row that matches the date in column A**:

| Column | Content |
|--------|---------|
| A | Date (M/D/YYYY — e.g. `4/30/2026`) |
| B–K | Try 1–10 |
| L | Total |
| M | Average |
| N | Best try |
| O | Submitted at (ISO timestamp) |

If the date row already exists it is **overwritten**; otherwise a new row is appended.

---

## Example payload (what the frontend sends)

```json
{
  "name": "Thomas",
  "date": "2026-04-30",
  "sheetDate": "4/30/2026",
  "tries": [20, 25, 30, 28, 35, 38, 22, 18, 31, null],
  "total": 247,
  "average": 27.4,
  "best": 38,
  "submittedAt": "2026-04-30T14:22:05.123Z"
}
```

Sent as `application/x-www-form-urlencoded` with the JSON in the `payload` field — this avoids CORS preflight while remaining readable by Apps Script.

---

## PWA icon generation

Icons are generated from `public/icons/icon.svg` using `@vite-pwa/assets-generator`:

```bash
npm run generate-icons
```

This creates the following files inside `public/icons/`:

```
pwa-64x64.png
pwa-192x192.png
pwa-512x512.png
maskable-icon-512x512.png
apple-touch-icon-180x180.png
```

Run this command **before your first `npm run build`**.

---

## Updating the Apps Script after code changes

Every time you change `Code.gs` you need a **new deployment** (not just save):

1. Apps Script editor → **Deploy → Manage deployments**
2. Click the pencil icon on the existing deployment
3. Change the version to **"New version"**
4. Click **Deploy**
5. The URL stays the same — no need to update the app settings

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No endpoint configured" | Go to Settings, paste Web App URL, save |
| "Sheet not found for…" | Check tab name matches `5 Bälle Name` or `5 Ballen Name` |
| Data writes to wrong row | Dates in column A must be plain text `M/D/YYYY` (no leading zeros) |
| CORS error in console | Re-deploy Apps Script with "Anyone" access; check URL is the `/exec` URL |
| App not installable | Must be served over HTTPS; open in mobile browser → "Add to home screen" |
| Icons missing after build | Run `npm run generate-icons` then rebuild |
.