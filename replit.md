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
