/* site.js: the Wellgreens static rebuild's interaction layer (vanilla JS, no dependencies).
 *
 * The live site is a Next.js app; the build removes React, so this file gives the server-rendered
 * markup back the behaviour the React components added on the client. Each part below is ported
 * from the live component code (read off the live chunks 2026-11-24) and keeps the site's own
 * class names, data-state values and timings so its Tailwind CSS animates exactly as on the live
 * site. One deferred file on every page: every part checks for its markup first and does nothing
 * when the page does not have it. */
(function () {
  'use strict';
  var d = document, w = window, html = d.documentElement;
  html.classList.add('wg-js');

  var BASE = w.__WG_BASE__ || '', PATH = w.__WG_PATH__ || location.pathname, unbase = function (h) { return BASE && (h === BASE || h.indexOf(BASE + '/') === 0) ? h.slice(BASE.length) || '/' : h; }; // preview-build: served under BASE
  var LANG = (html.getAttribute('lang') || '').indexOf('es') === 0 || /^\/es(\/|$)/.test(PATH) ? 'es' : 'en';
  var ORIGIN = 'https://www.wellgreens.store';
  var T = LANG === 'es' ? {
    openNow: 'ABIERTO', closingSoon: 'CERRANDO PRONTO', closed: 'CERRADO', shoppingAt: 'COMPRANDO EN', selectStore: 'Elegir Tienda', shop: 'Comprar', pickup: 'Recogida',
    changePickupStore: 'Cambiar tienda de recogida, actualmente {store}', deliveryHubLabel: 'Ya entregamos', deliveryHub: 'Entrega \u00b7 {hub}',
    hoursUnavailable: 'Horario no disponible', openUntil: 'Abierto hasta', opensAt: 'Abre a las',
    lsOpenNow: 'Abierto', lsClosingSoon: 'Cerrando Pronto', lsClosed: 'Cerrado', noStoresFound: 'No se encontraron tiendas que coincidan con', nowShoppingAt: 'Ahora comprando en',
    locationError: 'Acceso a ubicaci\u00f3n denegado o no disponible. Por favor busca manualmente.', detecting: 'Detectando...', useLocation: 'Usar Ubicaci\u00f3n', closeSelector: 'Cerrar selector de tienda',
    mapLoadError: 'El mapa no pudo cargar. Usa la vista de lista.', clearSearch: 'Limpiar b\u00fasqueda',
    shopAtStore: 'Comprar en l\u00ednea en Wellgreens {store}', shopSelectStore: 'Comprar - selecciona una tienda primero',
    slide: 'Imagen {current} de {total}', prev: 'Imagen anterior', next: 'Imagen siguiente', copyCode: 'Copiar c\u00f3digo de cup\u00f3n', copied: '\u00a1Copiado!'
  } : {
    openNow: 'OPEN NOW', closingSoon: 'CLOSING SOON', closed: 'CLOSED', shoppingAt: 'SHOPPING AT', selectStore: 'Select Store', shop: 'Shop', pickup: 'Pickup',
    changePickupStore: 'Change pickup store, currently {store}', deliveryHubLabel: 'Now delivering', deliveryHub: 'Delivery \u00b7 {hub}',
    hoursUnavailable: 'Hours unavailable', openUntil: 'Open until', opensAt: 'Opens at',
    lsOpenNow: 'Open Now', lsClosingSoon: 'Closing Soon', lsClosed: 'Closed', noStoresFound: 'No stores found matching', nowShoppingAt: 'Now shopping at',
    locationError: 'Location access denied or unavailable. Please search manually.', detecting: 'Detecting...', useLocation: 'Use Location', closeSelector: 'Close store selector',
    mapLoadError: 'Map could not load. Please use the list view.', clearSearch: 'Clear search',
    shopAtStore: 'Shop online at Wellgreens {store}', shopSelectStore: 'Shop - select a store location first',
    slide: 'Image {current} of {total}', prev: 'Previous image', next: 'Next image', copyCode: 'Copy coupon code', copied: 'Copied!'
  };

  // ---------------------------------------------------------------------------------------------
  // small helpers
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var raf = w.requestAnimationFrame ? w.requestAnimationFrame.bind(w) : function (f) { return setTimeout(f, 16); };
  var noop = function () {};
  var mq = function (q) { var m = w.matchMedia ? w.matchMedia(q) : null; return m || { matches: false, addEventListener: noop }; };
  var onMq = function (m, f) { if (m.addEventListener) m.addEventListener('change', f); else if (m.addListener) m.addListener(f); };
  var RM = mq('(prefers-reduced-motion: reduce)'), MOB = mq('(max-width: 767px)');
  var SAFARI = html.classList.contains('safari');
  var store = (function () { // the site's storage module: localStorage, else sessionStorage, else memory
    var mem = {}, s = null;
    try { localStorage.setItem('_wellgreens_storage_test', '1'); localStorage.removeItem('_wellgreens_storage_test'); s = localStorage; } catch (e) {
      try { sessionStorage.setItem('_wellgreens_storage_test', '1'); sessionStorage.removeItem('_wellgreens_storage_test'); s = sessionStorage; } catch (e2) {}
    }
    return {
      get: function (k) { try { return s ? s.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return null; } },
      set: function (k, v) { try { if (s) s.setItem(k, v); else mem[k] = String(v); } catch (e) {} },
      del: function (k) { try { if (s) s.removeItem(k); else delete mem[k]; } catch (e) {} }
    };
  })();
  var tpl = function (s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); };
  var h = function (markup) { var t = d.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; };
  var ICON = {
    'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    'circle-check': '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>',
    'x': '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
    'chevron-right': '<path d="m9 18 6-6-6-6"></path>'
  };
  var icon = function (name, cls, hidden) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-' + name + (cls ? ' ' + cls : '') + '"' + (hidden ? ' aria-hidden="true"' : '') + '>' + ICON[name] + '</svg>';
  };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var liveUrl = function (p) { return ORIGIN + p; };
  var localePath = function (p) { return BASE + (LANG === 'es' ? '/es' + (p === '/' ? '' : p) : p); };

  // ---------------------------------------------------------------------------------------------
  // smoothed scroll bus (the live app's shared scroll subscription: a damped spring toward scrollY;
  // the header state, the progress bar and the pinned scroller all hang off it)
  var onScroll = (function () {
    var subs = [], max = 1, vh = 600, cur = 0, vel = 0, running = false, started = false;
    var state = function () { return { scrollY: cur, scrollMax: max, innerHeight: vh }; };
    function measure() { vh = w.innerHeight; max = Math.max(1, html.scrollHeight - vh); }
    function tick() {
      var raw = w.scrollY, dl = raw - cur;
      vel = (vel + 0.08 * dl) * 0.75; cur += vel;
      if (dl > -0.1 && dl < 0.1 && vel > -0.1 && vel < 0.1) { cur = raw; vel = 0; }
      var s = state();
      for (var i = 0; i < subs.length; i++) subs[i](s);
      if (cur !== raw || vel !== 0) raf(tick); else running = false;
    }
    function kick() { if (!running) { running = true; raf(tick); } }
    function start() {
      if (started) return; started = true;
      measure(); cur = w.scrollY;
      w.addEventListener('scroll', kick, { passive: true });
      w.addEventListener('resize', function () { measure(); kick(); }, { passive: true });
      if (w.ResizeObserver) { var ro = new ResizeObserver(function () { measure(); kick(); }); ro.observe(html); if (d.body) ro.observe(d.body); }
      kick();
    }
    return function (fn) { start(); subs.push(fn); fn(state()); };
  })();

  // ---------------------------------------------------------------------------------------------
  // stores: the picker markup (in the layout, on every page) carries names and hours; coordinates
  // come from the live store table (lat/lng are not in the markup)
  var GEO = {
    'pacific-beach-de-soto-st': [32.8024, -117.2285], 'mission-valley-camino-del-rio-s': [32.7758, -117.1167], 'kearny-mesa-balboa-ave': [32.8228, -117.1554],
    'city-heights-home-ave': [32.7291, -117.0989], 'encinitas-n-el-camino-real': [33.0564, -117.2599], 'la-mesa-university-ave': [32.7601, -117.0425],
    'la-mesa-lake-murray-blvd': [32.7797, -117.0378], 'lemon-grove-federal-blvd': [32.7324, -117.0475], 'vista-s-santa-fe-ave': [33.197, -117.2343],
    'chula-vista-broadway': [32.6186, -117.0853]
  };
  var CENTER = { lat: 32.7157, lng: -117.1611 };
  var HUBS = { 'vista-s-santa-fe-ave': 'Vista', 'la-mesa-university-ave': 'University Ave' };
  var STORE_KEY = 'wellgreens_selected_store', AGE_KEY = 'wellgreens_age_verified';
  var miles = function (a, b, c, e) { // haversine, earth radius 3958.8 mi
    var r = Math.PI / 180, x = r * (c - a), y = r * (e - b);
    var q = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(r * a) * Math.cos(r * c) * Math.sin(y / 2) * Math.sin(y / 2);
    return 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)) * 3958.8;
  };
  var fmtMiles = function (m) { return m < 0.1 ? '< 0.1 mi' : m < 10 ? m.toFixed(1) + ' mi' : Math.round(m) + ' mi'; };
  var STORES = {};
  $$('[data-store-select][data-store-slug]').forEach(function (b) {
    var slug = b.getAttribute('data-store-slug'), h3 = $('h3', b), spans = $$('.flex.items-center.gap-2.flex-wrap span', b);
    var hoursEl = spans.filter(function (s) { return /\d:\d\d\s*(AM|PM)/i.test(s.textContent); })[0];
    var primary = h3 ? h3.textContent.trim() : slug;
    var g = GEO[slug] || [CENTER.lat, CENTER.lng];
    STORES[slug] = { slug: slug, primary: primary, name: 'Wellgreens ' + primary, hours: hoursEl ? hoursEl.textContent.trim() : '', lat: g[0], lng: g[1], button: b, card: b.parentElement };
  });
  Object.keys(GEO).forEach(function (s) { if (!STORES[s]) STORES[s] = { slug: s, primary: s, name: s, hours: '', lat: GEO[s][0], lng: GEO[s][1] }; });
  var shortName = function (st) { var t = st.primary, i = t.lastIndexOf(' - '); return (i >= 0 ? t.slice(i + 3) : t).replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };
  var hubFor = function (slug) { // the delivery hub serving a store: itself if it is one, else the nearest hub
    if (HUBS[slug]) return slug;
    var s = STORES[slug]; if (!s) return 'la-mesa-university-ave';
    var best = null, bd = Infinity;
    Object.keys(HUBS).forEach(function (k) { var o = STORES[k]; var m = miles(s.lat, s.lng, o.lat, o.lng); if (m < bd) { bd = m; best = k; } });
    return best || 'la-mesa-university-ave';
  };
  // hours are "6:00AM - 9:55PM", read in America/Los_Angeles; closing-soon = the last 30 minutes
  var LA = (function () { try { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', hour12: false }); } catch (e) { return null; } })();
  var nowMin = function (dt) {
    dt = dt || new Date();
    if (!LA) return dt.getHours() * 60 + dt.getMinutes();
    var p = LA.formatToParts(dt), hh = 0, mm = 0;
    p.forEach(function (x) { if (x.type === 'hour') hh = parseInt(x.value, 10); if (x.type === 'minute') mm = parseInt(x.value, 10); });
    if (hh === 24) hh = 0;
    return hh * 60 + mm;
  };
  var toMin = function (hh, mm, ap) { hh = +hh; ap = ap.toUpperCase(); if (ap === 'PM' && hh !== 12) hh += 12; else if (ap === 'AM' && hh === 12) hh = 0; return hh * 60 + +mm; };
  var parseHours = function (s) {
    var m = /(\d{1,2}):(\d{2})(AM|PM)\s*-\s*(\d{1,2}):(\d{2})(AM|PM)/i.exec(s || ''); if (!m) return null;
    var o = toMin(m[1], m[2], m[3]), c = toMin(m[4], m[5], m[6]); if (c <= o) c += 1440;
    return { open: o, close: c };
  };
  var statusOf = function (hours, dt) {
    var r = parseHours(hours); if (!r) return 'closed';
    var n = nowMin(dt);
    var open = r.close > 1440 ? (n >= r.open || n <= r.close - 1440) : (n >= r.open && n <= r.close);
    if (!open) return 'closed';
    var left = r.close > 1440 ? (n >= r.open ? r.close - n : r.close - 1440 - n) : r.close - n;
    return left <= 30 ? 'closing-soon' : 'open';
  };
  var clock = function (m) { var t = (m % 1440 + 1440) % 1440, hh = Math.floor(t / 60); return ((hh + 11) % 12 + 1) + ':' + String(t % 60).padStart(2, '0') + ' ' + (hh >= 12 ? 'PM' : 'AM'); };
  var hoursLine = function (hours, dt) {
    if (!hours || !hours.trim()) return T.hoursUnavailable;
    var r = parseHours(hours); if (!r) return T.hoursUnavailable;
    return statusOf(hours, dt) === 'closed' ? T.opensAt + ' ' + clock(r.open) : T.openUntil + ' ' + clock(r.close);
  };
  var urlStore = function () { var m = /^\/(locations|stores)\/([^/]+)/.exec(PATH); return m && GEO[m[2]] ? m[2] : null; };
  var selected = null; // slug

  // ---------------------------------------------------------------------------------------------
  // header: header-scrolled past 20px of (smoothed) scroll; --header-pinned-h / --header-rest-h
  var header = $('header.site-header');
  if (header) {
    // the smoothed value lags behind a programmatic jump; the live result at rest is the same as
    // the raw position, so the raw scrollY decides at the top and once scrolling ends
    var scrolled = function (y) { header.classList.toggle('header-scrolled', y > 20 && w.scrollY > 20); };
    onScroll(function (s) { scrolled(s.scrollY); });
    var settle = function () { scrolled(w.scrollY); };
    w.addEventListener('scrollend', settle, { passive: true });
    var st0 = 0; w.addEventListener('scroll', function () { clearTimeout(st0); st0 = setTimeout(settle, 150); if (w.scrollY <= 20) settle(); }, { passive: true });
    var running = 0;
    var setHeights = function () {
      var px = header.offsetHeight + 'px', ae = d.activeElement;
      html.style.setProperty('--header-pinned-h', px);
      var skip = (!header.classList.contains('header-search-open') && (header.classList.contains('header-scrolled') || (ae && ae.closest && ae.closest('.header-search-row')))) || running !== 0;
      if (!skip) html.style.setProperty('--header-rest-h', px);
    };
    var tracked = function (e) { return e.target && e.target.matches && e.target.matches('.header-banner, .header-category-rail'); };
    setHeights();
    if (w.ResizeObserver) new ResizeObserver(setHeights).observe(header);
    header.addEventListener('transitionrun', function (e) { if (tracked(e)) running++; });
    var ended = function (e) { if (tracked(e)) { running = Math.max(0, running - 1); if (!running) setHeights(); } };
    header.addEventListener('transitionend', ended);
    header.addEventListener('transitioncancel', ended);
  }

  // scroll progress bar: not rendered on phones or with reduced motion (live returns null there)
  var bar = $('.sticky.top-0.h-\\[2px\\] > .origin-left.bg-primary');
  if (bar) {
    var barWrap = bar.parentElement, last = -1;
    var barVis = function () { barWrap.hidden = RM.matches || MOB.matches; };
    barVis(); onMq(RM, barVis); onMq(MOB, barVis);
    onScroll(function (s) {
      if (!bar.isConnected) return;
      var r = Math.round(2000 * (s.scrollMax > 0 ? s.scrollY / s.scrollMax : 0)) / 2000;
      if (r !== last) { last = r; bar.style.transform = 'scaleX(' + r + ')'; }
    });
  }

  // ---------------------------------------------------------------------------------------------
  // scroll reveals. Server markup: FadeInUp = .reveal-pending + style delay AND duration;
  // BlurIn / RevealHorizontal = .reveal-pending + style delay only; StaggerItem = .reveal-pending,
  // no style. In view (IntersectionObserver 0.05; stagger containers 0) the class becomes the
  // animation class; animationend clears class and style. Phones (<768px) and reduced motion get
  // the end state at once, as on the live site.
  var still = function () { return RM.matches || MOB.matches; };
  var STAGGER = [ // container class signature -> staggerDelay (StaggerContainer props in the live code)
    ['grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', 0.04], ['grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', 0.08],
    ['flex flex-col gap-6', 0.06], ['space-y-10', 0.15], ['gap-px overflow-hidden rounded-2xl bg-secondary auto-rows-max', 0.02],
    ['-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4', 0.12]
  ];
  var hasAll = function (el, sig) { var c = el.classList; return sig.split(' ').every(function (k) { return c.contains(k); }); };
  var revealKind = function (el) {
    var st = el.getAttribute('style') || '';
    if (!/animation-delay/.test(st)) return 'stagger';
    if (/animation-duration/.test(st)) return 'fade';
    var f = el.firstElementChild;
    if (f && ((f.tagName === 'H2' && f.classList.contains('sr-only')) || hasAll(f, 'border-l-2 border-primary/50 pl-6') || (f.tagName === 'H2' && f.className === 'text-3xl font-black text-ink-900 uppercase tracking-tight'))) return 'left';
    return 'blur';
  };
  var finish = function (el) { el.classList.remove('reveal-pending', 'animate-fade-in-up', 'animate-blur-in', 'animate-reveal-left', 'animate-reveal-right'); el.removeAttribute('style'); };
  var io = function (fn, th) { return w.IntersectionObserver ? new IntersectionObserver(fn, { threshold: th }) : null; };
  var pending = [];
  var revealAll = function () { pending.forEach(function (x) { if (x.kind === 'stagger') { x.el.classList.remove('reveal-pending'); } else finish(x.el); }); pending = []; };
  (function reveals() {
    var els = $$('.reveal-pending');
    if (!els.length) return;
    if (still() || !w.IntersectionObserver) { els.forEach(function (el) { if (revealKind(el) === 'stagger') el.classList.remove('reveal-pending'); else finish(el); }); return; }
    var groups = new Map();
    els.forEach(function (el) {
      var kind = revealKind(el);
      pending.push({ el: el, kind: kind });
      if (kind === 'stagger') {
        var c = el.parentElement, delay = 0.1, p = el.parentElement;
        for (var i = 0; p && i < 4; i++, p = p.parentElement) {
          var hit = STAGGER.filter(function (s) { return hasAll(p, s[0]); })[0];
          if (hit) { c = p; delay = hit[1]; break; }
        }
        var g = groups.get(c); if (!g) groups.set(c, g = { delay: delay, items: [] });
        g.items.push(el);
        return;
      }
      var ob = io(function (en) {
        if (!en[0].isIntersecting) return;
        ob.disconnect();
        if (!el.classList.contains('reveal-pending')) return;
        el.classList.remove('reveal-pending');
        el.classList.add(kind === 'fade' ? 'animate-fade-in-up' : kind === 'left' ? 'animate-reveal-left' : SAFARI ? 'animate-fade-in-up' : 'animate-blur-in');
        el.addEventListener('animationend', function () { finish(el); }, { once: true });
      }, 0.05);
      ob.observe(el);
    });
    groups.forEach(function (g, c) {
      var ob = io(function (en) {
        if (!en[0].isIntersecting) return;
        ob.disconnect();
        g.items.forEach(function (el, i) {
          if (!el.classList.contains('reveal-pending')) return;
          el.classList.remove('reveal-pending');
          el.style.animation = 'fade-in-up 0.5s cubic-bezier(0.25, 0.4, 0.25, 1) ' + (Math.min(i, 8) * g.delay) + 's both';
        });
      }, 0);
      ob.observe(c);
    });
    var drop = function () { if (still()) revealAll(); };
    onMq(RM, drop); onMq(MOB, drop);
  })();

  // TextReveal: the word/letter spans are server-rendered; the root gets .text-revealed in view
  (function textReveal() {
    var roots = [];
    $$('.text-reveal-char').forEach(function (c) { var r = c.parentElement && c.parentElement.parentElement; if (r && roots.indexOf(r) < 0) roots.push(r); });
    roots.forEach(function (r) {
      if (RM.matches || !w.IntersectionObserver) { r.classList.add('text-revealed'); return; }
      var ob = io(function (en) { if (en[0].isIntersecting) { ob.disconnect(); r.classList.add('text-revealed'); } }, 0.05);
      ob.observe(r);
    });
  })();

  // ---------------------------------------------------------------------------------------------
  // gates: age gate + store picker, both CSS-checkbox driven (#age-verify-cb, #store-select-cb).
  // Port of the live gate controller: restore from storage at once, lock the page while a gate
  // is up, focus trap, Enter/Space on the age gate's label buttons, data-persist-age.
  var ageCb = d.getElementById('age-verify-cb'), storeCb = d.getElementById('store-select-cb'), declinedCb = d.getElementById('declined-cb');
  var siteContent = d.getElementById('site-content');
  var focusables = function (root) {
    return $$('button:not([disabled]), [href], input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])', root)
      .filter(function (e) { return e.getClientRects().length > 0 && !e.closest('[inert]'); });
  };
  var focusFirst = function (sel) { var a = $(sel); var f = a && focusables(a)[0]; if (f) f.focus(); };
  var setStoreState; // defined with the header store state below
  var syncGates = noop;
  if (/^\/brand-partners(\/|$)/.test(PATH)) html.classList.add('gate-bypass');
  if (html.classList.contains('gate-bypass') && d.body) d.body.classList.add('gate-bypass');
  if (ageCb && storeCb) (function gates() {
    var savedY = w.scrollY, firstHash = true;
    var unlock = function () {
      if (d.body.style.position !== 'fixed') return;
      html.style.overflow = ''; d.body.style.overflow = ''; d.body.style.position = ''; d.body.style.top = ''; d.body.style.width = '';
      w.scrollTo(0, savedY);
    };
    var bypass = d.body.classList.contains('gate-bypass');
    // restore the visitor's state first (the site CSS locks the page while a box is unchecked)
    var slug = store.get(STORE_KEY);
    if (!(slug && STORES[slug])) slug = urlStore();
    // premium layer (owner, 2026-11-25): a new visitor who lands anywhere but a store's own page starts on City Heights, so
    // the store picker does not interrupt (the 21+ check stays); ?fx=off keeps the live flow: choose a store first
    if (!slug && html.getAttribute('data-fx') !== 'off' && STORES['city-heights-home-ave']) slug = 'city-heights-home-ave';
    if (slug) { storeCb.checked = true; selected = slug; if (store.get(STORE_KEY) !== slug) store.set(STORE_KEY, slug); }
    if (store.get(AGE_KEY) === 'true') ageCb.checked = true;
    else if (ageCb.checked) store.set(AGE_KEY, 'true');   // ticked before this script ran (it now runs after the first frame)
    if (bypass) {
      if (siteContent) { siteContent.removeAttribute('inert'); siteContent.removeAttribute('aria-hidden'); siteContent.classList.remove('site-content--gated'); }
      return;
    }
    w.addEventListener('scroll', function () { if (d.body.style.position !== 'fixed') savedY = w.scrollY; }, { passive: true });
    var sync = syncGates = function () {
      if (!siteContent) return;
      if (ageCb.checked && storeCb.checked) {
        html.classList.add('gates-hydrated');
        siteContent.removeAttribute('inert'); siteContent.removeAttribute('aria-hidden'); siteContent.classList.remove('site-content--gated');
        unlock();
        if (firstHash) { firstHash = false; if (location.hash) settleHash(location.hash); }
      } else {
        html.classList.remove('gates-hydrated');
        siteContent.setAttribute('inert', ''); siteContent.setAttribute('aria-hidden', 'true'); siteContent.classList.add('site-content--gated');
        if (d.body.style.position !== 'fixed') {
          html.style.overflow = 'hidden'; d.body.style.overflow = 'hidden'; d.body.style.position = 'fixed'; d.body.style.top = '-' + savedY + 'px'; d.body.style.width = '100%';
        }
        raf(function () {
          if (ageCb.checked) { if (!storeCb.checked) focusFirst('.location-selector-overlay'); }
          else { var o = $('.age-gate-overlay'); if (o) o.focus(); }
        });
      }
    };
    sync();
    ageCb.addEventListener('change', sync); storeCb.addEventListener('change', sync);
    var persistAge = function () { store.set(AGE_KEY, 'true'); };
    $$('[data-persist-age]').forEach(function (e) { e.addEventListener('click', persistAge); });
    var refocusAge = function () { raf(function () { focusFirst('.age-gate-overlay'); }); };
    $$('[data-uncheck-declined]').forEach(function (e) { e.addEventListener('click', function () { if (declinedCb) declinedCb.checked = false; refocusAge(); }); });
    if (declinedCb) declinedCb.addEventListener('change', refocusAge);
    // keyboard: Enter / Space activate the age gate's label > [role=button]; Tab is trapped in the open gate
    var spaceDown = null;
    var keyAct = function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target;
      if (e.repeat && t.closest && t.closest('.age-gate-overlay')) { e.preventDefault(); return; }
      var isBtn = t.matches && t.matches('.age-gate-overlay label > [role="button"]');
      if (e.key === ' ' && e.type === 'keydown') spaceDown = isBtn ? t : null;
      if (!isBtn) return;
      e.preventDefault();
      if (e.key === ' ') { if (e.type === 'keydown' || spaceDown !== t) return; spaceDown = null; }
      else if (e.type !== 'keydown') return;
      var lab = t.closest('label');
      if (lab && lab.hasAttribute('data-persist-age')) persistAge();
      if (lab && lab.control) lab.control.click();
    };
    d.addEventListener('keyup', keyAct);
    d.addEventListener('keydown', function (e) {
      var sel = ageCb.checked ? (storeCb.checked ? null : '.location-selector-overlay') : '.age-gate-overlay';
      if (!sel) return;
      var a = $(sel); if (!a) return;
      if (e.key === 'Enter' || e.key === ' ') { keyAct(e); return; }
      if (e.key !== 'Tab') return;
      var wdg = $('[data-accessibility-widget]'), ae = d.activeElement;
      if (wdg && wdg.querySelector('dialog[open]')) return;
      var list = focusables(a).concat(wdg ? focusables(wdg) : []);
      if (!list.length) return;
      var i = list.indexOf(ae);
      if (i === -1 && ae && ae !== a && a.contains(ae)) return;
      e.preventDefault();
      var n = list.length;
      list[i === -1 ? (e.shiftKey ? n - 1 : 0) : (i + (e.shiftKey ? n - 1 : 1)) % n].focus();
    });
  })();

  // scroll a #hash target into place once the gates are passed (keeps it pinned while late
  // layout shifts settle, up to 3s or until the visitor scrolls)
  function settleHash(hash) {
    var t = null; try { t = d.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return; }
    if (!t) return;
    t.scrollIntoView({ block: 'start' });
    var top = t.getBoundingClientRect().top, until = performance.now() + 3000, calm = 0;
    var stop = function () { calm = Infinity; }, o = { once: true, passive: true };
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) { w.addEventListener(ev, stop, o); });
    (function loop() {
      if (calm > 30 || performance.now() > until) return;
      if (Math.abs(t.getBoundingClientRect().top - top) > 1) { t.scrollIntoView({ block: 'start' }); calm = 0; } else calm++;
      raf(loop);
    })();
  }

  // ---------------------------------------------------------------------------------------------
  // the selected store in the header (chip, service row, delivery hub, Shop button, Specials link)
  var STATUS_TXT = { open: 'text-primary', 'closing-soon': 'text-gold-500/80', closed: 'text-ink-500' };
  var chipDot = function (s) {
    if (s === 'open') return '<span class="relative flex h-2 w-2"><span class="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75"></span><span class="relative h-2 w-2 rounded-full bg-primary"></span></span>';
    if (s === 'closing-soon') return '<span class="relative flex h-2 w-2"><span class="animate-pulse absolute h-full w-full rounded-full bg-gold-500 opacity-75"></span><span class="relative h-2 w-2 rounded-full bg-gold-500"></span></span>';
    return '<span class="relative flex h-2 w-2"><span class="relative h-2 w-2 rounded-full bg-ink-300"></span></span>';
  };
  var rowDot = function (s) {
    if (s === 'open') return '<span class="relative flex h-1.5 w-1.5 shrink-0"><span class="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75"></span><span class="relative h-1.5 w-1.5 rounded-full bg-primary"></span></span>';
    if (s === 'closing-soon') return '<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"></span>';
    if (s === 'closed') return '<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300"></span>';
    return '';
  };
  var hubLink = function (href, label) { return '<a href="' + esc(href) + '" class="block max-w-full truncate text-[13px] font-bold leading-tight text-primary hover:underline">' + esc(label) + '</a>'; };
  var applyHeader = function () {
    var st = selected && STORES[selected], status = st && st.hours ? statusOf(st.hours) : null;
    var hub = st ? hubFor(st.slug) : null, delivers = !!(st && hub === st.slug), hubLabel = hub && !delivers ? HUBS[hub] : null;
    var hubHref = hub ? liveUrl('/stores/' + hub) : localePath('/delivery');
    var nav = $('nav.header-nav');
    // desktop chip
    var chip = nav && $('.hidden.shrink-0.xl\\:flex > button[data-store-trigger]', nav);
    if (chip) {
      var lead = chip.firstElementChild, col = chip.querySelector('.flex.flex-col');
      if (lead && col && lead !== col) lead.replaceWith(h(status ? chipDot(status) : icon('map-pin', 'w-3.5 h-3.5 text-primary')));
      var lab = col && col.children[0], nm = col && col.children[1];
      if (lab) { lab.className = 'text-[10px] font-medium uppercase tracking-wider leading-none ' + (status ? STATUS_TXT[status] : 'text-ink-500'); lab.textContent = status ? (status === 'open' ? T.openNow : status === 'closing-soon' ? T.closingSoon : T.closed) : T.shoppingAt; }
      if (nm) nm.textContent = st ? shortName(st) : T.selectStore;
      // delivery hub link / "now delivering" next to the chip. Store pages already carry the
      // server-rendered one for their own store: update that element instead of adding a second
      var wrap = chip.parentElement, nx = wrap.nextElementSibling;
      var isHubEl = function (e) { return e && e.tagName === 'SPAN' && e.classList.contains('shrink-0') && e.classList.contains('hidden') && (e.classList.contains('xl:inline-flex') || e.classList.contains('xl:inline')); };
      var add = hubLabel ? '<span class="hidden shrink-0 xl:inline-flex">' + hubLink(hubHref, tpl(T.deliveryHub, { hub: hubLabel })) + '</span>'
        : delivers ? '<span class="hidden shrink-0 text-[13px] font-bold leading-tight text-primary xl:inline">' + esc(T.deliveryHubLabel) + '</span>' : '';
      if (isHubEl(nx)) { if (add) { if (nx.outerHTML !== h(add).outerHTML) nx.replaceWith(h(add)); } else nx.remove(); }
      else if (add) wrap.after(h(add));
    }
    // desktop Specials link follows the store
    var dnav = nav && $('.hidden.xl\\:flex.shrink-0.items-center.gap-1', nav);
    if (dnav) $$(':scope > a', dnav).forEach(function (a) {
      var cur = a.getAttribute('data-wg-specials') || (/^(\/es)?\/locations$/.test(unbase(a.getAttribute('href') || '')) || /\/stores\/[^/]+\/specials$/.test(a.getAttribute('href') || '') ? '1' : '');
      if (!cur) return;
      a.setAttribute('data-wg-specials', '1');
      a.setAttribute('href', st ? liveUrl('/stores/' + st.slug + '/specials') : localePath('/locations'));
    });
    // banner + delivery icon follow the hub
    var banner = $('.header-banner > a'); if (banner) banner.setAttribute('href', hubHref);
    var truck = nav && $('a.relative.xl\\:hidden[aria-label]', nav);
    if (truck) truck.setAttribute('href', hubHref);
    // Shop button (client-only on the live site)
    var right = truck ? truck.parentElement : null;
    if (right) {
      var shop = $('a[data-cta="header_shop"]', right);
      if (!shop) {
        shop = h('<a data-cta="header_shop" class="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative flex h-9 w-9 items-center justify-center rounded-md bg-primary p-0 before:absolute before:-inset-1 before:content-[\'\'] text-[13px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-sm transition duration-150 hover:bg-forest-700 sm:h-10 sm:w-auto sm:px-4 md:px-5">' + icon('shopping-bag', 'h-4 w-4 sm:mr-1.5 sm:h-3.5 sm:w-3.5') + '<span class="hidden sm:inline">' + esc(T.shop) + '</span></a>');
        truck.after(shop);
      }
      shop.setAttribute('href', st ? liveUrl('/stores/' + st.slug) : localePath('/locations'));
      shop.setAttribute('aria-label', st ? tpl(T.shopAtStore, { store: st.primary }) : T.shopSelectStore);
    }
    // service row (below xl)
    var row = $('.header-service-row');
    var inner = row && row.firstElementChild;
    if (inner) {
      var btn = $('button[data-store-trigger]', inner);
      if (btn) {
        var nmTxt = st ? shortName(st) : T.selectStore;
        btn.setAttribute('aria-label', delivers ? tpl(T.changePickupStore, { store: nmTxt }) + ', ' + T.deliveryHubLabel : tpl(T.changePickupStore, { store: nmTxt }));
        var pin = $(':scope > svg.lucide-map-pin', btn);
        if (st && pin) pin.remove();
        if (!st && !pin) btn.prepend(h(icon('map-pin', 'h-3.5 w-3.5 shrink-0 text-primary')));
        var nameSpan = $(':scope > span.min-w-0.truncate', btn); if (nameSpan) nameSpan.textContent = nmTxt;
        // "\u00b7 Now delivering" (server-rendered on hub store pages)
        $$(':scope > span.shrink-0.text-primary', btn).forEach(function (e) { e.remove(); });
        if (delivers) { var chev = $(':scope > svg:last-child', btn); var sp = h('<span class="shrink-0 text-[11px] font-bold text-primary">\u00b7 ' + esc(T.deliveryHubLabel) + '</span>'); if (chev) chev.before(sp); else btn.append(sp); }
      }
      // delivery hint + hours line (the hint is server-rendered on store pages; the hours line is client-only)
      $$(':scope > span', inner).forEach(function (e) { if (e.classList.contains('sm:block') || e.classList.contains('ml-auto')) e.remove(); });
      if (hubLabel) inner.append(h('<span class="hidden min-w-0 sm:block">' + hubLink(hubHref, tpl(T.deliveryHub, { hub: hubLabel })) + '</span>'));
      var line = hoursLine(st && st.hours);
      inner.append(h('<span class="ml-auto inline-flex shrink-0 items-center justify-end gap-2 text-right text-[13px] font-bold leading-tight ' + (status === 'open' ? 'text-primary' : status === 'closing-soon' ? 'text-gold-500' : 'text-ink-500') + '">' + rowDot(status) + '<span class="truncate">' + esc(line) + '</span></span>'));
    }
  };

  // ---------------------------------------------------------------------------------------------
  // store picker dialog
  var CARD = {
    sel: 'group relative rounded-xl border transition duration-300 overflow-hidden bg-secondary border-primary/50 shadow-brand',
    closed: 'group relative rounded-xl border transition duration-300 overflow-hidden bg-card border-border hover:border-border opacity-60',
    base: 'group relative rounded-xl border transition duration-300 overflow-hidden bg-card border-border hover:border-border hover:bg-card'
  };
  var BADGE = { open: 'bg-secondary text-primary border-primary/20', 'closing-soon': 'bg-gold-200/40 text-gold-600 border-gold-500/30', closed: 'bg-secondary text-ink-500 border-border' };
  var userLoc = null;
  var picker = $('.location-selector-overlay');
  var renderCards = function () {
    Object.keys(STORES).forEach(function (k) {
      var s = STORES[k]; if (!s.card) return;
      var status = s.hours ? statusOf(s.hours) : null, isSel = selected === k;
      s.card.className = isSel ? CARD.sel : status === 'closed' ? CARD.closed : CARD.base;
      var h3 = $('h3', s.button);
      if (h3) {
        h3.className = 'font-bold text-base truncate ' + (isSel ? 'text-primary' : 'text-ink-900');
        var ck = h3.nextElementSibling;
        if (isSel && !ck) h3.after(h(icon('circle-check', 'w-4 h-4 text-primary flex-shrink-0')));
        if (!isSel && ck && ck.tagName.toLowerCase() === 'svg') ck.remove();
      }
      var hrow = $('.flex.items-center.gap-2.flex-wrap', s.button);
      if (hrow) {
        var b = $('[data-wg-badge]', hrow); if (b) b.remove();
        if (status && s.hours) hrow.prepend(h('<span data-wg-badge class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ' + BADGE[status] + '">' + icon('clock', 'w-3 h-3') + (status === 'open' ? T.lsOpenNow : status === 'closing-soon' ? T.lsClosingSoon : T.lsClosed) + '</span>'));
      }
      var row = $('.flex.items-start.justify-between', s.button), dist = row && $(':scope > [data-wg-dist]', row);
      if (dist) dist.remove();
      if (userLoc && row) row.append(h('<div data-wg-dist class="flex-shrink-0 text-right"><div class="text-xs font-bold text-primary">' + fmtMiles(miles(userLoc.lat, userLoc.lng, s.lat, s.lng)) + '</div></div>'));
    });
  };
  var openPicker = function () {
    if (!storeCb) return;
    html.classList.remove('gates-hydrated');
    storeCb.checked = false;
    storeCb.dispatchEvent(new Event('change', { bubbles: true }));
  };
  var closePicker = function () { if (!storeCb) return; storeCb.checked = true; storeCb.dispatchEvent(new Event('change', { bubbles: true })); };
  setStoreState = function (slug, persist) {
    selected = slug;
    if (persist) { if (slug) store.set(STORE_KEY, slug); else store.del(STORE_KEY); }
    renderCards(); applyHeader(); ensureCloseBtn();
    d.dispatchEvent(new CustomEvent('wg:store', { detail: { slug: slug } }));
  };
  var ensureCloseBtn = function () { // the picker's X button exists once a store is selected
    if (!picker || !selected) return;
    var title = d.getElementById('location-selector-title'), row = title && title.closest('.flex.items-center.justify-between');
    if (!row || $('[data-wg-close]', row)) return;
    var b = h('<button type="button" data-wg-close aria-label="' + esc(T.closeSelector) + '" class="flex h-11 w-11 shrink-0 items-center justify-center p-2 text-ink-500 hover:text-ink-900 transition-colors rounded-md hover:bg-secondary">' + icon('x', 'w-5 h-5') + '</button>');
    b.addEventListener('click', closePicker);
    row.append(b);
  };
  if (picker) (function pickerInit() {
    var list = $('.space-y-3', picker), status = d.getElementById('store-select-status');
    // select a store
    $$('[data-store-select][data-store-slug]', picker).forEach(function (b) {
      b.addEventListener('click', function () {
        var slug = b.getAttribute('data-store-slug'), s = STORES[slug];
        setStoreState(slug, true);
        closePicker();
        if (status) status.textContent = '';
        raf(function () {
          if (status && s) status.textContent = T.nowShoppingAt + ' ' + s.name;
          var t = $$('[data-store-trigger]').filter(function (e) { return e.offsetParent !== null; })[0];
          if (t) t.focus();
        });
      });
    });
    // sort by distance (default centre, or the visitor's position once known)
    var sortCards = function (filterIds) {
      if (!list) return;
      var o = userLoc || CENTER;
      var ids = Object.keys(STORES).filter(function (k) { return STORES[k].card; });
      var shown = filterIds && filterIds.length ? filterIds : ids;
      ids.sort(function (a, b) { return miles(o.lat, o.lng, STORES[a].lat, STORES[a].lng) - miles(o.lat, o.lng, STORES[b].lat, STORES[b].lng); });
      ids.forEach(function (k) { var c = STORES[k].card; c.hidden = shown.indexOf(k) < 0; list.appendChild(c); });
    };
    // search filter
    var input = $('input[type="text"]', picker), typed = false, none = null;
    if (input) {
      var box = input.parentElement, clear = null;
      var apply = function () {
        var q = typed ? input.value : '';
        var ids = Object.keys(STORES).filter(function (k) { return STORES[k].card; });
        var hit = q.trim() ? ids.filter(function (k) {
          var s = STORES[k], l = q.toLowerCase(), addr = $('p.text-xs', s.button);
          return s.primary.toLowerCase().indexOf(l) >= 0 || s.name.toLowerCase().indexOf(l) >= 0 || (addr && addr.textContent.toLowerCase().indexOf(l) >= 0);
        }) : ids;
        if (none) { none.remove(); none = null; }
        if (!hit.length && q.trim()) {
          none = h('<p class="pb-3 text-sm text-ink-500"></p>');
          none.textContent = T.noStoresFound + ' "' + input.value + '"';
          if (list) list.before(none);
        }
        sortCards(hit.length ? hit : null);
        if (input.value && !clear) {
          clear = h('<button type="button" aria-label="' + esc(T.clearSearch) + '" class="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-ink-500 hover:text-ink-900 transition-colors">' + icon('x', 'w-4 h-4') + '</button>');
          clear.addEventListener('click', function () { typed = false; input.value = ''; apply(); input.focus(); });
          box.append(clear);
        } else if (!input.value && clear) { clear.remove(); clear = null; }
      };
      input.addEventListener('input', function () { typed = true; apply(); });
    }
    // Use Location / List / Map
    var bar2 = $$('button', picker).filter(function (b) { return /lucide-navigation/.test(b.innerHTML); })[0];
    var fs = $('fieldset', picker);
    var errBox = $$('div.overflow-hidden', picker).filter(function (e) { return /max-height/.test(e.getAttribute('style') || ''); })[0];
    var showErr = function (msg) {
      if (!errBox) return;
      var span = $$('span', errBox).pop();
      if (span) span.textContent = msg || '';
      errBox.style.maxHeight = msg ? '100px' : '0px'; errBox.style.opacity = msg ? '1' : '0';
    };
    if (bar2) bar2.addEventListener('click', function () {
      if (bar2.disabled) return;
      var label = bar2.innerHTML;
      bar2.disabled = true;
      bar2.innerHTML = '<span class="flex items-center gap-2"><span class="w-4 h-4 border-2 border-line-strong border-t-white rounded-full animate-spin"></span>' + esc(T.detecting) + '</span>';
      showErr(null);
      var done = function (pos) {
        bar2.disabled = false;
        if (!pos) { bar2.innerHTML = label; showErr(T.locationError); return; }
        userLoc = pos;
        bar2.remove();
        if (fs) fs.classList.add('flex-1');
        sortCards(); renderCards();
      };
      if (!('geolocation' in navigator)) { done(null); return; }
      var settled = false;
      navigator.geolocation.getCurrentPosition(function (p) { if (settled) return; settled = true; done({ lat: p.coords.latitude, lng: p.coords.longitude }); },
        function () { if (settled) return; settled = true; done(null); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    });
    if (fs) {
      var vb = $$('button', fs), listView = list ? list.parentElement : null, mapBox = null;
      var ON = 'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition flex-1 min-h-[44px] bg-primary text-primary-foreground';
      var OFF = 'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition flex-1 min-h-[44px] text-ink-500 hover:text-ink-900';
      var setView = function (v) {
        vb.forEach(function (b, i) { var on = (i === 0) === (v === 'list'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.className = on ? ON : OFF; });
        if (!list) return;
        $$(':scope > *', listView).forEach(function (c) { if (c !== mapBox && c.hasAttribute && !c.hasAttribute('data-wg-mapbox')) c.hidden = v === 'map' ? true : (c.hidden && c.hasAttribute('data-wg-hide') ? true : false); });
        if (v === 'map') {
          if (!mapBox) {
            mapBox = h('<div data-wg-mapbox class="h-full min-h-[400px]"><p class="sr-only"></p></div>');
            var img = w.WG_FRAGMENTS && w.WG_FRAGMENTS.pickerMap;
            if (img) mapBox.append(h('<img src="' + esc(img) + '" alt="" class="h-full w-full rounded-xl object-cover">'));
            else mapBox.append(h('<div class="h-full min-h-[400px] flex items-center justify-center bg-card rounded-xl border border-border"><p class="text-ink-500 text-sm">' + esc(T.mapLoadError) + '</p></div>'));
            listView.append(mapBox);
          }
          mapBox.hidden = false;
        } else if (mapBox) mapBox.hidden = true;
      };
      vb.forEach(function (b, i) { b.addEventListener('click', function () { setView(i === 0 ? 'list' : 'map'); }); });
    }
    // reopen from any store trigger
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-store-trigger]');
      if (t && !picker.contains(t)) { e.preventDefault(); openPicker(); }
    });
    sortCards();
  })();
  setStoreState(selected, false);

  // ---------------------------------------------------------------------------------------------
  // Radix accordions (type single, collapsible everywhere on the site)
  (function accordions() {
    var trig = $$('button[data-radix-collection-item][aria-expanded]');
    if (!trig.length) return;
    var parts = function (b) {
      var id = b.id, reg = id ? d.querySelector('[role="region"][aria-labelledby="' + id + '"]') : null;
      var h3 = b.parentElement, item = h3 && h3.parentElement;
      return { b: b, h3: h3, item: item, reg: reg, root: item && item.parentElement };
    };
    var set = function (p, open) {
      var v = open ? 'open' : 'closed';
      [p.b, p.h3, p.item, p.reg].forEach(function (e) { if (e && e.hasAttribute('data-state')) e.setAttribute('data-state', v); });
      p.b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (p.reg && open) {
        var r = p.reg, an = r.style.animationName, td = r.style.transitionDuration;
        r.style.transitionDuration = '0s'; r.style.animationName = 'none';
        var rect = r.getBoundingClientRect();
        r.style.setProperty('--radix-collapsible-content-height', rect.height + 'px');
        r.style.setProperty('--radix-collapsible-content-width', rect.width + 'px');
        r.style.animationName = an; r.style.transitionDuration = td;
      }
    };
    trig.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = parts(b), open = b.getAttribute('aria-expanded') !== 'true';
        if (open && p.root) $$('button[data-radix-collection-item][aria-expanded="true"]', p.root).forEach(function (o) { if (o !== b) set(parts(o), false); });
        set(p, open);
      });
      b.addEventListener('keydown', function (e) {
        var k = e.key; if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(k) < 0) return;
        var p = parts(b), all = p.root ? $$('button[data-radix-collection-item]:not([disabled])', p.root) : [b], i = all.indexOf(b), n = all.length;
        e.preventDefault();
        var j = k === 'Home' ? 0 : k === 'End' ? n - 1 : k === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n;
        all[j].focus();
      });
    });
  })();

  // ---------------------------------------------------------------------------------------------
  // carousels
  var slideLabel = function (i, n) { return tpl(T.slide, { current: i + 1, total: n }); };
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var DAYS_ES = ['Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado', 'Domingo'];
  var todayIdx = function () { // Monday-first index of today in Los Angeles
    try { var wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' }).format(new Date()); return DAYS.indexOf(wd); }
    catch (e) { return (new Date().getDay() + 6) % 7; }
  };
  var dayOf = function (s) {
    for (var i = 0; i < 7; i++) if (new RegExp('\\b' + DAYS[i] + '\\b').test(s) || s.indexOf(DAYS_ES[i]) >= 0) return i;
    return -1;
  };

  // daily-deals hero: scroll-snap track, prev/next (wrap), dots (aria-pressed), drag, slides from today
  $$('#daily-deals[aria-roledescription="carousel"]').forEach(function (reg) {
    var track = reg.firstElementChild; if (!track) return;
    var figs = $$(':scope > figure', track), dotsBox = $('[role="group"]', reg);
    var dots = dotsBox ? $$(':scope > button', dotsBox) : [];
    var n = figs.length; if (!n) return;
    var alt = function (f) { var l = f.getAttribute('aria-label') || '', i = l.indexOf(': '); return i >= 0 ? l.slice(i + 2) : l; };
    // live client: slides run from today's weekday (server order is the deals snapshot's day)
    var t0 = todayIdx();
    var days = figs.map(function (f) { return dayOf(alt(f)); });
    if (t0 >= 0 && days.every(function (x) { return x >= 0; })) {
      var order = figs.map(function (f, i) { return i; }).sort(function (a, b) { return ((days[a] - t0 + 7) % 7) - ((days[b] - t0 + 7) % 7); });
      if (order.some(function (v, i) { return v !== i; })) {
        var nf = order.map(function (i) { return figs[i]; }), nd = dots.length === n ? order.map(function (i) { return dots[i]; }) : dots;
        var firstLink = $('#hero-deal-banner', track); if (firstLink) firstLink.removeAttribute('id');
        var snap = track.style.scrollSnapType;
        track.style.scrollSnapType = 'none'; // or the browser re-snaps to the moved slide
        nf.forEach(function (f, i) {
          track.appendChild(f);
          f.setAttribute('aria-label', slideLabel(i, n) + ': ' + alt(f));
          var img = $('img', f); if (img) { if (i === 0) img.removeAttribute('loading'); else img.setAttribute('loading', 'lazy'); }
        });
        var a0 = $('a', nf[0]); if (a0) a0.id = 'hero-deal-banner';
        if (dotsBox && nd.length === n) nd.forEach(function (b, i) { dotsBox.appendChild(b); b.setAttribute('aria-label', slideLabel(i, n) + ': ' + alt(nf[i])); });
        figs = nf; dots = nd;
        track.scrollLeft = 0; void track.offsetWidth;
        track.style.scrollSnapType = snap;
      }
    }
    var cur = 0, ON = 'block rounded-full transition-[width,background-color] motion-reduce:transition-none h-1 w-3 bg-primary sm:h-1.5 sm:w-3.5', OFF = 'block rounded-full transition-[width,background-color] motion-reduce:transition-none h-1 w-1 bg-background/80 ring-1 ring-ink-900/25 sm:h-1.5 sm:w-1.5';
    var paint = function () {
      dots.forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); var s = b.firstElementChild; if (s) s.className = i === cur ? ON : OFF; });
      var f = figs[cur]; if (f) reg.style.height = f.offsetHeight + 'px';
    };
    var idx = function () { var cw = track.clientWidth; return cw <= 0 ? 0 : Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / cw))); };
    var go = function (i) { var cw = track.clientWidth; if (cw <= 0) return; cur = (i % n + n) % n; paint(); track.scrollTo({ left: cur * cw, behavior: 'smooth' }); };
    var btns = $$(':scope > div > button[aria-label]', reg).filter(function (b) { return !b.closest('[role="group"]'); });
    if (btns[0]) btns[0].addEventListener('click', function () { go(cur - 1); });
    if (btns[1]) btns[1].addEventListener('click', function () { go(cur + 1); });
    dots.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    track.addEventListener('scroll', function () { if (track.scrollTop) track.scrollTop = 0; var i = idx(); if (i !== cur) { cur = i; paint(); } }, { passive: true });
    if (w.ResizeObserver) new ResizeObserver(function () { var f = figs[cur]; if (f) reg.style.height = f.offsetHeight + 'px'; }).observe(track);
    // mouse drag (touch uses native scroll-snap)
    var drag = null, suppress = false;
    if (n > 1) {
      track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; drag = { id: e.pointerId, x: e.clientX, s: track.scrollLeft, moved: false }; try { track.setPointerCapture(e.pointerId); } catch (er) {} });
      track.addEventListener('pointermove', function (e) { if (!drag || drag.id !== e.pointerId) return; var dx = e.clientX - drag.x; if (Math.abs(dx) >= 8) { drag.moved = true; e.preventDefault(); } track.scrollLeft = drag.s - dx; track.scrollTop = 0; });
      var up = function (e) { if (!drag || drag.id !== e.pointerId) return; if (drag.moved) { suppress = true; go(idx()); } drag = null; try { track.releasePointerCapture(e.pointerId); } catch (er) {} };
      track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
      track.addEventListener('click', function (e) { if (suppress) { e.preventDefault(); suppress = false; } }, true);
      $$('a, img', track).forEach(function (a) { a.addEventListener('dragstart', function (e) { e.preventDefault(); }); });
    }
    paint();
  });

  // scroll rail of cards (location cards): the live client adds prev/next and page dots
  $$('[role="region"][aria-roledescription="carousel"]').forEach(function (rail) {
    if (rail.id === 'daily-deals' || !rail.classList.contains('snap-x')) return;
    var group = rail.parentElement; if (!group || !group.classList.contains('group')) return;
    var outer = group.parentElement, live = $(':scope > p[aria-live]', group);
    if (!live) { live = h('<p class="sr-only" aria-live="polite" aria-atomic="true"></p>'); rail.after(live); }
    var pages = 1, cur = 0, built = false, prevB, nextB, tabs;
    var metric = function () {
      var max = Math.max(0, rail.scrollWidth - rail.clientWidth), k = rail.children, p = 1;
      if (max > 1 && k.length >= 2) { var step = k[1].offsetLeft - k[0].offsetLeft || k[0].offsetWidth; p = step <= 0 ? Math.max(1, Math.ceil(rail.scrollWidth / rail.clientWidth)) : Math.max(1, Math.round(max / step) + 1); }
      return { max: max, pages: p };
    };
    var BTN = 'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pointer-events-auto h-11 w-11 rounded-full border border-border bg-background/90 text-ink-900 backdrop-blur-sm transition hover:bg-forest-700 hover:text-primary-foreground';
    var SIDE = 'pointer-events-none absolute inset-y-0 z-20 flex w-16 items-center opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100';
    var to = function (i) {
      var m = metric(); if (m.pages <= 1 || m.max <= 0) { rail.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      var p = Math.min(m.pages - 1, Math.max(0, i)), x = p / (m.pages - 1) * m.max, from = rail.scrollLeft;
      rail.scrollTo({ left: x, behavior: 'smooth' });
      // some engines drop a smooth scroll inside a snap container (seen in emulated mobile Chromium): land it
      setTimeout(function () { if (Math.abs(rail.scrollLeft - from) < 4 && Math.abs(x - from) > 4) rail.scrollTo({ left: x }); }, 700);
    };
    var build = function () {
      if (built) { prevB.remove(); nextB.remove(); tabs.remove(); built = false; }
      if (pages <= 1) return;
      prevB = h('<div class="' + SIDE + ' left-0"><button class="' + BTN.replace('pointer-events-auto', 'pointer-events-auto ml-2') + '" type="button" aria-label="' + esc(T.prev) + '">' + icon('chevron-left', 'h-5 w-5', true) + '</button></div>');
      nextB = h('<div class="' + SIDE + ' right-0 justify-end"><button class="' + BTN.replace('pointer-events-auto', 'pointer-events-auto mr-2') + '" type="button" aria-label="' + esc(T.next) + '">' + icon('chevron-right', 'h-5 w-5', true) + '</button></div>');
      prevB.firstChild.addEventListener('click', function () { to(((cur - 1) % pages + pages) % pages); });
      nextB.firstChild.addEventListener('click', function () { to(((cur + 1) % pages + pages) % pages); });
      group.append(prevB, nextB);
      tabs = h('<div class="mt-4 flex items-center justify-center gap-1.5" role="tablist"></div>');
      for (var i = 0; i < pages; i++) (function (i) {
        var b = h('<button type="button" role="tab"></button>');
        b.addEventListener('click', function () { to(i); });
        tabs.append(b);
      })(i);
      (outer || group).append(tabs);
      built = true;
    };
    var paint = function () {
      var lab = slideLabel(cur, pages);
      rail.setAttribute('aria-label', lab); live.textContent = lab;
      if (!built) return;
      tabs.setAttribute('aria-label', lab);
      $$(':scope > button', tabs).forEach(function (b, i) {
        b.setAttribute('aria-selected', i === cur ? 'true' : 'false'); b.setAttribute('aria-label', slideLabel(i, pages));
        b.className = 'h-1.5 min-w-0 rounded-full border-0 p-0 transition duration-300 ' + (i === cur ? 'w-8 bg-primary shadow-brand' : 'w-1.5 bg-secondary hover:bg-ink-300');
      });
    };
    var update = function () {
      var m = metric();
      if (m.pages !== pages) { pages = m.pages; build(); }
      cur = pages <= 1 || m.max <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, rail.scrollLeft / m.max)) * (pages - 1));
      paint();
    };
    rail.addEventListener('scroll', update, { passive: true });
    w.addEventListener('resize', update);
    if (w.ResizeObserver) new ResizeObserver(update).observe(rail);
    update();
  });

  // store photo carousel: cross-fading layers with enter/exit keyframes, dots as tabs
  $$('div[aria-roledescription="carousel"]:not([role])').forEach(function (car) {
    var live = $(':scope > p[aria-live]', car);
    var layers = $$(':scope > div.absolute.inset-0', car).filter(function (x) { return $('img', x); });
    var curL = layers.filter(function (x) { return x.classList.contains('z-[2]'); })[0];
    var tabsBox = $('[role="tablist"]', car), tabs = tabsBox ? $$(':scope > button', tabsBox) : [];
    var n = tabs.length || layers.length;
    if (!curL || n < 2) return;
    var alt = car.getAttribute('aria-label') || '';
    // slide sources: injected list (build hook) or the layers the server rendered (current, next, previous)
    var srcs = [];
    var data = car.getAttribute('data-wg-images');
    if (data) { try { srcs = JSON.parse(data); } catch (e) { srcs = []; } }
    var proto = $('img', curL);
    var asSrc = function (img) { return { src: img.getAttribute('src'), srcset: img.getAttribute('srcset') || img.getAttribute('srcSet') || '' }; };
    if (!srcs.length) {
      srcs = new Array(n);
      srcs[0] = asSrc(proto);
      var pre = layers.filter(function (x) { return x !== curL; });
      if (pre[0]) srcs[1 % n] = asSrc($('img', pre[0]));
      if (pre[1]) srcs[(n - 1) % n] = asSrc($('img', pre[1]));
    }
    var cur = 0, busy = false;
    var mk = function (i, cls, a) {
      var s = srcs[i] || srcs[0];
      var div = d.createElement('div'); div.className = cls;
      var img = proto.cloneNode(false);
      img.setAttribute('src', s.src); if (s.srcset) img.setAttribute('srcset', s.srcset); else img.removeAttribute('srcset');
      img.setAttribute('alt', a);
      div.appendChild(img);
      return div;
    };
    var pre = layers.filter(function (x) { return x !== curL; });
    var refreshPreload = function (prev) {
      pre.forEach(function (x) { x.remove(); });
      var want = [(cur + 1) % n, (cur - 1 + n) % n].filter(function (v, i, a) { return a.indexOf(v) === i && v !== cur && v !== prev; });
      pre = want.map(function (i) { var x = mk(i, 'absolute inset-0 z-0 opacity-0', ''); x.setAttribute('aria-hidden', 'true'); return x; });
      pre.forEach(function (x) { car.insertBefore(x, curL); });
    };
    var paint = function () {
      var lab = slideLabel(cur, n);
      if (live) live.textContent = lab;
      if (tabsBox) tabsBox.setAttribute('aria-label', lab);
      tabs.forEach(function (b, i) { b.setAttribute('aria-selected', i === cur ? 'true' : 'false'); b.className = 'h-1.5 rounded-full transition duration-300 p-0 border-0 min-w-0 ' + (i === cur ? 'w-8 bg-primary shadow-brand' : 'w-1.5 bg-secondary hover:bg-secondary'); });
    };
    var move = function (to, dir) {
      if (busy || to === cur) return;
      busy = true;
      var prev = cur; cur = (to % n + n) % n;
      var exit = mk(prev, 'absolute inset-0 z-[3] ' + (dir < 0 ? 'animate-[carousel-exit-right_0.3s_ease-in_forwards]' : 'animate-[carousel-exit-left_0.3s_ease-in_forwards]'), alt);
      var enter = mk(cur, 'absolute inset-0 z-[2] ' + (dir > 0 ? 'animate-[carousel-enter-right_0.4s_cubic-bezier(0.25,1,0.5,1)_forwards]' : 'animate-[carousel-enter-left_0.4s_cubic-bezier(0.25,1,0.5,1)_forwards]'), alt + ' ' + (cur + 1));
      curL.replaceWith(enter); curL = enter;
      car.insertBefore(exit, live ? live.nextSibling : car.firstChild);
      refreshPreload(prev);
      var end = function () { exit.remove(); curL.className = 'absolute inset-0 z-[2] '; busy = false; refreshPreload(null); };
      exit.addEventListener('animationend', end, { once: true });
      if (RM.matches) end();
      paint();
    };
    var nav = $$('button[aria-label]', car).filter(function (b) { return !b.closest('[role="tablist"]'); });
    if (nav[0]) nav[0].addEventListener('click', function () { move(cur - 1, -1); });
    if (nav[1]) nav[1].addEventListener('click', function () { move(cur + 1, 1); });
    tabs.forEach(function (b, i) { b.addEventListener('click', function () { if (i !== cur) move(i, i > cur ? 1 : -1); }); });
    paint();
  });

  // ---------------------------------------------------------------------------------------------
  // home "We Don't Play Games": pinned section, horizontal travel driven by scroll progress
  // (easeInOutCubic). Runway = max(18vh, 0.28 x travel x --wg-pin-runway); the premium layer sets
  // --wg-pin-runway (.5) under data-fx="on"; with fx off the factor is 1, as live.
  $$('section.relative.isolate.hidden').forEach(function (sec) {
    var sticky = sec.firstElementChild, spacer = sec.lastElementChild;
    if (!sticky || !spacer || sticky === spacer || !spacer.classList.contains('h-[18vh]')) return;
    var track = $$('div.relative.z-10.flex', sticky).filter(function (x) { return /translate3d/.test(x.getAttribute('style') || ''); })[0];
    var text = $$('div.pointer-events-none.absolute', sticky).filter(function (x) { return /translate3d\(0,-50%,0\)/.test((x.getAttribute('style') || '').replace(/\s/g, '')); })[0];
    if (!track) return;
    var wide = mq('(min-width: 768px)'), travel = 0, pinH = 0, lx = '', lt = '', still = false;
    var readPin = function () { pinH = parseFloat(getComputedStyle(html).getPropertyValue('--header-pinned-h')) || 0; };
    var frame = function () {
      if (still || RM.matches || !wide.matches) return;
      var a = spacer.offsetHeight; if (a <= 0) return;
      var top = sec.getBoundingClientRect().top, t = Math.max(0, Math.min(1, (pinH - top) / a));
      var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, x = -(e * travel);
      var tx = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      if (tx !== lx) { lx = tx; track.style.transform = tx; }
      if (text) { var tt = 'translate3d(' + (0.35 * x).toFixed(1) + 'px,-50%,0)'; if (tt !== lt) { lt = tt; text.style.transform = tt; } }
    };
    var measure = function () {
      // reduced motion: live still sizes the runway (its layout effect runs once before the media
      // query is read) but never moves the track; same here
      if (!wide.matches) { track.style.transform = 'translate3d(0,0,0)'; if (text) text.style.transform = 'translate3d(0,-50%,0)'; spacer.style.height = ''; lx = lt = ''; return; }
      // premium layer (owner, 2026-11-24): not scroll-dependent; the cards sit still in a grid and there is no runway
      still = html.getAttribute('data-fx') !== 'off' && (getComputedStyle(sec).getPropertyValue('--wg-pin-still') || '').trim() === '1';
      if (still) { track.style.transform = 'none'; if (text) text.style.transform = 'translate3d(0,-50%,0)'; spacer.style.height = '0px'; lx = lt = ''; return; }
      travel = Math.max(0, track.scrollWidth - w.innerWidth); readPin();
      var k = parseFloat(getComputedStyle(sec).getPropertyValue('--wg-pin-runway')) || 1;
      spacer.style.height = Math.round(Math.max(0.18 * w.innerHeight, 0.28 * travel * k)) + 'px';
      if (!RM.matches) frame();
    };
    measure();
    onScroll(frame);
    if (w.ResizeObserver) { var ro = new ResizeObserver(measure); ro.observe(sec); ro.observe(track); ro.observe(html); if (header) new ResizeObserver(function () { readPin(); frame(); }).observe(header); }
    onMq(wide, measure); w.addEventListener('resize', measure, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(measure);
    raf(function () { raf(measure); });
    new MutationObserver(measure).observe(html, { attributes: true, attributeFilter: ['data-fx'] });
  });

  // ---------------------------------------------------------------------------------------------
  // copy coupon code buttons: clipboard, then "Copied!" for 2s in the button's live region
  $$('button[aria-label]').forEach(function (b) {
    var l = b.getAttribute('aria-label'), pre = T.copyCode + ': ';
    if (l.indexOf(pre) !== 0 && l.indexOf('Copy coupon code: ') !== 0) return;
    var code = l.slice(l.indexOf(': ') + 2), msg = $('[aria-live]', b); if (!msg) return;
    b.addEventListener('click', function () {
      var grid = b.parentElement;
      var ok = function () {
        $$('button [aria-live]', grid).forEach(function (m) { m.textContent = T.copyCode; });
        msg.textContent = T.copied;
        clearTimeout(grid._wgT); grid._wgT = setTimeout(function () { msg.textContent = T.copyCode; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, noop);
    });
  });

  // ---------------------------------------------------------------------------------------------
  // embedded iframes that fade in on load (360 tours): reveal once loaded (or after a grace period)
  $$('iframe.opacity-0').forEach(function (f) {
    var pulse = f.previousElementSibling && f.previousElementSibling.classList.contains('animate-pulse') ? f.previousElementSibling : null;
    var show = function () { f.classList.remove('opacity-0'); f.classList.add('opacity-100'); if (pulse) { pulse.remove(); pulse = null; } };
    f.addEventListener('load', show, { once: true });
    if (w.IntersectionObserver) { var ob = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { ob.disconnect(); setTimeout(show, 3000); } }); ob.observe(f); } else setTimeout(show, 3000);
  });

  // ---------------------------------------------------------------------------------------------
  // header search: the toggle opens the search row (header-search-open); Enter goes to the live menu search
  (function search() {
    var tg = $('button[aria-controls="header-search-panel"]'), panel = d.getElementById('header-search-panel');
    if (!tg || !panel || !header) return;
    var input = $('input[type="search"]', panel);
    var setOpen = function (o) {
      header.classList.toggle('header-search-open', o);
      tg.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o && input) setTimeout(function () { input.focus(); }, 0);
    };
    tg.addEventListener('click', function () { setOpen(tg.getAttribute('aria-expanded') !== 'true'); });
    if (input) input.addEventListener('keydown', function (e) {
      if (e.isComposing) return;
      if (e.key === 'Escape') { e.preventDefault(); input.value = ''; input.blur(); setOpen(false); return; }
      var q = input.value.trim();
      if (e.key !== 'Enter' || !q) return;
      e.preventDefault();
      var slug = selected || 'pacific-beach-de-soto-st'; // live: selected store, else the first store in its table
      location.assign(liveUrl('/stores/' + slug + '/products?search=' + encodeURIComponent(q)));
    });
  })();

  // ---------------------------------------------------------------------------------------------
  // harvested browser-only UI (src/fragments.mjs -> /fragments/ui-<lang>.json): fetched once at idle
  // (and at once on first use), mounted on demand like the live client components
  var UI = null, uiQ = [];
  var loadUI = function (cb) {
    if (UI) { cb(UI); return; }
    uiQ.push(cb); if (uiQ.length > 1) return;
    fetch(BASE + '/fragments/ui-' + LANG + '.json').then(function (r) { return r.json(); }).then(function (j) { UI = j; uiQ.splice(0).forEach(function (f) { f(j); }); }, function () { uiQ = []; });
  };
  var idle = w.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
  idle(function () { loadUI(noop); }, { timeout: 4000 });
  var mount = function (markup) {
    // the captures were taken with one store selected: their per-store menu links follow the visitor's store
    if (UI && UI.store && selected && selected !== UI.store) markup = markup.split('/stores/' + UI.store).join('/stores/' + selected);
    var t = d.createElement('template'); t.innerHTML = markup; return t.content.firstElementChild;
  };

  // desktop header dropdowns (Radix DropdownMenu, non-modal): hover opens at once; leaving trigger or
  // panel closes after 120 + 280 ms; pointerdown toggles; Enter/Space/ArrowDown open and focus the
  // first item; arrows move; Escape / outside pointerdown / Tab close (only one open at a time)
  (function dropdowns() {
    var trigs = $$('nav.header-nav button[aria-haspopup="menu"][aria-controls]');
    if (!trigs.length) return;
    var cur = null, wrap = null, t1 = 0, t2 = 0;
    var clear = function () { clearTimeout(t1); clearTimeout(t2); };
    var keyOf = function (b) { var c = b.getAttribute('aria-controls') || '', i = c.indexOf('-panel-'); return i >= 0 ? c.slice(i + 7) : ''; };
    var place = function () {
      if (!cur || !wrap) return;
      var r = cur.getBoundingClientRect(), p = wrap.firstElementChild, wd = wrap.offsetWidth;
      var x = p && p.getAttribute('data-align') === 'end' ? r.right - wd : r.left;
      x = Math.max(0, Math.min(x, html.clientWidth - wd));
      wrap.style.transform = 'translate(' + Math.round(x) + 'px, ' + Math.round(r.bottom + 2) + 'px)';
      wrap.style.setProperty('--radix-popper-anchor-width', r.width + 'px'); wrap.style.setProperty('--radix-popper-anchor-height', r.height + 'px');
    };
    var items = function () { return wrap ? $$('[role="menuitem"]', wrap) : []; };
    var close = function (now, refocus) {
      clear();
      if (!cur) return;
      var b = cur, wr = wrap; cur = wrap = null;
      b.setAttribute('aria-expanded', 'false'); b.setAttribute('data-state', 'closed');
      if (refocus) b.focus();
      var p = wr.firstElementChild, gone = false, done = function () { if (!gone) { gone = true; wr.remove(); } };
      if (now || RM.matches || !p) { done(); return; }
      p.setAttribute('data-state', 'closed');
      p.addEventListener('animationend', done, { once: true });
      setTimeout(done, 400);
    };
    var open = function (b, focusFirst) {
      clear();
      if (cur === b) { if (focusFirst && items()[0]) items()[0].focus(); return; }
      if (cur) close(true);
      loadUI(function (ui) {
        var m = ui.panels && ui.panels[keyOf(b)];
        if (!m || cur) return;
        cur = b; wrap = mount(m);
        var p = wrap.firstElementChild;
        p.id = b.getAttribute('aria-controls'); p.setAttribute('aria-labelledby', b.id); p.setAttribute('data-state', 'open');
        d.body.appendChild(wrap); place();
        b.setAttribute('aria-expanded', 'true'); b.setAttribute('data-state', 'open');
        p.addEventListener('mouseenter', clear);
        p.addEventListener('mouseleave', leave);
        p.addEventListener('keydown', function (e) {
          var its = items(), i = its.indexOf(d.activeElement), n = its.length;
          if (e.key === 'Escape') { e.preventDefault(); close(false, true); return; }
          if (e.key === 'Tab') { close(true); return; }
          var j = e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowUp' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
          if (j >= 0 && n) { e.preventDefault(); its[j].focus(); }
        });
        if (focusFirst && items()[0]) items()[0].focus();
      });
    };
    var leave = function () { clear(); t1 = setTimeout(function () { t2 = setTimeout(function () { close(); }, 280); }, 120); };
    trigs.forEach(function (b) {
      b.addEventListener('mouseenter', function () { open(b); });
      b.addEventListener('mouseleave', leave);
      b.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 || e.ctrlKey) return;
        if (cur === b) close(); else open(b);
        if (e.pointerType === 'mouse') e.preventDefault(); // Radix keeps focus off the trigger on mouse
      });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(b, true); }
        else if (e.key === 'Escape' && cur === b) { e.preventDefault(); close(false, true); }
      });
    });
    d.addEventListener('pointerdown', function (e) { if (cur && !cur.contains(e.target) && !(wrap && wrap.contains(e.target))) close(); }, true);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) close(false, true); });
    w.addEventListener('scroll', place, { passive: true }); w.addEventListener('resize', place);
    loadUI(noop);
  })();

  // mobile drawer: a full-screen non-modal <dialog> mounted on demand; slide-in / slide-out keyframes;
  // html + body overflow hidden while open; its four sections are single-open collapsibles
  (function drawer() {
    var btn = $('nav.header-nav button.col-start-1[aria-label]');
    if (!btn) return;
    var dlg = null, closedItems = [];
    var IN = 'animate-[slide-in-top_0.3s_cubic-bezier(0.22,1,0.36,1)_forwards]', OUT = 'animate-[slide-out-top_0.3s_cubic-bezier(0.22,1,0.36,1)_forwards]';
    var MENU_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu h-5 w-5"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>';
    var labels = LANG === 'es' ? ['Abrir menú', 'Cerrar menú'] : ['Open menu', 'Close menu'];
    var setBtn = function (o) { btn.setAttribute('aria-label', labels[o ? 1 : 0]); var s = $('svg', btn); if (s) s.replaceWith(h(o ? icon('x', 'h-5 w-5') : MENU_ICON)); };
    var close = function () {
      if (!dlg) return;
      var x = dlg; dlg = null;
      var gone = false, done = function () { if (gone) return; gone = true; x.remove(); html.style.overflow = ''; d.body.style.overflow = ''; setBtn(false); btn.focus(); };
      if (RM.matches) { done(); return; }
      x.className = x.className.replace(IN, OUT);
      x.addEventListener('animationend', done, { once: true });
      setTimeout(done, 450);
    };
    var toggleItem = function (b) {
      var items = $$(':scope button[aria-expanded]', dlg);
      var i = items.indexOf(b); if (i < 0 || !UI) return;
      var opening = b.getAttribute('aria-expanded') !== 'true';
      // close the open one (single-open), then swap this item for its captured open state
      items.forEach(function (o, k) { if (o.getAttribute('aria-expanded') === 'true' && closedItems[k]) { o.parentElement.replaceWith(closedItems[k].cloneNode(true)); } });
      if (opening && UI.drawerItems && UI.drawerItems[i]) {
        var fresh = $$(':scope button[aria-expanded]', dlg)[i];
        var openEl = mount(UI.drawerItems[i]);
        if (fresh && openEl) fresh.parentElement.replaceWith(openEl);
      }
      wireItems();
    };
    var wireItems = function () {
      $$(':scope button[aria-expanded]', dlg).forEach(function (b, k) {
        if (!closedItems[k] && b.getAttribute('aria-expanded') !== 'true') closedItems[k] = b.parentElement.cloneNode(true);
        if (b._wg) return; b._wg = 1;
        b.addEventListener('click', function () { toggleItem(b); });
      });
    };
    var open = function () {
      loadUI(function (ui) {
        if (dlg || !ui.drawer) return;
        dlg = mount(ui.drawer);
        d.body.appendChild(dlg);
        html.style.overflow = 'hidden'; d.body.style.overflow = 'hidden';
        setBtn(true);
        closedItems = [];
        wireItems();
        $$('button[aria-label]', dlg).forEach(function (b) { if (b.getAttribute('aria-label') === labels[1]) b.addEventListener('click', close); });
        // "Accessibility Menu" in the drawer (phones hide the floating toggle once the gates pass)
        $$('button', dlg).forEach(function (b) { if ($('svg.lucide-accessibility', b)) b.addEventListener('click', function () { close(); setTimeout(function () { w.dispatchEvent(new Event('wg:open-accessibility')); }, 0); }); });
        $$('a[href]', dlg).forEach(function (a) { a.addEventListener('click', function () { setTimeout(close, 0); }); });
      });
    };
    btn.addEventListener('click', function () { if (dlg) close(); else open(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dlg) close(); });
  })();

  // accessibility widget: the toggle (server markup via the build hook) swaps for the modal dialog;
  // options rebuild one <style id="accessibility-widget-styles">; state persists in localStorage
  // "israel-accessibility-widget-state" (restored 100 ms after load), as the live widget does
  (function a11y() {
    var root = $('[data-accessibility-widget]');
    if (!root) return;
    var KEY = 'israel-accessibility-widget-state', SID = 'accessibility-widget-styles';
    var DEF = { textSize: 100, isGrayscale: false, isHighContrast: false, isNegativeContrast: false, isLightBackground: false, isLinksUnderlined: false, isReadableFont: false, areAnimationsStopped: false, isLargeCursor: false, isReadingGuide: false, isTextSpacing: false, isHighlightTitles: false, textAlign: null, language: LANG };
    var S = JSON.parse(JSON.stringify(DEF));
    var dirty = function (s) { return s.textSize !== 100 || s.isGrayscale || s.isHighContrast || s.isNegativeContrast || s.isLightBackground || s.isLinksUnderlined || s.isReadableFont || s.areAnimationsStopped || s.isLargeCursor || s.isReadingGuide || s.isTextSpacing || s.isHighlightTitles || s.textAlign !== null; };
    var ORDER = ['isGrayscale', 'isHighContrast', 'isNegativeContrast', 'isLightBackground', 'isLinksUnderlined', 'isReadableFont', 'areAnimationsStopped', 'isLargeCursor', 'isTextSpacing', 'isHighlightTitles'];
    var guide = null;
    var apply = function () {
      var el = d.getElementById(SID);
      if (dirty(S) && UI) {
        var css = S.textSize !== 100 ? 'html, body {\n  font-size: ' + S.textSize + '% !important;\n}\n' : '';
        ORDER.forEach(function (k) { if (S[k] && UI.a11yCss[k]) css += UI.a11yCss[k] + '\n'; });
        if (S.textAlign && UI.a11yCss[S.textAlign]) css += UI.a11yCss[S.textAlign] + '\n';
        if (css.trim()) { if (!el) { el = d.createElement('style'); el.id = SID; d.head.appendChild(el); } el.textContent = css; store.set(KEY, JSON.stringify(S)); }
      } else if (!dirty(S)) { if (el) el.remove(); store.del(KEY); }
      if (S.isReadingGuide && !guide) {
        guide = h('<div class="fixed left-0 w-full h-8 bg-background border-t-2 border-b-2 border-gold-500 pointer-events-none z-[9998]" style="transform: translateY(-50%); box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 0px 9999px;"></div>');
        d.body.appendChild(guide);
      } else if (!S.isReadingGuide && guide) { guide.remove(); guide = null; }
    };
    w.addEventListener('mousemove', function (e) { if (guide) guide.style.top = e.clientY + 'px'; }, { passive: true });
    w.addEventListener('touchmove', function (e) { if (guide && e.touches[0]) guide.style.top = e.touches[0].clientY + 'px'; }, { passive: true });
    var ACT = [
      function () { S.textSize = Math.min(S.textSize + 10, 200); }, function () { S.textSize = Math.max(S.textSize - 10, 80); },
      function () { S.isGrayscale = !S.isGrayscale; S.isHighContrast = false; S.isNegativeContrast = false; },
      function () { S.isHighContrast = !S.isHighContrast; S.isGrayscale = false; S.isNegativeContrast = false; S.isLightBackground = false; },
      function () { S.isNegativeContrast = !S.isNegativeContrast; S.isGrayscale = false; S.isHighContrast = false; S.isLightBackground = false; },
      function () { S.isLightBackground = !S.isLightBackground; S.isHighContrast = false; S.isNegativeContrast = false; },
      function () { S.isLinksUnderlined = !S.isLinksUnderlined; }, function () { S.isHighlightTitles = !S.isHighlightTitles; },
      function () { S.isReadableFont = !S.isReadableFont; }, function () { S.isLargeCursor = !S.isLargeCursor; },
      function () { S.isReadingGuide = !S.isReadingGuide; }, function () { S.isTextSpacing = !S.isTextSpacing; },
      function () { S.areAnimationsStopped = !S.areAnimationsStopped; },
      function () { S.textAlign = S.textAlign === 'right' ? null : 'right'; }, function () { S.textAlign = S.textAlign === 'center' ? null : 'center'; }, function () { S.textAlign = S.textAlign === 'left' ? null : 'left'; }
    ];
    var activeOf = [function () { return S.textSize > 100; }, function () { return S.textSize < 100; }, function () { return S.isGrayscale; }, function () { return S.isHighContrast; }, function () { return S.isNegativeContrast; }, function () { return S.isLightBackground; }, function () { return S.isLinksUnderlined; }, function () { return S.isHighlightTitles; }, function () { return S.isReadableFont; }, function () { return S.isLargeCursor; }, function () { return S.isReadingGuide; }, function () { return S.isTextSpacing; }, function () { return S.areAnimationsStopped; }, function () { return S.textAlign === 'right'; }, function () { return S.textAlign === 'center'; }, function () { return S.textAlign === 'left'; }];
    var toggleBtn = $('[data-a11y-toggle]', root), dlg = null, back = null;
    var paintOpts = function () {
      if (!dlg) return;
      $$('.grid.grid-cols-3 > button', dlg).forEach(function (b, i) {
        if (!activeOf[i]) return;
        var on = activeOf[i]();
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.className = 'flex flex-col items-center justify-center p-1.5 rounded-md transition border min-h-[70px] focus:ring-2 ring-info focus:outline-none\n        ' + (on ? 'bg-info border-info text-info font-semibold ring-1 ring-info shadow-inner' : 'bg-card border-border hover:bg-secondary hover:border-line-strong text-ink-700 shadow-sm') + '\n      ';
        var ic = b.firstElementChild; if (ic && ic.tagName === 'DIV') ic.className = 'mb-1 ' + (on ? 'text-info' : 'text-ink-700');
      });
    };
    var closeDlg = function () {
      if (!dlg) return;
      try { dlg.close(); } catch (e) {}
      dlg.replaceWith(toggleBtn); dlg = null;
      var f = toggleBtn && toggleBtn.getClientRects().length ? toggleBtn : back; if (f) f.focus();
    };
    var openStatement = function () {
      if (!UI || !UI.a11yStatement) return;
      closeDlg();
      var st = mount(UI.a11yStatement); d.body.appendChild(st);
      var shut = function () { st.remove(); d.removeEventListener('keydown', esc); if (toggleBtn) toggleBtn.focus(); };
      var esc = function (e) { if (e.key === 'Escape') shut(); };
      $$('button', st).forEach(function (b) { if (/close|cerrar/i.test(b.getAttribute('aria-label') || b.textContent)) b.addEventListener('click', shut); });
      st.addEventListener('click', function (e) { if (e.target === st) shut(); });
      d.addEventListener('keydown', esc);
      var x = $$('button', st)[0]; if (x) x.focus();
    };
    var openDlg = function () {
      back = d.activeElement;
      loadUI(function (ui) {
        if (dlg || !ui.a11yOpen) return;
        var shell = mount(ui.a11yOpen); // the capture is the widget root; its <dialog> replaces the toggle
        dlg = shell && (shell.tagName === 'DIALOG' ? shell : $('dialog', shell));
        if (!dlg) return;
        dlg.removeAttribute('open');
        toggleBtn.replaceWith(dlg);
        try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
        var btns = $$('button', dlg);
        btns.forEach(function (b) {
          var inGrid = b.parentElement && b.parentElement.classList.contains('grid-cols-3');
          if (inGrid) { var i = $$('.grid.grid-cols-3 > button', dlg).indexOf(b); b.addEventListener('click', function () { if (ACT[i]) { ACT[i](); apply(); paintOpts(); } }); return; }
          var t = (b.getAttribute('aria-label') || b.textContent || '').trim();
          if (b === btns[0]) b.addEventListener('click', closeDlg);
          else if (/reset|restablecer/i.test(t)) b.addEventListener('click', function () { var lang = S.language; S = JSON.parse(JSON.stringify(DEF)); S.language = lang; apply(); paintOpts(); });
          else if (/statement|declaraci/i.test(t)) b.addEventListener('click', openStatement);
        });
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDlg(); });
        dlg.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { e.preventDefault(); closeDlg(); return; }
          if (e.key !== 'Tab') return;
          var f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', dlg), a = f[0], z = f[f.length - 1];
          if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
        });
        paintOpts();
        if (btns[0]) btns[0].focus();
      });
    };
    if (toggleBtn) toggleBtn.addEventListener('click', openDlg);
    w.addEventListener('wg:open-accessibility', openDlg);
    // restore a saved state (100 ms after load, like the live widget)
    setTimeout(function () {
      var raw2 = store.get(KEY); if (!raw2) return;
      try { var s2 = JSON.parse(raw2); if (!s2.language) s2.language = 'en'; if (dirty(s2)) { S = s2; loadUI(apply); } } catch (e) { store.del(KEY); }
    }, 100);
  })();

  // header search dropdown: on focus, the captured suggestions panel (bestseller brands; the live
  // "Popular now" list comes from the live inventory API and is left out); a suggestion or Enter
  // opens the live store's search
  (function searchDrop() {
    var row = d.getElementById('header-search-panel'), input = row && $('input[type="search"]', row);
    if (!input) return;
    var anchor = input.closest('.relative.flex') || input.parentElement, box = null;
    var go = function (q) { location.assign(liveUrl('/stores/' + (selected || 'pacific-beach-de-soto-st') + '/products?search=' + encodeURIComponent(q))); };
    var place = function () { if (!box) return; var a = anchor.getBoundingClientRect(), r = row.getBoundingClientRect(), top = Math.max(r.bottom, a.bottom); box.style.cssText = 'position: fixed; top: ' + Math.round(top) + 'px; left: ' + Math.round(a.left) + 'px; width: ' + Math.round(a.width) + 'px; max-height: ' + Math.max(120, Math.round(w.innerHeight - top - 8)) + 'px;'; };
    var hide = function () { if (!box) return; box.remove(); box = null; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-controls'); };
    var show = function () {
      if (box || input.value.trim()) return;
      loadUI(function (ui) {
        if (box || !ui.searchFocus || d.activeElement !== input) return;
        var lb = mount(ui.searchFocus); if (!lb) return;
        box = d.createElement('div'); box.className = 'z-[100] overflow-y-auto'; box.appendChild(lb); d.body.appendChild(box); place();
        input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'true'); if (lb.id) input.setAttribute('aria-controls', lb.id);
        $$('button[role="option"]', lb).forEach(function (b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); }); b.addEventListener('click', function () { go(b.textContent.trim()); }); });
      });
    };
    input.addEventListener('focus', show);
    input.addEventListener('input', function () { if (input.value.trim()) hide(); else show(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
    d.addEventListener('pointerdown', function (e) { if (box && !box.contains(e.target) && e.target !== input) hide(); }, true);
    w.addEventListener('resize', place); w.addEventListener('scroll', place, { passive: true });
  })();

  // 360 walk-through: stops as tabs; the panel's iframe is replaced per stop (fades in on load),
  // prev/next wrap, the overlay shows the stop name and n / total (stops: data-wg-tour, build hook)
  $$('[role="tablist"][data-wg-tour]').forEach(function (tl) {
    var stops; try { stops = JSON.parse(tl.getAttribute('data-wg-tour')); } catch (e) { return; }
    var tabs = $$(':scope > button[role="tab"]', tl), panel = tabs[0] && d.getElementById(tabs[0].getAttribute('aria-controls'));
    if (!panel || stops.length !== tabs.length) return;
    var frameBox = $(':scope > div', panel), nav = $$(':scope > button', panel), over = $(':scope > div.pointer-events-none', panel);
    var iframe0 = $('iframe', panel), title0 = iframe0 ? iframe0.getAttribute('title') : '';
    var store0 = (/: (?:.*)$/.test(title0) && /(?:of|de) (.+?): /.exec(title0) || [])[1] || '';
    var tplT = LANG === 'es' ? 'Tour virtual 360° de {store}: {scene} ({n} de {total})' : '360° virtual tour of {store}: {scene} ({n} of {total})';
    var cur = 0, ON = 'snap-start max-w-[11rem] shrink-0 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-300 border-primary bg-primary/10 text-primary shadow-[0_0_24px_-8px_rgba(33, 106, 82,0.55)]', OFF = 'snap-start max-w-[11rem] shrink-0 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-300 border-border bg-secondary text-ink-700 hover:border-line-strong hover:text-ink-700';
    var go = function (i) {
      i = (i % stops.length + stops.length) % stops.length; if (i === cur) return; cur = i;
      tabs.forEach(function (b, k) { b.setAttribute('aria-selected', k === cur ? 'true' : 'false'); b.className = k === cur ? ON : OFF; });
      panel.setAttribute('aria-labelledby', tabs[cur].id);
      var old = $('iframe', frameBox);
      if (old) {
        var f = old.cloneNode(false);
        f.setAttribute('src', stops[cur].src);
        f.setAttribute('title', tpl(tplT, { store: store0, scene: stops[cur].label, n: cur + 1, total: stops.length }));
        f.className = f.className.replace('opacity-100', 'opacity-0');
        if (!/opacity-0/.test(f.className)) f.className += ' opacity-0';
        var pulse = $('.animate-pulse', frameBox);
        if (!pulse) { pulse = h('<div class="absolute inset-0 z-[1] animate-pulse bg-gradient-to-br from-transparent via-transparent to-forest-100/30" aria-hidden="true"></div>'); frameBox.insertBefore(pulse, old); }
        old.replaceWith(f);
        f.addEventListener('load', function () { f.classList.remove('opacity-0'); f.classList.add('opacity-100'); if (pulse) pulse.remove(); }, { once: true });
        setTimeout(function () { if (f.isConnected) { f.classList.remove('opacity-0'); f.classList.add('opacity-100'); if (pulse) pulse.remove(); } }, 3000);
      }
      if (over) { var bits = $$(':scope > div', over); if (bits[0]) bits[0].textContent = stops[cur].label; if (bits[1]) bits[1].textContent = (cur + 1) + ' / ' + stops.length; }
      var a = tabs[cur]; tl.scrollTo({ left: a.offsetLeft - tl.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    };
    tabs.forEach(function (b, k) { b.addEventListener('click', function () { go(k); }); });
    if (nav[0]) nav[0].addEventListener('click', function () { go(cur - 1); });
    if (nav[1]) nav[1].addEventListener('click', function () { go(cur + 1); });
  });

  w.WG = { openPicker: openPicker, setStore: function (s) { setStoreState(s, true); } };
})();

/* First-time-customer coupon ("Claim 50% off …" on store pages): the live claim form submits to the
   site's own API, which a static host cannot answer. Hand the visitor to the same page on the live
   site, where the form works, instead of a button that does nothing. */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button[aria-label*="50%"][aria-label*="first-time" i], button[aria-label*="50%"][aria-label*="nuevos clientes" i]');
    if (!b) return;
    e.preventDefault();
    window.location.href = 'https://www.wellgreens.store' + (window.__WG_PATH__ || window.location.pathname) + '#daily-deals';
  });
})();
