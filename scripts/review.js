/* review.js — a before/after switch for reviewing the rebuild. Hidden unless the page is opened with
   ?review=1 (remembered for the tab). "Original" = the exact replica (?fx=off), "Enhanced" = the
   premium layer. Not part of the site's experience; visitors never see it. */
(function () {
  'use strict';
  var on = false;
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('review') === '1') sessionStorage.setItem('wg_review', '1');
    if (q.get('review') === '0') sessionStorage.removeItem('wg_review');
    on = sessionStorage.getItem('wg_review') === '1';
  } catch (e) {}
  // ?openpicker=1 (review only): open the store picker once the page is up, to compare picker layouts
  try {
    if (new URLSearchParams(location.search).get('openpicker') === '1') {
      // scripts now run after the first painted frame, so the page may already have loaded
      var openIt = function () {
        setTimeout(function () {
          var t = [].slice.call(document.querySelectorAll('[data-store-trigger]')).filter(function (e) { return e.offsetParent !== null; })[0];
          if (t) t.click();
        }, 350);
      };
      if (document.readyState === 'complete') openIt(); else window.addEventListener('load', openIt);
    }
  } catch (e) {}
  if (!on) return;
  var fx = document.documentElement.getAttribute('data-fx') === 'off' ? 'off' : 'on';
  var bar = document.createElement('div');
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Review: compare original and enhanced');
  bar.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483000;display:flex;gap:4px;padding:4px;border-radius:999px;' +
    'background:rgba(11,33,26,.92);box-shadow:0 10px 30px -10px rgba(0,0,0,.5);font:700 11px/1 "Cera Pro",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase';
  function btn(label, val) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    var active = fx === val;
    b.setAttribute('aria-pressed', String(active));
    b.style.cssText = 'border:0;border-radius:999px;padding:9px 14px;cursor:pointer;' + (active ? 'background:#00c182;color:#0b211a' : 'background:transparent;color:#faf9f4');
    b.addEventListener('click', function () {
      if (active) return;
      var u = new URL(location.href); u.searchParams.set('fx', val); u.searchParams.delete('review');
      location.href = u.toString();
    });
    return b;
  }
  bar.appendChild(btn('Original', 'off'));
  bar.appendChild(btn('Enhanced', 'on'));
  (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener('DOMContentLoaded', r); })).then(function () { document.body.appendChild(bar); });
})();
