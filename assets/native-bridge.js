/* ════════════════════════════════════════════════════════════
   PCCS AWB · native-bridge.js
   ────────────────────────────────────────────────────────────
   Optional native shell glue. ONLY does work when the page is
   running inside a Capacitor WebView (Android / iOS).
   On a normal browser it is a complete no-op (~0.1 ms cost).

   Responsibilities (Capacitor-only):
     • Hide native splash screen once the app is interactive
     • Tint Android status bar to match the app background
     • Map the hardware Back button to:
         – mainApp visible          → click "← Dashboard"
         – historyPanel visible     → click "Recent History" to collapse
         – dashboard visible        → exitApp()
     • Respond to app pause / resume to refresh offline badge

   Loaded with `defer` AFTER the page DOM exists. Designed to
   never throw — every native API call is wrapped in try/catch.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Feature-detect: only proceed inside a Capacitor WebView.
  const isCapacitor = !!(
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  );

  if (!isCapacitor) return;   // browser → exit silently

  function safe (fn) { try { fn && fn(); } catch (e) { console.warn('[native]', e); } }

  // ── 1. Splash screen: hide once ready ─────────────────────
  function hideSplash () {
    safe(() => {
      const sp = window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen;
      if (sp && typeof sp.hide === 'function') sp.hide();
    });
  }
  if (document.readyState === 'complete') {
    setTimeout(hideSplash, 250);
  } else {
    window.addEventListener('load', () => setTimeout(hideSplash, 250), { once: true });
  }

  // ── 2. Status bar tint ────────────────────────────────────
  safe(() => {
    const sb = window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
    if (!sb) return;
    if (sb.setBackgroundColor) sb.setBackgroundColor({ color: '#0a0e1a' });
    if (sb.setStyle)           sb.setStyle({ style: 'DARK' });
    if (sb.setOverlaysWebView) sb.setOverlaysWebView({ overlay: false });
  });

  // ── 3. Hardware back button mapping ───────────────────────
  // (native press → in-app navigation, never a hard exit unless we're
  // already at the root dashboard)
  function wireBackButton () {
    safe(() => {
      const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (!App || !App.addListener) return;

      App.addListener('backButton', () => {
        const main      = document.getElementById('mainApp');
        const histPanel = document.getElementById('historyPanel');
        const back      = document.getElementById('backToDash');
        const histCard  = document.getElementById('cardHistory');

        if (main && !main.classList.contains('hidden')) {
          if (back) back.click();
          return;
        }
        if (histPanel && !histPanel.classList.contains('hidden')) {
          if (histCard) histCard.click();
          return;
        }
        // We're at the root dashboard → exit
        if (typeof App.exitApp === 'function') {
          App.exitApp();
        } else if (typeof App.minimizeApp === 'function') {
          App.minimizeApp();
        }
      });
    });
  }

  // ── 4. Pause / resume → re-check offline badge ────────────
  function wireAppState () {
    safe(() => {
      const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (!App || !App.addListener) return;

      App.addListener('appStateChange', (state) => {
        if (state && state.isActive) {
          // Touch the existing offlineBadge if a refresh function exists
          const ob = document.getElementById('offlineBadge');
          if (ob) ob.dataset.state = ob.dataset.state || 'checking';
          // Try a friendly toast if ui-modern.js is loaded
          if (typeof window.uiToast === 'function') {
            window.uiToast('Back online ✓', 'success', 1400);
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      wireBackButton();
      wireAppState();
    }, { once: true });
  } else {
    wireBackButton();
    wireAppState();
  }
})();
