/* Wellgreens — premium layer runtime. Vanilla, no dependencies. Active only when
   html[data-fx="on"] (default). `?fx=off` gives the exact replica; `?splash=bloom|iris|rise|classic|none`
   replays or switches the intro (remembered for the session). */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') === 'off') return;
  html.classList.add('wg-js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var ES = (html.getAttribute('lang') || '').toLowerCase().indexOf('es') === 0 || /^\/es(\/|$)/.test(window.__WG_PATH__ || location.pathname);
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------------------------------------------------------------- splash (once per session) */
  function splash() {
    if (!html.classList.contains('wg-splash-pending')) return;
    try { sessionStorage.setItem('wg_splash_seen', '1'); } catch (e) {}
    var el = d.createElement('div');
    el.id = 'wg-splash';
    el.setAttribute('role', 'presentation');
    el.setAttribute('aria-hidden', 'true');
    var tag = '';
    var foot = d.querySelector('footer');
    if (foot) { var m = (foot.textContent || '').match(/(excellence since \d{4}|excelencia desde \d{4})/i); if (m) tag = m[1]; }
    el.innerHTML = '<div class="wg-sp-panel wg-sp-top"></div><div class="wg-sp-panel wg-sp-bot"></div>' +
      '<div class="wg-sp-grain"></div><div class="wg-sp-stage"><div class="wg-sp-mark"></div><div class="wg-sp-sheen"></div>' +
      '<div class="wg-sp-line"></div>' + (tag ? '<div class="wg-sp-tag"></div>' : '') + '</div>';
    if (tag) el.querySelector('.wg-sp-tag').textContent = tag;
    d.body.appendChild(el);
    html.classList.add('wg-splashing');
    html.classList.remove('wg-splash-pending');
    var done = false;
    function out() {
      if (done) return; done = true;
      el.classList.add('wg-sp-out');
      html.classList.remove('wg-splashing');
      html.classList.add('wg-splash-release');
      setTimeout(function () { el.remove(); html.classList.remove('wg-splash-release'); }, 950);
    }
    setTimeout(out, 1350);
    el.addEventListener('click', out);
    d.addEventListener('keydown', out, { once: true });
  }
  if (d.body) splash(); else d.addEventListener('DOMContentLoaded', splash);

  /* ---------------------------------------------------------------- progress + back to top */
  var bar = d.createElement('div'); bar.id = 'wg-progress'; bar.setAttribute('aria-hidden', 'true');
  var top = d.createElement('button'); top.id = 'wg-top'; top.type = 'button';
  top.setAttribute('aria-label', ES ? 'Volver arriba' : 'Back to top');
  top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  d.body.appendChild(bar); d.body.appendChild(top);
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    raf(function () {
      ticking = false;
      var max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
      var y = window.scrollY || d.documentElement.scrollTop;
      bar.style.setProperty('--p', Math.min(1, y / max).toFixed(4));
      top.classList.toggle('wg-on', y > innerHeight * 1.4);
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------------------------------------------------------------- faster page-to-page */
  try {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      var s = d.createElement('script'); s.type = 'speculationrules';
      s.textContent = JSON.stringify({ prerender: [{ source: 'document', eagerness: 'moderate', where: { and: [
        { href_matches: (window.__WG_BASE__ || '') + '/*' }, { not: { href_matches: (window.__WG_BASE__ || '') + '/stores/*' } }, { not: { selector_matches: '[target=_blank], [download], [href^="#"]' } }] } }] });
      d.head.appendChild(s);
    }
  } catch (e) {}
  // browsers without cross-document view transitions get a short fade instead
  if (!('PageRevealEvent' in window) && !reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
      e.preventDefault();
      html.classList.add('wg-leaving');
      setTimeout(function () { location.href = u.href; }, 170);
    });
    addEventListener('pageshow', function () { html.classList.remove('wg-leaving'); });
  }

  /* ---------------------------------------------------------------- pointer niceties */
  if (fine && !reduce) {
    d.querySelectorAll('a[data-cta="exclusive_brand"]').forEach(function (a) {
      a.addEventListener('pointermove', function (e) {
        var r = a.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        a.style.setProperty('--rx', (x * 10).toFixed(2) + 'deg'); a.style.setProperty('--ry', (-y * 8).toFixed(2) + 'deg');
      });
      a.addEventListener('pointerleave', function () { a.style.removeProperty('--rx'); a.style.removeProperty('--ry'); });
    });
    var f = d.querySelector('footer');
    if (f) f.addEventListener('pointermove', function (e) {
      var r = f.getBoundingClientRect();
      f.style.setProperty('--mx', (e.clientX - r.left) + 'px'); f.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    d.querySelectorAll('main a.bg-primary.h-14, main a.bg-primary.h-12').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) / r.width * 6).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) / r.height * 4).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* ---------------------------------------------------------------- images fade in as they arrive */
  d.querySelectorAll('main img[loading="lazy"]').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('wg-fade');
    var on = function () { img.classList.add('wg-in'); };
    img.addEventListener('load', on, { once: true }); img.addEventListener('error', on, { once: true });
  });

  /* ---------------------------------------------------------------- grids enter in a light stagger */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('wg-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    d.querySelectorAll('main .grid').forEach(function (g) {
      var kids = g.children;
      if (kids.length < 4 || kids.length > 60) return;
      if (g.closest('#hero, [role=dialog], dialog, header')) return;
      for (var i = 0; i < kids.length; i++) if (/reveal-|animate-/.test(kids[i].className)) return;
      var r = g.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return;          // already on screen: leave it be
      for (var j = 0; j < kids.length; j++) kids[j].style.setProperty('--i', Math.min(j, 12));
      g.classList.add('wg-stagger'); io.observe(g);
    });
  }
})();

