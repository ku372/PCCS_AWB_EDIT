#!/usr/bin/env node
/**
 * scripts/build-web.js
 * ────────────────────────────────────────────────────────────
 * Copies the existing static web app files into ./dist so that
 * Capacitor (webDir = "dist") can package them into the Android
 * APK without touching the original sources.
 *
 * Pure Node — no external deps, no bundler.
 *
 * Usage:
 *   node scripts/build-web.js
 *   npm run build:web
 *   npm run cap:sync           (auto-runs this first)
 * ────────────────────────────────────────────────────────────
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');

/**
 * Things that ARE part of the web app and must ship inside the APK.
 * Add new top-level files / folders here when needed. Files missing
 * on disk are silently skipped.
 */
const INCLUDE = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'assets'              // entire folder (ui-modern.css / .js, etc.)
];

/**
 * Things that must NEVER ship inside the APK (they would bloat it
 * or conflict with the native shell).
 */
const EXCLUDE = new Set([
  'node_modules', 'android', 'ios', 'dist', 'scripts',
  '.git', '.github', '.replit', '.gitignore',
  'package.json', 'package-lock.json', 'capacitor.config.json',
  'capacitor.config.ts', 'capacitor.config.js',
  'BUILD_ANDROID.md', 'replit.md', 'README.md',
  'attached_assets', 'index-4.html'
]);

function rmrf (target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive (src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (EXCLUDE.has(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main () {
  console.log('[build-web] cleaning', OUT_DIR);
  rmrf(OUT_DIR);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let copied = 0;
  for (const item of INCLUDE) {
    const src = path.join(ROOT, item);
    const dst = path.join(OUT_DIR, item);
    if (!fs.existsSync(src)) {
      console.warn('[build-web] skip (missing):', item);
      continue;
    }
    copyRecursive(src, dst);
    copied++;
    console.log('[build-web] copied', item);
  }

  console.log('[build-web] done. ' + copied + ' top-level entries → dist/');
}

try {
  main();
} catch (err) {
  console.error('[build-web] FAILED:', err && err.stack ? err.stack : err);
  process.exit(1);
}
