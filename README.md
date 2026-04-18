# Rounding Cards

An iPad-first, offline-capable dashboard for building patient rounding cards and copying each one as a PNG straight into Apple Freeform. Dictate a note with the mic button and GPT turns it into a structured card.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 on the Mac. To test on the iPad over LAN, Vite binds to `0.0.0.0` — visit `http://<mac-ip>:5173` from Safari on the iPad.

## Settings (API key)

Open the **Settings** drawer in the app and paste your OpenAI API key. It lives only in `localStorage` on this device — never uploaded anywhere except directly to `api.openai.com` from the browser. You set it once and it persists across launches. Clear it anytime from the same drawer.

Default models (editable in Settings):

- Chat: `gpt-5.4`
- Transcription: `whisper-1`

## Voice dictation → card

Tap the mic. Dictate: *"Room 301, JM, 68 male, day 3, cardiac, HFrEF exacerbation, HOB up, on enox 40, Foley needs to come out, Cr uptrending, bowel reg pending…"* Tap again to stop. The audio is transcribed, then parsed into the RoundingCard JSON schema via GPT, and dropped into the editor for you to review and save.

## Copy to Apple Freeform

Tap **Copy PNG** on any card. Switch to Freeform, long-press an empty spot on the board, tap **Paste**. The card lands at 540 px.

## Install on iPad (offline PWA)

1. Deploy (see below) and open the URL in Safari on the iPad.
2. Share sheet → **Add to Home Screen**.
3. Launch from the home-screen icon — it runs full-screen, no Safari chrome, with a service worker caching the app shell.

After first load, the app works offline. The voice → GPT flow obviously needs network, but everything else (edit cards, copy PNG, etc.) works without wifi.

## Deploy to GitHub Pages

```bash
# one-time
git remote add origin <your-repo-url>
git push -u origin main

# publish
VITE_BASE=/<repo-name>/ npm run deploy
```

This builds the app with the correct base path and pushes `dist/` to the `gh-pages` branch. Enable GitHub Pages → Branch: `gh-pages` in repo settings.

If you use a custom domain or root path, run `npm run deploy` without `VITE_BASE`.

## Storage

- `ffc:cards` — your cards
- `ffc:settings` — `{ apiKey, chatModel, transcribeModel }`

All in `localStorage` on this browser profile only. No cloud sync. No backend.

## Out of scope

This is a personal scratchpad tool. It is **not** a chart, not PHI-compliant, not a medical device. Don't paste identifiable data into it.