/* store picker, side-sheet option: a click on the dimmed page closes the sheet (only once a store is
   chosen — before that the picker is part of the entry gate and must stay) */
(function () {
  'use strict';
  var html = document.documentElement;
  if (html.getAttribute('data-fx') === 'off') return;
  document.addEventListener('click', function (e) {
    if (html.getAttribute('data-picker') !== 'sheet') return;
    var pk = document.querySelector('.location-selector-overlay');
    if (!pk || getComputedStyle(pk).display === 'none' || pk.contains(e.target)) return;
    if (e.target.closest && e.target.closest('[data-store-trigger]')) return;
    var x = pk.querySelector('[data-wg-close]');
    if (x) x.click();
  }, true);
})();

/* daily-deals hero versions (?hero=ambient|split|peek). Builds day chips (and the split week list)
   from each banner's own label; site.js still owns the carousel, slides start from today. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') === 'off') return;
  var mode = html.getAttribute('data-hero');
  if (!mode) return;
  var reg = d.getElementById('daily-deals'); if (!reg) return;
  var track = reg.firstElementChild; if (!track) return;
  var figs = [].slice.call(track.children).filter(function (n) { return n.tagName === 'FIGURE'; });
  if (figs.length < 2) return;
  var ES = /^\/es(\/|$)/.test(window.__WG_PATH__ || location.pathname) || (html.getAttribute('lang') || '').indexOf('es') === 0;
  var EN_D = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  var ES_D = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  var fold = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var info = figs.map(function (f) {
    var l = f.getAttribute('aria-label') || '', i = l.indexOf(': '), t = i >= 0 ? l.slice(i + 2) : l, low = fold(t), day = -1;
    for (var k = 0; k < 7 && day < 0; k++) if (low.indexOf(EN_D[k]) >= 0 || low.indexOf(ES_D[k]) >= 0) day = k;
    var parts = t.split(/\.\s+/), img = f.querySelector('img');
    return { day: day, offer: (parts[1] || parts[0] || '').trim(), img: img ? (img.currentSrc || img.getAttribute('src')) : '' };
  });
  var laDay = -1;
  try { laDay = EN_D.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' }).format(new Date()).toLowerCase()); } catch (e) {}
  var dayName = function (k, style) { var base = new Date(Date.UTC(2024, 0, 1 + k)); try { return new Intl.DateTimeFormat(ES ? 'es' : 'en', { weekday: style, timeZone: 'UTC' }).format(base); } catch (e) { return EN_D[k]; } };
  var TODAY = ES ? 'Hoy' : 'Today';
  var peek = mode === 'peek';
  var centerOf = function (f) { return f.offsetLeft - (track.clientWidth - f.offsetWidth) / 2; };
  var current = function () {
    if (!peek) { var cw = track.clientWidth; return cw ? Math.max(0, Math.min(figs.length - 1, Math.round(track.scrollLeft / cw))) : 0; }
    var best = 0, bd = Infinity;
    figs.forEach(function (f, i) { var dd = Math.abs(centerOf(f) - track.scrollLeft); if (dd < bd) { bd = dd; best = i; } });
    return best;
  };
  var go = function (i) {
    i = (i % figs.length + figs.length) % figs.length;
    track.scrollTo({ left: peek ? centerOf(figs[i]) : i * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  // day chips
  var chips = d.createElement('nav'); chips.className = 'wg-days'; chips.setAttribute('aria-label', ES ? 'Ofertas por día' : 'Deals by day');
  info.forEach(function (x, i) {
    var b = d.createElement('button'); b.type = 'button';
    b.innerHTML = '<span></span>' + (x.day === laDay ? '<span class="wg-today">' + TODAY + '</span>' : '');
    b.firstChild.textContent = x.day >= 0 ? dayName(x.day, 'short') : String(i + 1);
    b.setAttribute('aria-label', (x.day >= 0 ? dayName(x.day, 'long') : '') + ': ' + x.offer);
    b.addEventListener('click', function () { go(i); });
    chips.appendChild(b);
  });
  reg.parentNode.insertBefore(chips, reg.nextSibling);
  // split: the week beside the banner
  var week = null;
  if (mode === 'split') {
    week = d.createElement('aside'); week.className = 'wg-week'; week.setAttribute('aria-label', ES ? 'Esta semana' : 'This week');
    week.innerHTML = '<h2></h2>'; week.firstChild.textContent = ES ? 'Esta semana' : 'This week';
    info.forEach(function (x, i) {
      var b = d.createElement('button'); b.type = 'button';
      b.innerHTML = '<span><b></b><small></small></span>';   // no thumbnails (owner); none fetched either
      var bb = b.querySelector('b'); bb.textContent = x.day >= 0 ? dayName(x.day, 'long') : String(i + 1);
      if (x.day === laDay) { var em = d.createElement('em'); em.textContent = TODAY; bb.appendChild(em); }
      b.querySelector('small').textContent = x.offer;
      b.addEventListener('click', function () { go(i); });
      week.appendChild(b);
    });
    reg.parentNode.insertBefore(week, chips);
  }
  // ambient: the active banner, blurred, lights the hero
  var amb = null, layers = [], li = 0;
  if (mode === 'ambient') {
    var hero = d.getElementById('hero');
    if (hero) { amb = d.createElement('div'); amb.className = 'wg-ambient'; amb.setAttribute('aria-hidden', 'true'); amb.innerHTML = '<i></i><i></i>'; hero.insertBefore(amb, hero.firstChild); layers = [].slice.call(amb.children); }
  }
  // peek: this file steers the arrows (site.js assumes full-width slides)
  if (peek) {
    var btns = [].slice.call(reg.querySelectorAll(':scope > div > button[aria-label]'));
    if (btns[0]) btns[0].addEventListener('click', function (e) { e.stopImmediatePropagation(); go(current() - 1); }, true);
    if (btns[1]) btns[1].addEventListener('click', function (e) { e.stopImmediatePropagation(); go(current() + 1); }, true);
    track.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') e.stopImmediatePropagation(); }, true);
    requestAnimationFrame(function () { track.scrollLeft = centerOf(figs[0]); });
  }
  var last = -1;
  var sync = function () {
    var c = current(); if (c === last) return; last = c;
    [].forEach.call(chips.children, function (b, i) { b.setAttribute('aria-pressed', i === c ? 'true' : 'false'); });
    if (week) [].forEach.call(week.querySelectorAll('button'), function (b, i) { b.setAttribute('aria-pressed', i === c ? 'true' : 'false'); });
    if (peek) figs.forEach(function (f, i) { f.classList.toggle('wg-active', i === c); });
    if (amb && info[c] && info[c].img) { li = 1 - li; layers[li].style.backgroundImage = 'url("' + info[c].img + '")'; layers[li].classList.add('on'); layers[1 - li].classList.remove('on'); }
  };
  track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
  addEventListener('resize', function () { last = -1; sync(); });
  sync();
})();

/* store picker carousel (data-picker="grid-carousel", the locked option): arrows, "n / total" counter,
   progress bar, wheel-to-sideways on desktop. Search / Use Location / List-Map stay site.js's: they
   hide and reorder the cards, and this follows along. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') === 'off' || html.getAttribute('data-picker') !== 'grid-carousel') return;
  var pk = d.querySelector('.location-selector-overlay'); if (!pk) return;
  var list = pk.querySelector('.space-y-3'); if (!list) return;
  var ES = /^\/es(\/|$)/.test(window.__WG_PATH__ || location.pathname);
  var nav = d.createElement('div'); nav.className = 'wg-pk-nav';
  var arrow = function (dir) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (dir < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6') + '"/></svg>'; };
  nav.innerHTML = '<output aria-live="polite"></output><div><button type="button" data-dir="-1">' + arrow(-1) + '</button><button type="button" data-dir="1">' + arrow(1) + '</button></div>';
  nav.querySelector('[data-dir="-1"]').setAttribute('aria-label', ES ? 'Tiendas anteriores' : 'Previous stores');
  nav.querySelector('[data-dir="1"]').setAttribute('aria-label', ES ? 'Más tiendas' : 'More stores');
  var bar = d.createElement('span'); bar.className = 'wg-pk-bar'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>';
  list.parentNode.insertBefore(nav, list);
  list.parentNode.insertBefore(bar, list.nextSibling);
  var out = nav.querySelector('output'), prev = nav.querySelector('[data-dir="-1"]'), next = nav.querySelector('[data-dir="1"]');
  var cards = function () { return [].slice.call(list.children).filter(function (c) { return !c.hidden && c.offsetWidth > 0; }); };
  var step = function () { var c = cards(); if (!c[0]) return list.clientWidth; var gap = parseFloat(getComputedStyle(list).columnGap) || 0; return c[0].offsetWidth + gap; };
  var update = function () {
    var c = cards(), n = c.length, max = list.scrollWidth - list.clientWidth;
    var per = Math.max(1, Math.floor((list.clientWidth + 1) / step()));
    var first = Math.min(n, Math.round(list.scrollLeft / step()) + 1), last = Math.min(n, first + per - 1);
    out.innerHTML = n ? '<b>' + first + (last > first ? '–' + last : '') + '</b> / ' + n : '0';
    prev.disabled = list.scrollLeft <= 2; next.disabled = list.scrollLeft >= max - 2;
    var vis = list.scrollWidth ? list.clientWidth / list.scrollWidth : 1;
    bar.style.display = vis >= 0.999 ? 'none' : '';
    bar.firstChild.style.setProperty('--w', (vis * 100).toFixed(1) + '%');
    bar.firstChild.style.setProperty('--x', (max > 0 ? (list.scrollLeft / max) * (1 / vis - 1) * 100 : 0).toFixed(1) + '%');
  };
  var smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-dir]'); if (!b || b.disabled) return;
    var per = Math.max(1, Math.floor((list.clientWidth + 1) / step()));
    list.scrollBy({ left: +b.getAttribute('data-dir') * per * step(), behavior: smooth });
  });
  list.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
  // a vertical wheel over the row moves it sideways (the overlay itself has nothing else to scroll)
  list.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.ctrlKey) return;
    var max = list.scrollWidth - list.clientWidth; if (max <= 0) return;
    e.preventDefault(); list.scrollLeft += e.deltaY;
  }, { passive: false });
  list.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); list.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * step(), behavior: smooth });
  });
  // search, Use Location and List/Map change which cards show and their order: start over and recount
  var reset = function () { requestAnimationFrame(function () { list.scrollLeft = 0; update(); }); };
  var input = pk.querySelector('input[type="text"]'); if (input) input.addEventListener('input', reset);
  pk.addEventListener('click', function (e) { if (e.target.closest('button') && !e.target.closest('.wg-pk-nav') && !e.target.closest('[data-store-select]')) setTimeout(reset, 60); });
  if (window.MutationObserver) new MutationObserver(function () { requestAnimationFrame(update); }).observe(list, { attributes: true, subtree: true, attributeFilter: ['hidden', 'class'], childList: true });
  // load every card photo the moment the picker is actually shown (lazy loading would leave the cards
  // further along the row empty until scrolled to; loading them on every page would waste bandwidth)
  var eager = false;
  var wake = function () { if (eager || !list.clientWidth) return; eager = true; [].forEach.call(list.querySelectorAll('.wg-pk-photo img'), function (im) { im.loading = 'eager'; }); };
  if (window.ResizeObserver) new ResizeObserver(function () { wake(); update(); }).observe(list);
  wake(); update();
})();

/* ===================================================================== owner round, 2026-11-24 (late) */

