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
- **v2.8.3 (TAX border patch v5.2 — bottom-line micro-adjust)** — v5.1 (`taxWriteY-0.3`) was too close to the value (looked like an extra hairline against the digits). Moved bottom line down 0.4pt to `taxWriteY-0.7`, splitting the difference between v5 (too low) and v5.1 (too high). Right vertical (123.5) and thickness (0.35) kept from v5.1. SW cache bumped to `pccs-awb-v2.8.3-taxborder`.
- **v2.8.2 (TAX border patch v5.1)** — Tweaked v5 lines: `TAX_BOT_Y` raised from `taxWriteY-1.0` to `taxWriteY-0.3`, `TAX_BOX_RIGHT` shifted inward `124 → 123.5`, line `thickness: 0.5 → 0.35`.
- **v2.8.1 (TAX border patch v5)** — White-rect inset alone (v4) wasn't enough to close the visible gaps on the TAX cell's right vertical and bottom horizontal. Added two thin black overlay lines via `page.drawLine()` after the TAX text writes. Lines avoid both the value (right-aligned at x≈107) and the TAX label (at x=138), so no text is touched.
- **v2.8 (spinner + mobile)** — Added full-screen processing spinner overlay (`#procOverlay`) shown during PDF re-render in `triggerDownload` for both B1/B2 modes. Added 8 MB file-size guard at upload to prevent mobile crashes. Added `await delay(0)` yield in `handleB1` step 3 and in spinner branches so step UI paints before pdf-lib blocks the main thread.
- **v4 TAX box border fix** — In `applyEdits()`, tightened TAX value white rect (RECT 1 only): `width: 66.0 → 49.0` and bottom raised `0.5pt` (`y: taxWriteY-0.5 → taxWriteY`, `height: 7.0 → 6.5`). This stops the white fill from bleeding onto the right vertical and bottom horizontal of the TAX cell's border. RECT 2 (dots) and TAX label position untouched.
- **v2.7 (CSV export)** — History list now exports as CSV (UTF-8 BOM, columns: #/AWB/Date/Time/Total).
