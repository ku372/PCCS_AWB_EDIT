# PCCS AWB Tool

## Overview
A static client-side Progressive Web App (PWA) for IndiGo AWB GST calculation and PDF editing. Built by PCCS (Pradeep Cargo & Courier Service).

## Architecture
- **Type**: Pure static site (no backend, no build step)
- **Tech**: Single `index.html` file with inline CSS/JS, plus a service worker (`sw.js`) and PWA manifest (`manifest.json`)
- **Dependencies**: PDF.js and PDF-lib loaded from CDN at runtime
- **Language**: HTML/CSS/JavaScript with Hindi (Devanagari) UI text

## Project Structure
- `index.html` — main app (UI, styles, logic all inline)
- `manifest.json` — PWA manifest
- `sw.js` — service worker for offline caching
- `icon-192.png`, `icon-512.png` — PWA icons

## App Flow (v2.5)
1. **Login Screen** — Full-screen PIN gate (PIN: `2024`). Uses localStorage key `pccs_auth_v1` for a 24-hour session.
2. **Dashboard** — Welcome card + two action cards: "Create / Edit AWB PDF" (opens main tool) and "Recent History" (placeholder for future DB work). Includes a "Lock App" button that clears the session.
3. **Main App** (`#mainApp`) — The original PDF upload / GST calculator / PDF editor flow, untouched. A "← Dashboard" back button returns to the dashboard. The original PDF processing, calculation, and Share button JavaScript is preserved exactly as written.

## Replit Setup
- **Workflow**: `Start application` runs `python3 -m http.server 5000 --bind 0.0.0.0` to serve the static files on port 5000.
- **Deployment**: Configured as a `static` deployment with `publicDir: "."` (project root).

## Recent Changes
- **v2.9.4 (stale version fix)** — Updated the visible build stamp to `v2.9.4 · 03 May 2026` and bumped the SW cache key to `pccs-awb-v2.9.4-buildstamp` so the browser stops showing the old 2.9.3 stamp after hard refresh / cache clear. PDF logic unchanged.
- **v2.9.4 (mobile crash hardening)** — Reduced the mobile safe PDF limit to 5 MB, delayed SW registration until window load, and made SW install/fetch logic fail-soft so weak phones don’t crash during startup or network/cache edge cases. Kept the Fix App button, offline badge, and build stamp from v2.9.3.
- **v2.9.3 (Build stamp under offline badge)** — Added a tiny version + build-date line ("v2.9.3 · 26 Apr 2026") directly below the offline-ready badge so the user can tell at a glance which version their phone is running. Styled extra-subtle (0.58rem, 75% opacity, muted color) — visible but unobtrusive. Update both the `#appBuild` text in HTML and the SW `CACHE_NAME` together on every release. SW cache bumped to `pccs-awb-v2.9.3-buildstamp`.
- **v2.9.2 (Offline-Ready badge)** — Added a small subtle status pill to the dashboard (between welcome card and Quick Actions). Three states: `🟢 Offline Ready`, `🟠 Caching…` (pulses), `⚪ Online Only`. Cache lookup is version-agnostic (matches any `pccs-awb-*` key) so it survives future SW bumps. Badge refreshes on dashboard show, on `controllerchange`, on `online`/`offline`, and via two grace-period rechecks at 1.5s & 4s after load.
- **v2.9.1 (Fix App button)** — Added a `🔧 Fix App` button to the dashboard footer (next to `🔒 Lock App`). On click it shows a confirm dialog ("App ko refresh karein? Isse errors theek ho sakte hain."); if accepted it clears all `caches` entries, unregisters every Service Worker, then force-reloads via `window.location.reload(true)`.
- **v2.9.0 (REVERT — TAX border patches removed)** — Per user, all TAX border modifications (v4 white-rect tightening + v5/v5.1/v5.2/v5.3/v5.4/v5.5 overlay lines) caused more visual problems than they solved (gaps, double-lines, extra hairlines). Reverted the TAX section in `applyEdits()` back to its pristine pre-v4 state: RECT 1 restored to `x=58, y=taxWriteY-0.5, width=66.0, height=7.0`; the entire `page.drawLine()` overlay block removed. Spinner overlay, 8 MB upload guard, and `await delay(0)` yields from v2.8 are preserved.
- **v2.8 (spinner + mobile) — KEPT** — Full-screen processing spinner overlay (`#procOverlay`) shown during PDF re-render in `triggerDownload` for both B1/B2 modes. 8 MB file-size guard at upload to prevent mobile crashes. `await delay(0)` yield in `handleB1` step 3 and in spinner branches so step UI paints before pdf-lib blocks the main thread.
- **v2.7 (CSV export)** — History list now exports as CSV (UTF-8 BOM, columns: #/AWB/Date/Time/Total).