/* Partner logos: a steady marquee, independent of scrolling (owner: a target that speeds up with the scroll is hard
   to click). It stops under the pointer, a touch pauses it for a few seconds, and keyboard focus stops it with the
   focused logo in view. The six original links stay in the reading order once; the loop's copies are aria-hidden + inert. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') === 'off') return;
  var a0 = d.querySelector('a[data-cta="exclusive_brand"]'), set = a0 && a0.closest('.grid');
  if (!set || set.closest('.wg-mq')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(set.querySelectorAll('.reveal-pending'), function (el) { el.classList.remove('reveal-pending'); });
  var mq = d.createElement('div'), track = d.createElement('div');
  mq.className = 'wg-mq'; track.className = 'wg-mq-track';
  set.parentNode.insertBefore(mq, set); mq.appendChild(track); track.appendChild(set);
  set.classList.add('wg-mq-set'); set.setAttribute('role', 'list');
  [].forEach.call(set.children, function (it) { it.setAttribute('role', 'listitem'); });
  if (reduce) { mq.classList.add('wg-mq-static'); return; }
  var copies = [], W = 0, x = 0, base = 30, mult = 1, multT = 1, on = false, seen = false, raf = 0, last = 0, resume = 0;
  var copy = function () {
    var c = set.cloneNode(true);
    c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', ''); c.removeAttribute('role');
    [].forEach.call(c.querySelectorAll('[role="listitem"]'), function (x) { x.removeAttribute('role'); });
    [].forEach.call(c.querySelectorAll('a'), function (a) { a.setAttribute('tabindex', '-1'); });
    track.appendChild(c); copies.push(c);
  };
  var wrap = function () { if (W > 0) { while (x <= -W) x += W; while (x > 0) x -= W; } };
  var paint = function () { track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'; };
  var fit = function () { W = set.getBoundingClientRect().width; var need = Math.ceil(mq.clientWidth / Math.max(W, 1)) + 1; while (copies.length < need) copy(); wrap(); paint(); };
  var frame = function (t) {
    var dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    mult += (multT - mult) * Math.min(1, dt * (multT < mult ? 14 : 3));   // stops in about 0.15 s, picks up gently
    x -= base * mult * dt; wrap(); paint();
    raf = on ? requestAnimationFrame(frame) : 0;
  };
  var start = function () { if (!on && seen && !d.hidden) { on = true; last = 0; raf = requestAnimationFrame(frame); } };
  var stop = function () { on = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  mq.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { clearTimeout(resume); multT = 0; } });
  mq.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') multT = 1; });
  var hold = function (e) { if (e.pointerType !== 'mouse') { clearTimeout(resume); multT = 0; mult = 0; } };
  var release = function (e) { if (e.pointerType !== 'mouse') { clearTimeout(resume); resume = setTimeout(function () { multT = 1; }, 3000); } };
  mq.addEventListener('pointerdown', hold); mq.addEventListener('pointerup', release); mq.addEventListener('pointercancel', release);
  // keyboard: stop and bring the focused logo into view (the originals sit at the start of the track)
  mq.addEventListener('focusin', function (e) {
    multT = 0; mult = 0; var it = e.target.closest && e.target.closest('[role="listitem"]'); if (!it) return;
    x = -Math.max(0, Math.min(W - 1, it.offsetLeft + it.offsetWidth / 2 - mq.clientWidth / 2)); paint();
  });
  mq.addEventListener('focusout', function (e) { if (!mq.contains(e.relatedTarget)) multT = 1; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; seen ? start() : stop(); }).observe(mq);
  else { seen = true; start(); }
  d.addEventListener('visibilitychange', function () { d.hidden ? stop() : start(); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); ro.observe(mq); ro.observe(set); }
  fit();
})();

/* Follow Us: every Instagram post becomes a two-faced card, the image on the front and the caption on the back. It
   flips on hover (mouse), on a tap or click, on Enter/Space, or follows a drag and settles on a spring when let go;
   a quick flick carries it over. "Read more" opens the post itself. Reduced motion: the faces swap without turning. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') === 'off') return;
  var posts = [].slice.call(d.querySelectorAll('.crt-grid-post'));
  if (!posts.length) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var K = 230, C = 20, moving = [], raf = 0, last = 0;
  var show = function (s) { s.el.style.transform = 'rotateY(' + s.a.toFixed(2) + 'deg)'; };
  var step = function (t) {
    var dt = Math.min(0.032, last ? (t - last) / 1000 : 0.016); last = t;
    moving = moving.filter(function (s) {
      if (s.drag) return false;
      s.v += (K * (s.target - s.a) - C * s.v) * dt; s.a += s.v * dt;
      if (Math.abs(s.target - s.a) < 0.05 && Math.abs(s.v) < 0.5) { s.a = s.target; s.v = 0; show(s); return false; }
      show(s); return true;
    });
    if (moving.length) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
  };
  var go = function (s) {
    if (reduce) { s.a = s.target; s.v = 0; show(s); return; }
    if (moving.indexOf(s) < 0) moving.push(s);
    if (!raf) raf = requestAnimationFrame(step);
  };
  posts.forEach(function (post) {
    var inner = post.querySelector('.crt-post-c > div'), back = post.querySelector('.crt-post-hover');
    if (!inner || !back || back.parentNode !== inner) return;
    post.classList.add('wg-flip'); inner.classList.add('wg-flip-inner');
    var s = { el: inner, a: 0, v: 0, target: 0, drag: false };
    var face = function (f) { s.target = Math.round((s.a - f * 180) / 360) * 360 + f * 180; go(s); };
    var onBack = function () { return Math.abs((((s.target % 360) + 360) % 360) - 180) < 1; };
    var more = back.querySelector('.crt-post-read-more-button'), postLink = back.querySelector('.crt-post-date-link');
    if (more && postLink) more.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); window.open(postLink.href, '_blank', 'noopener'); });
    post.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !s.drag) face(1); });
    post.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !s.drag) face(0); });
    var pid = null, sx = 0, sa = 0, lx = 0, lt = 0, vx = 0, moved = false, swallow = false;
    inner.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('a, button')) return;
      pid = e.pointerId; sx = lx = e.clientX; lt = e.timeStamp; sa = s.a; vx = 0; moved = false;
    });
    inner.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      var dx = e.clientX - sx;
      if (!moved) { if (Math.abs(dx) < 6) return; moved = true; s.drag = true; post.classList.add('wg-dragging'); try { inner.setPointerCapture(pid); } catch (er) {} }
      var w = inner.getBoundingClientRect().width || 300, dt = (e.timeStamp - lt) / 1000;
      s.a = sa + dx / w * 180; s.v = 0; show(s);
      if (dt > 0) vx = 0.7 * vx + 0.3 * ((e.clientX - lx) / w * 180 / dt);
      lx = e.clientX; lt = e.timeStamp;
    });
    var end = function (e) {
      if (e.pointerId !== pid) return; pid = null;
      if (!moved) return;
      s.drag = false; post.classList.remove('wg-dragging'); swallow = true; setTimeout(function () { swallow = false; }, 0);
      s.target = Math.round((s.a + vx * 0.16) / 180) * 180; s.v = vx; go(s);
    };
    inner.addEventListener('pointerup', end); inner.addEventListener('pointercancel', end);
    post.addEventListener('click', function (e) {
      if (swallow) { swallow = false; e.preventDefault(); e.stopPropagation(); return; }
      if (e.target.closest('a, button')) return;
      face(onBack() ? 0 : 1);
    }, true);
    post.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a, button')) { e.preventDefault(); face(onBack() ? 0 : 1); } });
    post.addEventListener('focusin', function (e) { if (back.contains(e.target)) face(1); });
    post.addEventListener('focusout', function (e) { if (!post.contains(e.relatedTarget)) face(0); });
  });
})();

/* Cross-document view transitions: when the browser aborts one (e.g. a tap that navigates mid-animation on a phone),
   the transition's own promises reject with nobody listening, which shows up as an unhandled error. Listen, quietly. */
