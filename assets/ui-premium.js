/* ════════════════════════════════════════════════════════════
   PCCS AWB · ui-premium.js   [PREVIEW]
   ────────────────────────────────────────────────────────────
   Premium app-experience companion to ui-premium.css.

   Self-contained. Only injects NEW DOM nodes (with `ups-` prefix)
   and reads existing ones. Never modifies any existing function,
   ID, calculation, or PDF logic.

   Adds:
     1. Splash screen overlay (auto-dismisses in ~1.4s)
     2. Time-of-day greeting in welcome card
     3. Decorative cargo-plane SVG in welcome card
     4. Bottom navigation with sliding pill indicator + central FAB
     5. Floating Action Button on dashboard
     6. Slide direction animation between dashboard ↔ mainApp
     7. Count-up animation on Total Prepaid (display only)
     8. Toast helper window.upsToast(msg, type)

   Reverting: delete the <script src="assets/ui-premium.js"> tag.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__upsPremiumLoaded) return;
  window.__upsPremiumLoaded = true;

  // ──────────────────────────────────────────────────────────
  // 1 · Splash screen — show as soon as <body> exists
  // ──────────────────────────────────────────────────────────
  function buildSplash () {
    if (document.getElementById('upsSplash')) return;
    if (!document.body) return;

    const root = document.createElement('div');
    root.id = 'upsSplash';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = ''
      + '<div class="ups-orb ups-orb-1"></div>'
      + '<div class="ups-orb ups-orb-2"></div>'
      + '<div class="ups-orb ups-orb-3"></div>'
      + '<div class="ups-content">'
      +   '<div class="ups-logo-ring">'
      +     '<svg viewBox="0 0 24 24" aria-hidden="true">'
      +       '<path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>'
      +     '</svg>'
      +   '</div>'
      +   '<div class="ups-title">PCCS AWB</div>'
      +   '<div class="ups-tag">CARGO · GST · PDF EDITOR</div>'
      +   '<div class="ups-loader" role="progressbar" aria-label="Loading"></div>'
      + '</div>';
    document.body.appendChild(root);

    // Auto-dismiss after 1.4s; quicker if app is fully ready
    const minShow = 1400;
    const startedAt = performance.now();
    function dismiss () {
      const el = document.getElementById('upsSplash');
      if (!el) return;
      el.classList.add('ups-leaving');
      setTimeout(() => { try { el.remove(); } catch (_) {} }, 600);
    }
    function maybeDismiss () {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= minShow) dismiss();
      else setTimeout(dismiss, minShow - elapsed);
    }
    if (document.readyState === 'complete') {
      maybeDismiss();
    } else {
      window.addEventListener('load', maybeDismiss, { once: true });
      // Hard cap at 3 seconds in case load never fires
      setTimeout(dismiss, 3000);
    }
  }

  // ──────────────────────────────────────────────────────────
  // 2 · Time-of-day greeting + welcome card decoration
  // ──────────────────────────────────────────────────────────
  function decorateWelcomeCard () {
    const greet = document.querySelector('.welcome-card .welcome-greet');
    if (greet && !greet.dataset.upsDecorated) {
      const h = new Date().getHours();
      let label = 'Welcome back';
      let icon  = '✨';
      if      (h < 5)  { label = 'Working late';     icon = '🌙'; }
      else if (h < 12) { label = 'Good morning';     icon = '☀️'; }
      else if (h < 17) { label = 'Good afternoon';   icon = '🌤'; }
      else if (h < 21) { label = 'Good evening';     icon = '🌆'; }
      else             { label = 'Good night';       icon = '🌙'; }
      greet.textContent = label + ' ' + icon;
      greet.dataset.upsDecorated = '1';
    }

    const card = document.querySelector('.welcome-card');
    if (card && !card.querySelector('.ups-deco-plane')) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'ups-deco-plane');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z');
      path.setAttribute('fill', '#67e8f9');
      svg.appendChild(path);
      card.appendChild(svg);
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3 · Bottom navigation + sliding pill + central FAB-style item
  // ──────────────────────────────────────────────────────────
  // SVG icon library (line-art style, currentColor stroke)
  const SVG = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M3 6h13M3 12h13M3 18h13"/><circle cx="20" cy="6" r="0.6"/><circle cx="20" cy="12" r="0.6"/><circle cx="20" cy="18" r="0.6"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>'
  };

  function buildBottomNav () {
    if (document.getElementById('upsBottomNav')) return;

    const nav = document.createElement('nav');
    nav.id = 'upsBottomNav';
    nav.setAttribute('aria-label', 'Primary navigation');

    const items = [
      { id: 'ups-nav-home',    icon: SVG.home, label: 'Home',    target: '__home__' },
      { id: 'ups-nav-history', icon: SVG.list, label: 'History', target: 'cardHistory' },
      { id: 'ups-nav-awb',     icon: SVG.plus, label: 'AWB',     target: 'cardCreateAwb', center: true },
      { id: 'ups-nav-lock',    icon: SVG.lock, label: 'Lock',    target: 'logoutBtn' }
    ];

    // Re-order so center is in the middle visually (Home, History, AWB(center), Lock)
    // We use grid-template-columns repeat(4, 1fr) so order = visual order.
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = item.id;
      btn.className = 'ups-nav-btn' + (item.center ? ' center' : '');
      btn.setAttribute('data-target', item.target);
      btn.setAttribute('aria-label', item.label);
      btn.innerHTML =
          '<span class="ups-nav-icon" aria-hidden="true">' + item.icon + '</span>' +
          '<span class="ups-nav-label">' + item.label + '</span>';
      btn.addEventListener('click', () => navigate(item.target, btn));
      nav.appendChild(btn);
    });

    // Sliding pill indicator
    const pill = document.createElement('span');
    pill.className = 'ups-pill';
    nav.appendChild(pill);

    document.body.appendChild(nav);

    // Position pill on first paint
    requestAnimationFrame(() => positionPill());
    setTimeout(positionPill, 300);
  }

  function positionPill (forceBtn) {
    const nav = document.getElementById('upsBottomNav');
    if (!nav) return;
    const pill = nav.querySelector('.ups-pill');
    if (!pill) return;

    const active = forceBtn || nav.querySelector('.ups-nav-btn.active');
    if (!active) {
      pill.style.opacity = '0';
      return;
    }
    const isCenter = active.classList.contains('center');
    pill.classList.toggle('under-center', isCenter);
    if (isCenter) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '1';

    const navRect = nav.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    const left = btnRect.left + btnRect.width / 2 - navRect.left - 14; // pill width 28 / 2
    pill.style.left = Math.round(left) + 'px';
  }

  function setActiveNav (id) {
    const nav = document.getElementById('upsBottomNav');
    if (!nav) return;
    let activeBtn = null;
    nav.querySelectorAll('.ups-nav-btn').forEach(b => {
      const isActive = b.id === id;
      b.classList.toggle('active', isActive);
      if (isActive) activeBtn = b;
    });
    if (activeBtn) positionPill(activeBtn);
  }

  function navigate (target, sourceBtn) {
    try {
      if (target === '__home__') {
        const back  = document.getElementById('backToDash');
        const main  = document.getElementById('mainApp');
        const dash  = document.getElementById('dashboard');
        const histP = document.getElementById('historyPanel');
        if (main && !main.classList.contains('hidden') && back) {
          back.click();
        } else if (histP && !histP.classList.contains('hidden')) {
          const hCard = document.getElementById('cardHistory');
          if (hCard) hCard.click();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(target);
      if (el) el.click();
    } catch (e) { /* fail-soft */ }
  }

  // ──────────────────────────────────────────────────────────
  // 4 · Sync nav state with screen visibility
  // ──────────────────────────────────────────────────────────
  function isLoggedIn () {
    const login = document.getElementById('loginOverlay');
    if (!login) return true;
    if (login.classList.contains('hidden')) return true;
    const cs = getComputedStyle(login);
    return cs.display === 'none' || cs.visibility === 'hidden';
  }

  function syncNavVisibility () {
    const nav = document.getElementById('upsBottomNav');
    if (!nav) return;
    const visible = isLoggedIn();
    nav.classList.toggle('show', visible);
  }

  function refreshActiveTab () {
    const main      = document.getElementById('mainApp');
    const histPanel = document.getElementById('historyPanel');
    const dash      = document.getElementById('dashboard');

    if (main && !main.classList.contains('hidden')) {
      setActiveNav('ups-nav-awb');
    } else if (histPanel && !histPanel.classList.contains('hidden')) {
      setActiveNav('ups-nav-history');
    } else if (dash && !dash.classList.contains('hidden')) {
      setActiveNav('ups-nav-home');
    } else {
      setActiveNav(null);
    }
  }

  function observeScreens () {
    const dash      = document.getElementById('dashboard');
    const main      = document.getElementById('mainApp');
    const login     = document.getElementById('loginOverlay');
    const histPanel = document.getElementById('historyPanel');

    let pending = false;
    function schedule () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        syncNavVisibility();
        refreshActiveTab();
      });
    }

    const mo = new MutationObserver(schedule);
    [dash, main, login, histPanel].forEach(el => {
      if (el) mo.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
    });

    schedule();
    setTimeout(schedule, 500);
    setTimeout(schedule, 1500);
    window.addEventListener('resize', () => positionPill(), { passive: true });
  }

  // ──────────────────────────────────────────────────────────
  // 5 · Slide-direction class on screen swap
  // ──────────────────────────────────────────────────────────
  function wrapSlideDirection () {
    const dash = document.getElementById('dashboard');
    const main = document.getElementById('mainApp');
    if (!dash || !main) return;

    function update (toMain) {
      if (toMain) {
        main.classList.add('ups-from-dash');
        dash.classList.remove('ups-from-main');
      } else {
        dash.classList.add('ups-from-main');
        main.classList.remove('ups-from-dash');
      }
    }

    const dashMo = new MutationObserver(() => {
      if (!main.classList.contains('hidden')) update(true);
      if (!dash.classList.contains('hidden')) update(false);
    });
    dashMo.observe(dash, { attributes: true, attributeFilter: ['class'] });
    dashMo.observe(main, { attributes: true, attributeFilter: ['class'] });
  }

  // ──────────────────────────────────────────────────────────
  // 6 · Floating Action Button on dashboard
  // ──────────────────────────────────────────────────────────
  function buildFab () {
    if (document.getElementById('upsFab')) return;
    const fab = document.createElement('button');
    fab.id = 'upsFab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Create AWB PDF');
    fab.innerHTML = '<span class="ups-fab-glyph">+</span>';
    fab.addEventListener('click', () => {
      const card = document.getElementById('cardCreateAwb');
      if (card) card.click();
    });
    document.body.appendChild(fab);

    function syncFab () {
      const dash  = document.getElementById('dashboard');
      const histP = document.getElementById('historyPanel');
      const showOnDash =
        dash && !dash.classList.contains('hidden') &&
        (!histP || histP.classList.contains('hidden')) &&
        isLoggedIn();
      fab.classList.toggle('visible', !!showOnDash);
    }

    const dash = document.getElementById('dashboard');
    if (dash) {
      const mo = new MutationObserver(syncFab);
      mo.observe(dash, { attributes: true, attributeFilter: ['class'] });
    }
    const histP = document.getElementById('historyPanel');
    if (histP) {
      const mo = new MutationObserver(syncFab);
      mo.observe(histP, { attributes: true, attributeFilter: ['class'] });
    }
    const login = document.getElementById('loginOverlay');
    if (login) {
      const mo = new MutationObserver(syncFab);
      mo.observe(login, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    setTimeout(syncFab, 200);
    setTimeout(syncFab, 1500);
  }

  // ──────────────────────────────────────────────────────────
  // 7 · Count-up on result totals (display-only, never re-calcs)
  // ──────────────────────────────────────────────────────────
  function attachCountUp () {
    const targets = ['rTotal', 'b1Total'];
    targets.forEach(id => {
      const node = document.getElementById(id);
      if (!node || node.dataset.upsCount) return;
      node.dataset.upsCount = '1';
      let lastText = node.textContent.trim();
      let animating = false;

      const mo = new MutationObserver(() => {
        const cur = node.textContent.trim();
        if (cur === lastText || animating) return;
        if (!cur || cur === '-' || !/[\d]/.test(cur)) {
          lastText = cur;
          return;
        }
        const finalText = cur;
        const m = cur.match(/[\d,]+\.\d+/) || cur.match(/[\d,]+/);
        if (!m) { lastText = cur; return; }
        const final = parseFloat(m[0].replace(/,/g, ''));
        if (!isFinite(final) || final <= 0) { lastText = cur; return; }
        lastText = finalText;
        runCount(node, final, finalText);
      });
      mo.observe(node, { childList: true, characterData: true, subtree: true });

      function runCount (n, target, finalText) {
        animating = true;
        const dur = 700;
        const t0  = performance.now();
        const useGrouping = /,/.test(finalText);
        const decimals = (finalText.match(/\.(\d+)/) || ['', '00'])[1].length;
        const prefix = (finalText.match(/^[^\d-]+/) || [''])[0];
        const suffix = (finalText.match(/[^\d.]+$/) || [''])[0];

        function format (val) {
          const fixed = val.toFixed(decimals);
          if (!useGrouping) return prefix + fixed + suffix;
          const parts = fixed.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          return prefix + parts.join('.') + suffix;
        }

        function tick (now) {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const cur = target * eased;
          n.textContent = format(cur);
          if (p < 1) requestAnimationFrame(tick);
          else { n.textContent = finalText; animating = false; }
        }
        requestAnimationFrame(tick);
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // 8 · Toast helper — window.upsToast(msg, type, duration)
  // ──────────────────────────────────────────────────────────
  function ensureToastStack () {
    let stack = document.getElementById('upsToastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'upsToastStack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }
  function upsToast (message, type, duration) {
    try {
      if (!message) return;
      const stack = ensureToastStack();
      const el = document.createElement('div');
      el.className = 'ups-toast' + (type ? ' ' + type : '');
      const icon = type === 'success' ? '✓'
                 : type === 'error'   ? '⚠'
                 : type === 'warn'    ? '!'
                 : 'i';
      const iconEl = document.createElement('span');
      iconEl.className = 'ups-toast-icon';
      iconEl.textContent = icon;
      const msgEl = document.createElement('span');
      msgEl.className = 'ups-toast-msg';
      msgEl.textContent = String(message);
      el.appendChild(iconEl);
      el.appendChild(msgEl);
      stack.appendChild(el);

      const ttl = Math.max(1200, Math.min(8000, duration || 2600));
      setTimeout(() => {
        el.classList.add('leaving');
        setTimeout(() => { try { el.remove(); } catch (_) {} }, 320);
      }, ttl);
    } catch (e) { /* fail-soft */ }
  }
  window.upsToast = upsToast;

  // ──────────────────────────────────────────────────────────
  // 9 · Friendly download/share notifications
  // ──────────────────────────────────────────────────────────
  function watchActionButtons () {
    function attach (id, msg) {
      const btn = document.getElementById(id);
      if (!btn || btn.dataset.upsHinted) return;
      btn.dataset.upsHinted = '1';
      btn.addEventListener('click', () => upsToast(msg, 'info', 1800), { passive: true });
    }
    function pass () {
      attach('b1DlBtn',    'Generating PDF download…');
      attach('b1ShareBtn', 'Preparing PDF for share…');
      attach('b2DlBtn',    'Generating PDF download…');
      attach('b2ShareBtn', 'Preparing PDF for share…');
    }
    pass();
    // Re-attach if buttons get hidden/shown again
    ['b1Wrap','b2Wrap'].forEach(id => {
      const w = document.getElementById(id);
      if (!w) return;
      const mo = new MutationObserver(pass);
      mo.observe(w, { attributes: true, subtree: true, childList: true, attributeFilter: ['class'] });
    });
  }

  // ──────────────────────────────────────────────────────────
  // 10 · Init
  // ──────────────────────────────────────────────────────────
  function init () {
    try {
      buildSplash();
      buildBottomNav();
      buildFab();
      decorateWelcomeCard();
      observeScreens();
      wrapSlideDirection();
      attachCountUp();
      watchActionButtons();
    } catch (e) {
      console.warn('[ui-premium] init partial:', e);
    }
  }

  // Splash should appear ASAP, before DOMContentLoaded
  if (document.body) {
    buildSplash();
  } else {
    document.addEventListener('DOMContentLoaded', buildSplash, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
