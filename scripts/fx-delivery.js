/* fx-delivery.js: compact delivery variants for owner review (?delivery=<variant>). No param: does nothing. */
/* Variants (home "San Diego, we deliver" section, EN + /es/; /delivery/ uses a different component):
     ?delivery=directory (alias a)  one-line directory rows, hairlines, three columns
     ?delivery=tiles     (alias b)  small tiles six-up, each hub opens with a green label tile
     ?delivery=boards    (alias c)  the two hubs side by side as boards of compact cells
   Presentation only: no text, link or node is added, removed or moved. The script tags the existing
   nodes with wg-dl-* classes (the CSS in fx-delivery.css does the rest) and takes over the scroll
   reveal of the area block (the tiles layout flattens the source grids, which the site's own reveal
   observes). `&jump=1` scrolls the section into view after load (also with ?delivery=current). */
(function () {
  'use strict';
  var html = document.documentElement;
  if (html.dataset.fx !== 'on') return;
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var NAMES = { a: 'directory', b: 'tiles', c: 'boards', directory: 'directory', tiles: 'tiles', boards: 'boards' };
  var raw = (q.get('delivery') || '').toLowerCase();
  var v = NAMES[raw] || '';
  var jump = q.get('jump') === '1';
  if (!v && !(raw === 'current' && jump)) return;

  /* the section: the one holding the area cards (the site's own a.rounded-xl.px-4.py-3 card in a grid) */
  var findSection = function () {
    var card = document.querySelector('main .grid > div > a.rounded-xl.px-4.py-3[href]');
    return card ? card.closest('section') : null;
  };
  var sec = findSection();
  if (!sec) return;

  var add = function (el, c) { if (el) el.classList.add(c); return el; };

  if (v) {
    html.dataset.delivery = v;
    if (!sec.id) sec.id = 'wg-dl-section';
    var grids = [];
    [].forEach.call(sec.querySelectorAll('a.rounded-xl.px-4.py-3[href]'), function (a) {
      var g = a.parentElement && a.parentElement.parentElement;
      if (g && grids.indexOf(g) < 0) grids.push(g);
    });
    var areas = grids.length && grids[0].parentElement && grids[0].parentElement.parentElement;
    if (areas) {
      add(areas, 'wg-dl-areas');
      var hubN = 0;
      [].forEach.call(areas.children, function (ch) {
        var g = null;
        for (var i = 0; i < grids.length; i++) if (ch.contains(grids[i])) g = grids[i];
        if (!g) { add(ch, 'wg-dl-head'); return; }
        hubN += 1;
        add(ch, 'wg-dl-hub'); add(ch, 'wg-dl-hub-' + hubN);
        if (ch.firstElementChild && ch.firstElementChild !== g) add(ch.firstElementChild, 'wg-dl-hubhead');
      });
      grids.forEach(function (g) {
        var n = g.children.length;
        add(g, 'wg-dl-grid');
        g.style.setProperty('--wg-dl-n', n);
        g.style.setProperty('--wg-dl-r2', Math.ceil(n / 2));
        g.style.setProperty('--wg-dl-r3', Math.ceil(n / 3));
        [].forEach.call(g.children, function (item) {
          add(item, 'wg-dl-item');
          var a = item.querySelector('a[href]'); if (!a) return;
          add(a, 'wg-dl-card');
          var body = a.firstElementChild, go = a.children[1];
          if (body && body.tagName === 'DIV') {
            add(body, 'wg-dl-body');
            var row = add(body.firstElementChild, 'wg-dl-namerow');
            if (row) { add(row.querySelector('span'), 'wg-dl-dot'); add(row.querySelector('p'), 'wg-dl-name'); }
            var zips = add(body.children[1], 'wg-dl-zips');
            /* five or more ZIPs (Carlsbad has six) always wrap in a cell: tag them so the CSS can give
               them a width that breaks after a "·" (3 + 3), never before one */
            if (zips && (zips.textContent.match(/·/g) || []).length >= 4) add(zips, 'wg-dl-zips-long');
          }
          if (go && go.tagName === 'P') add(go, 'wg-dl-go');
        });
      });

      /* reveal: the site (site.js .reveal-pending, ≥768px) and the premium layer (enhance.js .wg-stagger,
         phones, where site.js has already finished its reveals) both observe each source grid; the tiles
         layout gives those grids display:contents (no box, so they would never intersect and the cards
         would stay invisible). Finish both for the area block in every variant and run one light stagger
         of our own instead. */
      [].forEach.call(areas.querySelectorAll('.reveal-pending'), function (el) {
        el.classList.remove('reveal-pending', 'animate-fade-in-up', 'animate-blur-in');
        el.removeAttribute('style');
      });
      grids.forEach(function (g) { g.classList.remove('wg-stagger'); });
      var still = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || !('IntersectionObserver' in window);
      if (!still && areas.getBoundingClientRect().top > innerHeight) {
        [].forEach.call(areas.querySelectorAll('.wg-dl-head > div, .wg-dl-hubhead > div, .wg-dl-card'), function (el, i) {
          el.style.setProperty('--wg-dl-i', Math.min(i, 16));
        });
        sec.classList.add('wg-dl-pre');
        var io = new IntersectionObserver(function (es) {
          if (!es.some(function (e) { return e.isIntersecting; })) return;
          io.disconnect();
          sec.classList.add('wg-dl-in');
          setTimeout(function () { sec.classList.remove('wg-dl-pre', 'wg-dl-in'); }, 1600);
        }, { threshold: 0.04 });
        io.observe(areas);
      }
    }
  }

  if (jump) {
    var go = function () { var s = findSection(); if (s) s.scrollIntoView({ block: 'start', behavior: 'instant' }); };
    var settle = function () { go(); setTimeout(go, 450); };
    if (document.readyState === 'complete') settle(); else addEventListener('load', settle, { once: true });
  }
})();
