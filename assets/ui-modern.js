/* ════════════════════════════════════════════════════════════
   PCCS AWB · ui-modern.js
   ────────────────────────────────────────────────────────────
   ADDITIVE-ONLY UI helpers. This file:
     • does NOT call any of the existing app functions directly
       (no handleB1, no doCalc, no triggerDownload, etc.)
     • does NOT modify any data, localStorage, or DOM IDs
     • only ADDS three optional UX layers:
         1. Bottom navigation bar (visual, taps existing buttons)
         2. Toast notifications      → window.uiToast(msg, type)
         3. Skeleton helpers         → window.uiSkeleton(el, on)
     • observes screen swaps via MutationObserver — read-only
     • all DOM nodes it adds are prefixed `ui-` and have hidden
       fallback so removing this file restores v3.1.5 behaviour.

   Safe to delete this file at any time.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__uiModernLoaded) return;   // idempotent
  window.__uiModernLoaded = true;

  // Wait for DOM ready (script is loaded with `defer`, but be safe)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // ── 1. Toast system ───────────────────────────────────────
  function ensureToastStack () {
    let stack = document.getElementById('uiToastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'uiToastStack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }

  function uiToast (message, type, duration) {
    try {
      if (!message) return;
      const stack = ensureToastStack();
      const el = document.createElement('div');
      el.className = 'ui-toast' + (type ? ' ' + type : '');
      const icon = type === 'success' ? '✅'
                 : type === 'error'   ? '⚠️'
                 : type === 'warn'    ? '🟠'
                 : 'ℹ️';
      const iconEl = document.createElement('span');
      iconEl.className = 'ui-toast-icon';
      iconEl.textContent = icon;
      const msgEl = document.createElement('span');
      msgEl.className = 'ui-toast-msg';
      msgEl.textContent = String(message);
      el.appendChild(iconEl);
      el.appendChild(msgEl);
      stack.appendChild(el);

      const ttl = Math.max(1200, Math.min(8000, duration || 2600));
      setTimeout(() => {
        el.classList.add('leaving');
        setTimeout(() => { el.remove(); }, 320);
      }, ttl);
    } catch (e) { /* fail-soft */ }
  }
  window.uiToast = uiToast;

  // ── 2. Skeleton helper ────────────────────────────────────
  function uiSkeleton (target, on) {
    try {
      const el = typeof target === 'string'
        ? document.getElementById(target)
        : target;
      if (!el) return;
      el.classList.toggle('ui-modern-skeleton', !!on);
    } catch (e) { /* fail-soft */ }
  }
  window.uiSkeleton = uiSkeleton;

  // ── 3. Bottom navigation bar ──────────────────────────────
  // Tabs: Home (dashboard), AWB (main tool), History, Lock
  // Each tab simulates a click on the EXISTING button — we never
  // change the underlying app state directly.
  function buildBottomNav () {
    if (document.getElementById('uiBottomNav')) return;

    const nav = document.createElement('nav');
    nav.id = 'uiBottomNav';
    nav.setAttribute('aria-label', 'Primary');

    const items = [
      { id: 'nav-home',    icon: '🏠', label: 'Home',    target: '__home__' },
      { id: 'nav-awb',     icon: '🚀', label: 'AWB',     target: 'cardCreateAwb' },
      { id: 'nav-history', icon: '📊', label: 'History', target: 'cardHistory' },
      { id: 'nav-lock',    icon: '🔒', label: 'Lock',    target: 'logoutBtn' }
    ];

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = item.id;
      btn.className = 'ui-nav-btn';
      btn.setAttribute('data-target', item.target);
      btn.innerHTML =
        '<span class="ui-nav-icon" aria-hidden="true">' + item.icon + '</span>' +
        '<span>' + item.label + '</span>';
      btn.addEventListener('click', () => navigate(item.target));
      nav.appendChild(btn);
    });

    document.body.appendChild(nav);

    // Show only after login overlay is gone
    requestAnimationFrame(() => {
      if (isLoggedIn()) {
        nav.classList.add('show');
        document.body.classList.add('ui-has-bottom-nav');
      }
    });
  }

  function isLoggedIn () {
    const login = document.getElementById('loginOverlay');
    return !login || login.classList.contains('hidden') ||
           getComputedStyle(login).display === 'none';
  }

  function navigate (target) {
    try {
      if (target === '__home__') {
        // Same as clicking "← Dashboard" if main app is open
        const back = document.getElementById('backToDash');
        const main = document.getElementById('mainApp');
        const dash = document.getElementById('dashboard');
        const histPanel = document.getElementById('historyPanel');
        if (main && !main.classList.contains('hidden') && back) {
          back.click();
        } else if (dash && histPanel && !histPanel.classList.contains('hidden')) {
          // collapse open history panel by re-clicking the history card
          const hCard = document.getElementById('cardHistory');
          if (hCard) hCard.click();
        }
        // gentle scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActive('nav-home');
        return;
      }
      const el = document.getElementById(target);
      if (el) {
        el.click();
        // map target -> nav id
        const map = {
          cardCreateAwb: 'nav-awb',
          cardHistory:   'nav-history',
          logoutBtn:     'nav-lock'
        };
        if (map[target]) setActive(map[target]);
      }
    } catch (e) { /* fail-soft */ }
  }

  function setActive (navId) {
    document.querySelectorAll('#uiBottomNav .ui-nav-btn')
      .forEach(b => b.classList.toggle('active', b.id === navId));
  }

  // ── 4. Observe screen swaps so the nav stays in sync ──────
  function observeScreens () {
    const dash = document.getElementById('dashboard');
    const main = document.getElementById('mainApp');
    const login = document.getElementById('loginOverlay');
    const histPanel = document.getElementById('historyPanel');
    const nav = document.getElementById('uiBottomNav');
    if (!nav) return;

    function refresh () {
      // Show nav only after login, and only when on main UI
      const visible = isLoggedIn();
      nav.classList.toggle('show', visible);
      document.body.classList.toggle('ui-has-bottom-nav', visible);

      if (main && !main.classList.contains('hidden')) {
        setActive('nav-awb');
      } else if (histPanel && !histPanel.classList.contains('hidden')) {
        setActive('nav-history');
      } else if (dash && !dash.classList.contains('hidden')) {
        setActive('nav-home');
      }
    }

    const mo = new MutationObserver(() => {
      // batch w/ rAF so we don't thrash on rapid class flips
      if (mo.__pending) return;
      mo.__pending = true;
      requestAnimationFrame(() => { mo.__pending = false; refresh(); });
    });
    [dash, main, login, histPanel].forEach(el => {
      if (el) mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    });

    // initial
    refresh();

    // also poll once after 1s in case the existing JS toggles things late
    setTimeout(refresh, 1000);
  }

  // ── 5. Friendly enhancements: tap-feedback, lazy share toast ──
  function enhanceShareButtons () {
    ['b1ShareBtn', 'b2ShareBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn || btn.dataset.uiEnhanced) return;
      btn.dataset.uiEnhanced = '1';
      btn.addEventListener('click', () => {
        // Only show informational toast — we do NOT prevent default
        uiToast('Preparing PDF for share…', 'info', 1800);
      }, { passive: true });
    });
    ['b1DlBtn', 'b2DlBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn || btn.dataset.uiEnhanced) return;
      btn.dataset.uiEnhanced = '1';
      btn.addEventListener('click', () => {
        uiToast('Generating PDF download…', 'info', 1800);
      }, { passive: true });
    });
  }

  // ── 6. Re-run share-button enhancement when those buttons unhide
  function watchActionButtons () {
    const targets = ['b1Wrap', 'b2Wrap'];
    targets.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const mo = new MutationObserver(enhanceShareButtons);
      mo.observe(el, { attributes: true, subtree: true, attributeFilter: ['class'] });
    });
  }

  // ── 7. Init ────────────────────────────────────────────────
  function init () {
    try {
      buildBottomNav();
      observeScreens();
      enhanceShareButtons();
      watchActionButtons();
    } catch (e) {
      // Never let UI helpers crash the core app
      console.warn('[ui-modern] init skipped:', e);
    }
  }
})();
