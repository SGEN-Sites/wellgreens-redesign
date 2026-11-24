/* fx-stores.js: compact stores variants for owner review (?stores=<variant>). No param: does nothing.
   Home section "10 Stores Across SD" (ES "10 tiendas Por todo SD"). ?stores=split|strip|grid tags the
   section's own nodes with wg-st-* classes and sets html[data-stores]; fx-stores.css does all the layout.
   No node is created, removed, moved or re-worded, so every word, link, image and accessible name stays.
   site.js keeps driving the card rail: it adds its arrows and page dots only while the row scrolls.
   &jump=1 scrolls the section into view after load (also with ?stores=current, which changes nothing else). */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') !== 'on') return;
  var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var v = q.get('stores'), jump = q.get('jump') === '1';
  var on = v === 'split' || v === 'strip' || v === 'grid';
  if (!on && !(jump && v === 'current')) return;

  // the only home section holding both the static store map and a card rail
  var sec = null, all = d.querySelectorAll('main section');
  for (var i = 0; i < all.length && !sec; i++) {
    if (all[i].querySelector('[data-wg-map]') && all[i].querySelector('[role="region"][aria-roledescription="carousel"]')) sec = all[i];
  }
  if (!sec) return;
  var tag = function (el, c) { if (el && el.classList) el.classList.add(c); return el; };

  if (on) {
    var rail = sec.querySelector('[role="region"][aria-roledescription="carousel"]');
    var frame = sec.querySelector('[data-wg-map]').parentElement;
    tag(sec, 'wg-st-sec');
    tag(sec.firstElementChild, 'wg-st-wrap');
    var head = tag(sec.querySelector('.section-head'), 'wg-st-head');
    if (head) { tag(head.children[0], 'wg-st-title'); tag(head.children[1], 'wg-st-intro'); }
    tag(frame, 'wg-st-map');
    tag(frame.parentElement, 'wg-st-mapblock');
    tag(rail, 'wg-st-rail');
    var group = tag(rail.parentElement, 'wg-st-group');
    if (group) tag(group.parentElement, 'wg-st-stores');
    [].forEach.call(rail.children, function (item) {
      tag(item, 'wg-st-item');
      var card = tag(item.firstElementChild, 'wg-st-card'); if (!card) return;
      tag(card.querySelector(':scope > a[href]'), 'wg-st-link');
      var img = card.querySelector('img'), photo = tag(img && img.parentElement, 'wg-st-photo');
      if (photo) tag(photo.querySelector(':scope > div'), 'wg-st-shade');
      tag(card.querySelector(':scope > .pointer-events-none'), 'wg-st-sheen');
      var text = tag(card.lastElementChild, 'wg-st-text'); if (!text) return;
      var ps = text.querySelectorAll('p');
      tag(ps[0], 'wg-st-name'); tag(ps[1], 'wg-st-city');
      tag(text.lastElementChild, 'wg-st-go');
      tag(text.querySelector('svg'), 'wg-st-arrow');
    });
    html.setAttribute('data-stores', v);
    // site.js recounts the rail's pages on its scroll/resize; a new layout can change the count without either
    var recount = function () { rail.dispatchEvent(new Event('scroll')); };
    requestAnimationFrame(function () { requestAnimationFrame(recount); });
    addEventListener('load', recount);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(recount);
  }

  if (jump) {
    var go = function () { sec.scrollIntoView({ block: 'start' }); };
    var land = function () { go(); setTimeout(go, 650); setTimeout(go, 1500); };
    if (d.readyState === 'complete') land(); else addEventListener('load', land);
  }
})();