(function () {
  var quiet = function (e) { var vt = e && e.viewTransition; if (!vt) return; ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (vt[k] && vt[k].catch) vt[k].catch(function () {}); }); };
  addEventListener('pageswap', quiet); addEventListener('pagereveal', quiet);
})();

/* Daily deals (page speed, owner 2026-11-25): the banners are 8-frame animated GIFs, up to 1 MB each. Pages paint small
   still WebP stand-ins (their first frame); once the page has loaded, the banner on screen swaps to its animation, and so
   does each banner the visitor pages to. Reduced motion and Save-Data keep the stills. Runs with the replica too. */
(function () {
  'use strict';
  var d = document, figs = [].slice.call(d.querySelectorAll('#daily-deals figure'));
  if (!figs.length) return;
  // the inline script after the hero parked every slide but today's: give them their pictures back once the page has
  // loaded, or as soon as the visitor touches the hero (stills; the animation follows below)
  var restored = false, restore = function () {
    if (restored) return; restored = true;
    [].forEach.call(d.querySelectorAll('#daily-deals [data-wg-srcset], #daily-deals [data-wg-src]'), function (el) {
      var s = el.getAttribute('data-wg-srcset'), u = el.getAttribute('data-wg-src');
      if (s) { el.setAttribute('srcset', s); el.removeAttribute('data-wg-srcset'); }
      if (u) { el.setAttribute('src', u); el.removeAttribute('data-wg-src'); }
    });
  };
  var hero = d.getElementById('hero') || d.getElementById('daily-deals');
  if (hero) ['pointerdown', 'keydown', 'focusin'].forEach(function (t) { hero.addEventListener(t, restore, { once: true, passive: true }); });
  if (d.readyState === 'complete') setTimeout(restore, 300); else { addEventListener('load', function () { setTimeout(restore, 300); }); setTimeout(restore, 6000); }
  if ((window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (navigator.connection && navigator.connection.saveData)) return;
  var read = function (el) { try { return JSON.parse(el.getAttribute('data-wg-anim') || 'null'); } catch (e) { return null; } };
  var animate = function (fig) {
    if (fig.wgAnimated) return; fig.wgAnimated = true; restore();
    [].forEach.call(fig.querySelectorAll('[data-wg-anim]'), function (el) {
      var a = read(el); if (!a) return;
      if (a.srcset) el.srcset = a.srcset;
      if (a.src && el.tagName === 'IMG') el.src = a.src;
    });
  };
  var start = function () {
    if (!('IntersectionObserver' in window)) { figs.forEach(animate); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    figs.forEach(function (f) { io.observe(f); });
  };
  // after the visitor's first tap, scroll or key, or 6 s after load: the still is what loads the page, the animation follows
  var go = false, kick = function () { if (go) return; go = true; (window.requestIdleCallback || function (f) { f(); })(start); };
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (t) { addEventListener(t, kick, { once: true, passive: true }); });
  var later = function () { setTimeout(kick, 6000); };
  if (d.readyState === 'complete') later(); else addEventListener('load', later);
})();

/* Instagram (page speed): post pictures and video posters are fetched as the section approaches, not with the page. */
(function () {
  'use strict';
  var d = document, els = [].slice.call(d.querySelectorAll('[data-wg-bg], [data-wg-poster]'));
  if (!els.length) return;
  var read = function (el, k) { try { return JSON.parse(el.getAttribute(k) || 'null'); } catch (e) { return null; } };
  var show = function (el) {
    var bg = read(el, 'data-wg-bg'), po = read(el, 'data-wg-poster');
    if (bg && bg.src) el.style.backgroundImage = 'url("' + bg.src + '")';
    if (po && po.src) el.setAttribute('poster', po.src);
    el.removeAttribute('data-wg-bg'); el.removeAttribute('data-wg-poster');
  };
  if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: '800px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
