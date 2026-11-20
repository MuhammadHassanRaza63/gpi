/* Chart download button (RCTO + Grid modules).
   Adds a small download button to every card that holds a chart. Menu: PNG (high quality, 4x) or SVG (vector, never blurs).
   The whole card (title, chart, legend) is exported exactly as it looks on screen, in the current theme.
   Works on D3 (RCTO) and ApexCharts (Grid) cards; cards are found automatically, also after tabs / filters redraw them. */
(function () {
  'use strict';
  var NS_X = 'http://www.w3.org/1999/xhtml';
  var SKIP = '.dlbtn,.dlmenu,.tip,.apexcharts-tooltip,.apexcharts-xaxistooltip,.apexcharts-yaxistooltip,.apexcharts-toolbar,.apexcharts-menu,script,noscript,style';
  var SCALE = 4, MAX_SIDE = 16000, MAX_PIXELS = 90e6;

  var css = '.dlhost{position:relative}' +
    '.dlhost>h2,.dlhost>.head{padding-right:36px}' +
    '.dlbtn{position:absolute;top:10px;right:12px;z-index:5;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;cursor:pointer;padding:0;' +
    'color:var(--ink,var(--fg,#fff));background:var(--chip,rgba(255,255,255,.08));border:1px solid var(--chip-line,var(--line,rgba(255,255,255,.2)));opacity:.55;transition:opacity .15s,border-color .15s,background .15s}' +
    '.dlhost:hover .dlbtn,.dlbtn:focus-visible,.dlbtn[aria-expanded="true"]{opacity:1}' +
    '.dlbtn:hover{border-color:var(--lime,var(--accent,#B4F03C));background:var(--chip-hover,var(--chip))}' +
    '.dlbtn svg{width:15px;height:15px}' +
    '.dlmenu{position:absolute;top:42px;right:12px;z-index:6;min-width:170px;padding:5px;border-radius:12px;display:none;flex-direction:column;gap:2px;' +
    'background:var(--surface,#0B2016);border:1px solid var(--chip-line,var(--line,rgba(255,255,255,.2)));box-shadow:0 14px 34px -10px rgba(0,0,0,.6)}' +
    '.dlmenu.on{display:flex}' +
    '.dlmenu button{border:0;background:none;color:var(--ink,var(--fg,#fff));font:600 13px var(--font,system-ui);text-align:left;padding:8px 10px;border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;gap:12px}' +
    '.dlmenu button:hover,.dlmenu button:focus-visible{background:var(--chip-hover,rgba(180,240,60,.14))}' +
    '.dlmenu small{font:500 11.5px var(--font,system-ui);color:var(--muted,#8FA999)}' +
    '@media (hover:none){.dlbtn{opacity:1}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';

  function hasChart(card) {
    if (card.querySelector('.apexcharts-canvas')) return true;
    var s = card.querySelectorAll('svg'), i;
    for (i = 0; i < s.length; i++) { if (!s[i].closest('.dlbtn') && s[i].getBoundingClientRect().width >= 120) return true; }
    return false;
  }

  /* ---- build a self-contained, fully styled copy of a card ---- */
  function snapshot(card) {
    var w = card.offsetWidth, h = card.offsetHeight;
    var clone = card.cloneNode(true);
    clone.querySelectorAll(SKIP).forEach(function (n) { n.remove(); });
    inlineLive(card, clone);   /* copy the live computed styles onto the clone */
    var root = getComputedStyle(document.documentElement);
    var bg = (root.getPropertyValue('--surface') || '').trim() || '#0B2016';
    clone.style.cssText += ';position:static;margin:0;width:' + w + 'px;height:' + h + 'px;box-sizing:border-box;background:' + bg + ';animation:none;transition:none;backdrop-filter:none;-webkit-backdrop-filter:none;transform:none;opacity:1';
    var html = new XMLSerializer().serializeToString(clone);
    var xml = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject x="0" y="0" width="' + w + '" height="' + h + '">' + html + '</foreignObject></svg>';
    return { xml: xml, w: w, h: h };
  }
  /* parallel walk that skips nodes the clone no longer has */
  function inlineLive(src, dst) {
    var cs = getComputedStyle(src), out = '', i, n;
    for (i = 0; i < cs.length; i++) { n = cs[i]; out += n + ':' + cs.getPropertyValue(n) + ';'; }
    dst.setAttribute('style', out);
    var sc = Array.prototype.filter.call(src.children, function (e) { return !e.matches(SKIP); });
    for (i = 0; i < sc.length; i++) if (dst.children[i]) inlineLive(sc[i], dst.children[i]);
  }

  function fileName(card, ext) {
    var h2 = card.querySelector('h2'), t = (h2 && h2.firstChild ? h2.firstChild.textContent : '') || (h2 && h2.textContent) || 'chart';   /* title only, without the small badges */
    t = t.replace(/\s+/g, ' ').trim().replace(/[^\w\- ]+/g, '').trim().slice(0, 60).replace(/ /g, '_') || 'chart';
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return t + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '.' + ext;
  }
  function save(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function svgBlob(s) { return new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + s.xml], { type: 'image/svg+xml;charset=utf-8' }); }

  function exportSvg(card) { save(svgBlob(snapshot(card)), fileName(card, 'svg')); }
  function exportPng(card) {
    var s = snapshot(card);
    var k = Math.min(SCALE, MAX_SIDE / Math.max(s.w, s.h), Math.sqrt(MAX_PIXELS / (s.w * s.h)));
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = Math.round(s.w * k); c.height = Math.round(s.h * k);
        var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { if (b) save(b, fileName(card, 'png')); else save(svgBlob(s), fileName(card, 'svg')); }, 'image/png');
      } catch (e) { save(svgBlob(s), fileName(card, 'svg')); }   /* browser blocked canvas export: the vector file is still sharp */
    };
    img.onerror = function () { save(svgBlob(s), fileName(card, 'svg')); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.xml);
  }

  /* ---- UI ---- */
  function closeMenus() { document.querySelectorAll('.dlmenu.on').forEach(function (m) { m.classList.remove('on'); var b = m.previousElementSibling; if (b) b.setAttribute('aria-expanded', 'false'); }); }
  function addButton(card) {
    card.classList.add('dlhost');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dlbtn'; b.title = 'Download chart'; b.setAttribute('aria-label', 'Download chart'); b.setAttribute('aria-expanded', 'false'); b.innerHTML = ICON;
    var m = document.createElement('div'); m.className = 'dlmenu'; m.setAttribute('role', 'menu');
    m.innerHTML = '<button type="button" data-f="png" role="menuitem">PNG <small>high quality</small></button><button type="button" data-f="svg" role="menuitem">SVG <small>vector, no blur</small></button>';
    b.addEventListener('click', function (e) { e.stopPropagation(); var open = !m.classList.contains('on'); closeMenus(); m.classList.toggle('on', open); b.setAttribute('aria-expanded', String(open)); });
    m.addEventListener('click', function (e) {
      var t = e.target.closest('button[data-f]'); if (!t) return; e.stopPropagation(); closeMenus();
      if (t.dataset.f === 'png') exportPng(card); else exportSvg(card);
    });
    card.appendChild(b); card.appendChild(m);
  }
  function scan() {
    document.querySelectorAll('.card').forEach(function (c) {
      if (c.querySelector(':scope>.dlbtn')) { if (!hasChart(c)) { c.querySelectorAll(':scope>.dlbtn,:scope>.dlmenu').forEach(function (n) { n.remove(); }); c.classList.remove('dlhost'); } return; }
      if (c.offsetWidth && hasChart(c)) addButton(c);
    });
  }
  document.addEventListener('click', closeMenus);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenus(); });
  var t = null;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 250); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  window.addEventListener('load', function () { scan(); setTimeout(scan, 1500); });
  scan();
})();
