/* Shared KPI cards for every RCTO Central dashboard (same look as the Grid Excellence cards).
   Card = small label, big number (+ unit), delta / context line, then a sparkline or a progress bar.

   KPI.render(list)  ->  fills #hero-kpis
   KPI.html(list)    ->  returns the markup

   Each item of `list`:
     l      label (shown in small caps on top)
     v      the big number (already formatted)        unit  small unit after the number ("%", "h", "×")
     c      accent colour (any CSS colour)
     s      context line, HTML allowed (e.g. "Jan–Oct 2026")
     d      delta from KPI.delta(...)  -> coloured "▲ 4.2% vs Sep" in front of the context line
     spark  array of numbers, drawn as a smooth area sparkline (nulls are skipped, long series are averaged down)
     lab    labels for the spark points (e.g. month names); hovering the card's line then shows the exact value of that month      u  unit for those values ("%")      bu  suffix when a long series is averaged (" / day")
     bar    0-100, draws a progress bar instead (optional tick: target position, 0-100)
     meter  -1..1, correlation meter (the old r-scale)                                                       */
(function () {
  'use strict';
  const PALETTE = ['#B4F03C', '#14B870', '#2F6BFF', '#FF9A1F', '#F0147F', '#7B61FF'];
  let uid = 0;

  /* keep real points only; a long series (daily) is averaged into `max` buckets, each bucket keeps its first-last label */
  function clean(pairs, max) {
    if (pairs.length <= max) return { v: pairs.map(p => p[0]), l: pairs.map(p => p[1]), bucket: false };
    const v = [], l = [], step = pairs.length / max;
    for (let i = 0; i < max; i++) {
      const part = pairs.slice(Math.round(i * step), Math.max(Math.round((i + 1) * step), Math.round(i * step) + 1));
      v.push(part.reduce((x, y) => x + y[0], 0) / part.length);
      const f = part[0][1], t = part[part.length - 1][1];
      l.push(f == null ? null : f === t ? f : `${f} – ${t}`);
    }
    return { v, l, bucket: true };
  }

  /* smooth line through the points (Catmull-Rom -> cubic bezier), control points kept inside the chart box */
  function smooth(p, top, bot) {
    const clamp = y => Math.min(bot, Math.max(top, y));
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${clamp(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${clamp(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
    }
    return d;
  }

  const num = (v, u) => (Number.isInteger(v) ? v.toLocaleString('en-US') : (+v).toFixed(2).replace(/0$/, '')) + (u || '');
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  /* sparkline + hover data: every point carries its x/y (chart box %), label and exact value text, read by the hover handler below */
  function spark(raw, lab, unit, bu, name) {
    const pairs = (raw || []).map((v, i) => [v, lab ? lab[i] : null]).filter(p => p[0] != null && isFinite(p[0]));
    const c = clean(pairs, 36), a = c.v;
    if (a.length < 2) return '';
    const W = 200, H = 56, X0 = 6, X1 = 192, top = 8, bot = 46;
    const mn = Math.min(...a), mx = Math.max(...a), span = mx - mn;
    const p = a.map((v, i) => [X0 + i * (X1 - X0) / (a.length - 1), span ? bot - (v - mn) / span * (bot - top) : (top + bot) / 2]);
    const line = smooth(p, top, bot), id = 'kg' + (++uid), last = p[p.length - 1];
    const pts = p.map((q, i) => [+(q[0] / W * 100).toFixed(2), +(q[1] / H * 100).toFixed(2), c.l[i] || '', num(a[i], c.bucket ? (bu || ' avg') : unit)]);
    return `<div class="spk" data-n="${esc(name || '')}" data-p="${esc(JSON.stringify(pts))}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".34"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <path class="ar" d="${line} L${last[0].toFixed(1)},${H} L${p[0][0].toFixed(1)},${H} Z" fill="url(#${id})"/>
      <path class="ln" d="${line}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
      <i class="dot" style="left:${pts[pts.length - 1][0]}%;top:${pts[pts.length - 1][1]}%"></i>
      <i class="hl"></i><i class="hd"></i></div>`;
  }

  /* hover / touch: guide line + ring on the nearest point, floating tooltip with the exact number (one handler for every card) */
  let tip = null, cur = null;
  const tipEl = () => tip || (tip = Object.assign(document.body.appendChild(document.createElement('div')), { className: 'ktip' }));
  function hoverOff() { if (cur) { cur.classList.remove('hv'); cur = null; } if (tip) tip.classList.remove('on'); }
  function hover(e) {
    const sp = e.target.closest && e.target.closest('.kpi .spk');
    if (!sp) { hoverOff(); return; }
    let pts; try { pts = sp._pts || (sp._pts = JSON.parse(sp.dataset.p)); } catch (x) { return; }
    const r = sp.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * 100;
    let k = 0; pts.forEach((q, i) => { if (Math.abs(q[0] - fx) < Math.abs(pts[k][0] - fx)) k = i; });
    const q = pts[k];
    if (cur && cur !== sp) cur.classList.remove('hv');
    cur = sp; sp.classList.add('hv');
    sp.style.setProperty('--hx', q[0] + '%'); sp.style.setProperty('--hy', q[1] + '%');
    const t = tipEl(), c = getComputedStyle(sp).color;
    t.innerHTML = `<span class="kn">${esc(sp.dataset.n)}</span><span class="kv"><i style="background:${c}"></i><b>${esc(q[3])}</b>${q[2] ? `<em>${esc(q[2])}</em>` : ''}</span>`;
    t.classList.add('on');
    const px = r.left + r.width * q[0] / 100, py = r.top + r.height * q[1] / 100, tw = t.offsetWidth, th = t.offsetHeight;
    t.style.left = Math.max(8, Math.min(innerWidth - tw - 8, px - tw / 2)) + 'px';
    t.style.top = Math.max(8, py - th - 14) + 'px';
  }
  document.addEventListener('pointermove', hover, { passive: true });
  document.addEventListener('pointerdown', hover, { passive: true });
  document.addEventListener('pointerleave', hoverOff);
  window.addEventListener('scroll', hoverOff, { passive: true });

  const clampPct = v => Math.max(0, Math.min(100, v));
  const prog = (v, tick) => `<div class="prog"><i style="width:${clampPct(v).toFixed(1)}%"></i>${tick != null ? `<b style="left:${clampPct(tick).toFixed(1)}%"></b>` : ''}</div>`;
  const meter = r => `<div class="prog meter"><b style="left:50%"></b><i class="mk" style="left:${((r + 1) / 2 * 100).toFixed(1)}%"></i></div>`;

  /* delta between two numbers -> { t, dir, tone }.  opts: good 'up' (default) | 'down' | null, unit '%' | ' pp' | '', pct true = show relative change in %, dp decimals, vs 'Sep' */
  function delta(cur, prev, o) {
    o = o || {};
    if (cur == null || prev == null || !isFinite(cur) || !isFinite(prev)) return null;
    const dp = o.dp != null ? o.dp : 1;
    const diff = o.pct ? (prev ? 100 * (cur - prev) / Math.abs(prev) : null) : cur - prev;
    if (diff == null) return null;
    const flat = Math.abs(diff) < Math.pow(10, -dp) / 2, dir = flat ? '' : diff > 0 ? 'up' : 'down';
    const unit = o.unit != null ? o.unit : (o.pct ? '%' : '');
    const good = o.good === undefined ? 'up' : o.good;
    const tone = flat || good == null ? '' : (dir === good ? 'good' : 'bad');
    return { dir, tone, t: `${flat ? '' : diff > 0 ? '▲' : '▼'} ${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff).toFixed(dp)}${unit}${o.vs ? ' vs ' + o.vs : ''}`.trim() };
  }

  function card(k, i) {
    const c = k.c || PALETTE[i % PALETTE.length];
    const viz = k.meter != null ? meter(k.meter) : k.bar != null ? prog(k.bar, k.tick) : k.spark ? spark(k.spark, k.lab, k.u, k.bu, k.l) : '';
    const sub = (k.d ? `<span class="dx ${k.d.tone}">${k.d.t}</span>` : '') + (k.s ? `<span class="sx">${k.s}</span>` : '');
    return `<div class="kpi${viz ? '' : ' plain'}" style="--c:${c};--i:${i}">
      <div class="l">${k.l}</div>
      <div class="v">${k.v}${k.unit ? `<small>${k.unit}</small>` : ''}</div>
      ${sub ? `<div class="s">${sub}</div>` : ''}${viz}</div>`;
  }

  const html = list => list.map(card).join('');
  function render(list) {
    const host = document.getElementById('hero-kpis');
    if (host) host.innerHTML = html(list);
  }
  window.KPI = { render, html, delta, PALETTE };
})();