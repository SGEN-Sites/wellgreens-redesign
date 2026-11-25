/* fx-awards.js: award badges, 3D treatment + carousel options (?awards=<variant>).
   Home "California's Best." (ES "Lo mejor de California."): the five award badges.
   Always (premium layer on): the badges leave their boxes and become 3D objects: a still gloss, a light sweep
   masked to the shield (on arrival, on hover), a pointer tilt + glint (fine pointers), a mirror reflection and a
   contact shadow (fx-awards.css). The section's own nodes are tagged wg-aw-*; per badge two empty layers are added
   (aria-hidden; a third, the depth veil, in the carousels). No image, word, link or accessible name changes; nothing
   is removed or re-ordered.
   ?awards=coverflow | ring builds one of two carousel presentations on the same five nodes (no copies):
     coverflow: the front badge centred and larger, the others angled away on a glossy floor; arrows, swipe/drag,
                arrow keys, click a badge; slow autoplay (pauses on hover, keyboard focus, touch, pause button).
     ring:      the five badges on a slowly turning ring (a turntable); drag or flick to spin, arrows + keys,
                click a badge; the front badge is emphasised.
   ?awards=default (or none) keeps the row. &jump=1 scrolls the section into view after load.
   Reduced motion: no autoplay, spin or sweep; the still 3D look stays; arrows switch without animating. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  if (html.getAttribute('data-fx') === 'off') return;
  var mm = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
  var reduce = mm('(prefers-reduced-motion: reduce)');
  var fine = mm('(hover: hover) and (pointer: fine)');
  var ES = (html.getAttribute('lang') || '').toLowerCase().indexOf('es') === 0;   // the page's own lang tag (works under any base path)

  // the section: the region inside the section with the trophy kicker that holds the badge cards (EN + ES)
  var reg = null;
  [].some.call(d.querySelectorAll('main [role="region"]'), function (r) {
    var s = r.closest('section');
    if (!r.hasAttribute('aria-roledescription') && s && s.querySelector('.lucide-trophy') && r.querySelectorAll('.group img').length >= 3) reg = r;
    return !!reg;
  });
  if (!reg) return;
  var sec = reg.closest('section');
  var tag = function (el, c) { if (el && el.classList) el.classList.add(c); return el; };
  tag(sec, 'wg-aw-sec'); tag(reg, 'wg-aw-reg');

  var layer = function (b, cls) {
    var el = d.createElement('i'); el.className = cls; el.setAttribute('aria-hidden', 'true');
    b.card.appendChild(el); return el;   // its picture (--wg-aw-src) is set as the section approaches (page speed)
  };
  var badges = [].slice.call(reg.children).filter(function (it) { return it.querySelector('img'); }).map(function (item, i) {
    var img = item.querySelector('img'), card = img.parentElement, group = card.parentElement;
    tag(item, 'wg-aw-item'); tag(group, 'wg-aw-group'); tag(card, 'wg-aw-card'); tag(img, 'wg-aw-img');
    [].forEach.call(card.children, function (c) { if (c !== img && c.tagName === 'DIV' && !c.children.length) tag(c, 'wg-aw-corner'); });
    // empty decorative layers masked with the badge's own picture: light on top, the mirror under it
    var b = { i: i, item: item, group: group, card: card, img: img, t: 0, src: 'url("' + String(img.src).replace(/"/g, '%22') + '")' };
    b.shine = layer(b, 'wg-aw-shine'); b.mirror = layer(b, 'wg-aw-mirror');
    card.addEventListener('animationend', function (e) { if (e.animationName === 'wg-aw-sweep') card.classList.remove('wg-aw-sweep'); });
    return b;
  });
  var armed = false, arm = function () { if (armed) return; armed = true; badges.forEach(function (b) { b.shine.style.setProperty('--wg-aw-src', b.src); b.mirror.style.setProperty('--wg-aw-src', b.src); }); };
  if ('IntersectionObserver' in window) { var aio = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { arm(); aio.disconnect(); } }, { rootMargin: '800px 0px' }); aio.observe(sec || reg); } else arm();
  var n = badges.length;
  if (n < 2) return;

  /* ---------------------------------------------------------------- light sweep (never under reduced motion) */
  var sweep = function (b, delay) {
    var now = Date.now();
    if (reduce || !b || now - b.t < 2200) return;
    b.t = now + (delay || 0);
    b.card.classList.remove('wg-aw-sweep'); void b.card.offsetWidth;
    b.card.style.setProperty('--wg-aw-sd', (delay || 0) + 'ms');
    b.card.classList.add('wg-aw-sweep');
  };

  /* ---------------------------------------------------------------- pointer tilt + glint (fine pointers) */
  var tilt = function (b, host) {
    var rx = 0, ry = 0, z = 0, tx = 0, ty = 0, tz = 0, raf = 0;
    var put = function () {
      var s = b.card.style;
      s.setProperty('--wg-aw-rx', rx.toFixed(2) + 'deg'); s.setProperty('--wg-aw-ry', ry.toFixed(2) + 'deg'); s.setProperty('--wg-aw-z', z.toFixed(1) + 'px');
    };
    var frame = function () {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16; z += (tz - z) * 0.16;
      raf = Math.abs(tx - rx) + Math.abs(ty - ry) + Math.abs(tz - z) > 0.02 ? requestAnimationFrame(frame) : 0;
      if (!raf) { rx = tx; ry = ty; z = tz; }
      put();
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };
    b.rest = function () { b.card.classList.remove('wg-aw-hot'); tx = ty = tz = 0; kick(); };
    host.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || b.off) return;
      b.card.classList.add('wg-aw-hot'); tz = 12; kick(); sweep(b, 0);
    });
    host.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || b.off) return;
      var r = host.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      ty = (x - 0.5) * 22; tx = (0.5 - y) * 16; tz = 12;
      b.card.classList.add('wg-aw-hot');
      b.card.style.setProperty('--wg-aw-gx', x.toFixed(3)); b.card.style.setProperty('--wg-aw-gy', y.toFixed(3));
      kick();
    });
    host.addEventListener('pointerleave', b.rest);
  };

  var q; try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  // owner-locked default (2026-11-25): A · Coverflow; ?awards=default shows the plain 3D row, ?awards=ring the turntable
  var v = (q && q.get('awards')) || 'coverflow', jump = !!q && q.get('jump') === '1';
  var io = 'IntersectionObserver' in window;

  if (v !== 'coverflow' && v !== 'ring') {
    /* ---------------------------------------------------------------- default: the row as it is, each badge in 3D */
    if (fine && !reduce) badges.forEach(function (b) { tilt(b, b.group); });
    if (!reduce && io) {
      var batch = 0, bt = 0;
      var seen = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          seen.unobserve(en.target);
          var now = Date.now(); if (now - bt > 400) batch = 0; bt = now;
          for (var k = 0; k < n; k++) if (badges[k].item === en.target) sweep(badges[k], 420 + 150 * batch++);
        });
      }, { threshold: 0.7 });
      badges.forEach(function (b) { seen.observe(b.item); });
    }
  } else {
    carousel(v);
  }

  /* ==================================================================== carousels */
  function carousel(mode) {
    var RING = mode === 'ring';
    html.setAttribute('data-awards', mode);
    badges.forEach(function (b) {
      // the site's scroll reveal would animate the same transform: the stage places the badges itself
      b.item.classList.remove('reveal-pending'); b.item.style.animation = 'none';
      b.fog = layer(b, 'wg-aw-fog');
      b.item.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });

    /* controls (back, pause/play, forward): the arrows carry the site's own carousel words (site.js T.prev / T.next) */
    var L = ES ? { back: 'Imagen anterior', fwd: 'Imagen siguiente', pause: 'Pausar', play: 'Reproducir' }
      : { back: 'Previous image', fwd: 'Next image', pause: 'Pause', play: 'Play' };
    var svg = function (body, fill) {
      return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" ' + (fill ? 'fill="currentColor" stroke="none"' :
        'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"') + '>' + body + '</svg>';
    };
    var ICON = { back: svg('<path d="m15 18-6-6 6-6"/>'), fwd: svg('<path d="m9 18 6-6-6-6"/>'),
      pause: svg('<rect x="6.5" y="5" width="3.6" height="14" rx="1.2"></rect><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"></rect>', 1),
      play: svg('<path d="M8.2 5.6v12.8a.8.8 0 0 0 1.2.7l10-6.4a.8.8 0 0 0 0-1.4l-10-6.4a.8.8 0 0 0-1.2.7z"/>', 1) };
    var ctrl = d.createElement('div'); ctrl.className = 'wg-aw-ctrl';
    var button = function (k) {
      var bt = d.createElement('button'); bt.type = 'button'; bt.className = 'wg-aw-' + k;
      bt.setAttribute('aria-label', L[k]); bt.innerHTML = ICON[k]; ctrl.appendChild(bt); return bt;
    };
    var backB = button('back'), pauseB = reduce ? null : button('pause'), fwdB = button('fwd');
    reg.appendChild(ctrl);

    /* state: p = position in badges (continuous); badge i sits at offset wrap(i - p); forward is p + 1 */
    var p = 2 % n, from = p, to = p, t0 = 0, dur = 0, raf = 0, last = 0, vel = 0, hold = 0;
    var playing = !reduce, hover = false, focus = false, touch = false, inView = !io, drag = null, front = null, lit = null;
    var K = {};
    var wrap = function (o) { o = ((o % n) + n) % n; return o >= n / 2 ? o - n : o; };
    var ease = function (k) { return 1 - Math.pow(1 - k, 4); };
    var canPlay = function () { return playing && inView && !d.hidden && !hover && !focus && !touch && !drag; };

    var measure = function () {
      var w = badges[0].item.offsetWidth || 200, S = reg.clientWidth || 360;
      // where the shields' tips land on screen (CSS perspective on the stage), for the floor / turntable
      var cs = getComputedStyle(reg), P = parseFloat(cs.perspective) || 1000, oy = parseFloat(String(cs.perspectiveOrigin).split(' ')[1]) || 0;
      var tip = badges[0].item.offsetTop + w * 1.5 * 0.949;
      var proj = function (y, z) { return oy + (y - oy) * P / (P - z); };
      var set = function (k, val) { reg.style.setProperty(k, val.toFixed(1) + 'px'); };
      K.w = w;
      if (RING) {
        K.rx = Math.min(S * (S < 640 ? 0.4 : 0.36), w * 2.2); K.rz = w * (S < 640 ? 1.8 : 1.5); K.rot = 28;
        K.unit = K.rx * Math.sin(2 * Math.PI / n);   // px of drag per badge
        var yf = proj(tip, 0), yb = proj(tip, -2 * K.rz);
        set('--wg-aw-disc-y', (yf + yb) / 2 - w * 0.02); set('--wg-aw-disc-h', yf - yb + w * 0.34);
        set('--wg-aw-disc-w', 2 * (K.rx * P / (P + K.rz)) + w * 1.25);
      } else {
        var spread = Math.max(1, Math.min(1.5, S / (w * 4.6)));
        K.x1 = w * 0.92 * spread; K.x2 = w * (0.62 + 0.3 * (spread - 1)) * spread; K.z1 = w * 0.85; K.z2 = w * 0.5; K.zf = 0; K.rot = 48;
        K.unit = K.x1;
        set('--wg-aw-floor-y', proj(tip, 0));
      }
      render();
    };

    var render = function () {
      var best = null, bestA = 99;
      badges.forEach(function (b, i) {
        var o = wrap(i - p), a = Math.abs(o), tr, fog, z;
        if (RING) {
          var ang = o * 2 * Math.PI / n, c = Math.cos(ang), t = (c + 1) / 2;
          tr = 'translate3d(' + (K.rx * Math.sin(ang)).toFixed(1) + 'px,0,' + (K.rz * (c - 1)).toFixed(1) + 'px) rotateY(' + (K.rot * Math.sin(ang)).toFixed(2) + 'deg)';
          fog = (1 - t) * 0.7; z = Math.round(t * 100) + 1;
        } else {
          var s = o < 0 ? -1 : 1, a1 = Math.min(a, 1), a2 = Math.max(0, a - 1);
          var x = s * (a1 * K.x1 + a2 * K.x2), zz = K.zf * (1 - a1) - a1 * K.z1 - a2 * K.z2, ry = -s * a1 * K.rot;
          tr = 'translate3d(' + x.toFixed(1) + 'px,0,' + zz.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
          fog = Math.min(1, a1 * 0.62 + a2 * 0.5); z = 100 - Math.round(a * 20);
          var op = Math.max(0, Math.min(1, (n / 2 - a) / 0.42));
          b.item.style.opacity = op < 1 ? op.toFixed(3) : '';
          if ((s > 0) !== b.fog.classList.contains('wg-aw-r')) b.fog.classList.toggle('wg-aw-r');
        }
        b.item.style.transform = tr; b.item.style.zIndex = String(z);
        b.fog.style.opacity = fog.toFixed(3);
        if (a < bestA) { bestA = a; best = b; }
        // the ring's slow turn: each badge catches the light once as it passes the front
        if (RING && inView && vel > 0.01 && a < 0.04 && lit !== b) { lit = b; sweep(b, 0); }
      });
      if (best !== front) {
        if (front) { front.item.classList.remove('wg-aw-front'); front.off = true; if (front.rest) front.rest(); }
        front = best; front.item.classList.add('wg-aw-front'); front.off = false;
        reg.setAttribute('data-wg-aw-front', String(front.i));
      }
    };

    // one rAF chain at a time: raf stays set while a frame runs, so a tween started inside it does not start a second one
    var loop = function (now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      if (drag) { /* p follows the pointer (pointermove) */ }
      else if (dur) {
        var k = Math.min(1, (now - t0) / dur); p = from + (to - from) * ease(k);
        if (k >= 1) { dur = 0; p = to; settled(); }
      } else if (RING) {
        var want = canPlay() && Date.now() >= hold ? 0.125 : 0;   // 8 s per badge, 40 s a turn
        vel += (want - vel) * (1 - Math.exp(-dt * (want ? 1.2 : 2.6)));
        p += vel * dt;
        // stopping (hover, focus, pause, hold): ease the nearest badge to the front, then rest
        if (!want && Math.abs(vel) < 0.06) { vel = 0; if (Math.abs(p - Math.round(p)) > 0.001) tween(Math.round(p), 700); else p = Math.round(p); }
      }
      render();
      raf = 0;
      if ((drag || dur || (RING && (vel || canPlay()))) && inView && !d.hidden) raf = requestAnimationFrame(loop);
      else last = 0;
    };
    var kick = function () { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
    var tween = function (target, ms) {
      if (reduce || !ms) { p = to = target; dur = 0; render(); settled(); return; }
      from = p; to = target; t0 = performance.now(); dur = Math.max(1, ms * Math.min(1.6, 0.55 + 0.45 * Math.abs(target - p))); kick();
    };
    // a badge that has just come to the front catches the light (once per arrival)
    var settled = function () { if (front && inView && lit !== front) { lit = front; sweep(front, 60); } };

    var go = function (k) { hold = Date.now() + (RING ? 2600 : 6000); vel = 0; tween(Math.round(dur ? to : p) + k, RING ? 900 : 720); };
    var goTo = function (i) { var base = Math.round(dur ? to : p); go(wrap(i - base)); };

    backB.addEventListener('click', function () { go(-1); });
    fwdB.addEventListener('click', function () { go(1); });
    if (pauseB) pauseB.addEventListener('click', function () {
      playing = !playing;
      pauseB.setAttribute('aria-label', playing ? L.pause : L.play); pauseB.innerHTML = playing ? ICON.pause : ICON.play;
      hold = 0; schedule(); kick();
    });
    reg.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); go(k === 'ArrowRight' ? 1 : -1); }
      else if (k === 'Home' || k === 'End') { e.preventDefault(); goTo(k === 'Home' ? 0 : n - 1); }
    });

    /* pause on hover, keyboard focus and touch */
    reg.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; kick(); } });
    reg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; schedule(); kick(); } });
    reg.addEventListener('focusin', function (e) {
      var kb = true; try { kb = e.target.matches(':focus-visible'); } catch (x) { /* older engines: any focus pauses */ }
      if (kb) { focus = true; kick(); }
    });
    reg.addEventListener('focusout', function (e) { if (!reg.contains(e.relatedTarget)) { focus = false; schedule(); kick(); } });

    /* drag / swipe / flick; a click on a side badge brings it to the front */
    var moved = false;
    reg.addEventListener('pointerdown', function (e) {
      if (e.button || ctrl.contains(e.target)) return;
      if (e.pointerType !== 'mouse') touch = true;
      drag = null; moved = false;
      var x0 = e.clientX, y0 = e.clientY, p0 = p, id = e.pointerId, hist = [[performance.now(), e.clientX]];
      var onMove = function (ev) {
        if (ev.pointerId !== id) return;
        var dx = ev.clientX - x0;
        if (!drag) {
          if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(ev.clientY - y0)) return;
          drag = { id: id }; moved = true; dur = 0; vel = 0; p0 = p + dx / K.unit;
          try { reg.setPointerCapture(id); } catch (x) { /* not capturable */ }
          reg.classList.add('wg-aw-drag');
        }
        p = p0 - dx / K.unit;
        hist.push([performance.now(), ev.clientX]); if (hist.length > 6) hist.shift();
        kick();
      };
      var onUp = function (ev) {
        if (ev.pointerId !== id) return;
        reg.removeEventListener('pointermove', onMove); reg.removeEventListener('pointerup', onUp); reg.removeEventListener('pointercancel', onUp);
        touch = false; reg.classList.remove('wg-aw-drag');
        if (!drag) { schedule(); return; }
        drag = null;
        var h0 = hist[0], h1 = hist[hist.length - 1], span = Math.max(16, h1[0] - h0[0]);
        var v = -((h1[1] - h0[1]) / span) * 1000 / K.unit;            // badges per second
        hold = Date.now() + (RING ? 2600 : 6000);
        if (RING && !reduce && Math.abs(v) > 0.4) { vel = Math.max(-6, Math.min(6, v)); kick(); }
        else tween(Math.round(p + Math.max(-1.5, Math.min(1.5, v * 0.22))), RING ? 800 : 620);
        schedule();
      };
      reg.addEventListener('pointermove', onMove); reg.addEventListener('pointerup', onUp); reg.addEventListener('pointercancel', onUp);
    });
    reg.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
      if (ctrl.contains(e.target)) return;
      for (var i = 0; i < n; i++) if (badges[i].item.contains(e.target) && badges[i] !== front) { goTo(i); return; }
    }, true);

    /* coverflow autoplay: one step every 4.2 s while allowed */
    var timer = 0;
    var schedule = function () {
      if (RING) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (canPlay() && Date.now() >= hold && !dur) tween(Math.round(p) + 1, 720);
        schedule();
      }, Math.max(4200, hold - Date.now()));
    };

    if (fine && !reduce && !RING) badges.forEach(function (b) { b.off = true; tilt(b, b.item); });
    if (io) {
      var first = true;
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && first) {
          first = false;
          if (RING && !reduce) { p = 2 - 0.9; tween(2, 1800); } else setTimeout(settled, 450);
        }
        schedule(); kick();
      }, { threshold: 0.3 }).observe(reg);
    }
    d.addEventListener('visibilitychange', function () { schedule(); kick(); });
    if (window.ResizeObserver) new ResizeObserver(measure).observe(reg); else addEventListener('resize', measure);
    measure(); schedule();
  }

  if (jump) {
    var goSec = function () { sec.scrollIntoView({ block: 'start' }); };
    var land = function () { goSec(); setTimeout(goSec, 650); setTimeout(goSec, 1500); };
    if (d.readyState === 'complete') land(); else addEventListener('load', land);
  }
})();
