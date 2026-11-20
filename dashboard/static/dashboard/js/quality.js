/* RCTO Central · CPM / CRR / CRS / L-3 TAT dashboards (ApexCharts). Exposes window.AK (shared helpers, also used by analysis.js).
   Every heading is a plain-English headline built from the data, so each chart explains itself. */
(function () {
  'use strict';
  const FONT = 'Calibri, Carlito, "Segoe UI", sans-serif';
  const C = { cov: '#F0147F', data: '#FF9A1F', call: '#7B61FF', good: '#14B870', warn: '#FFB020', bad: '#F0147F', blue: '#2F6BFF', teal: '#00B8A9' };
  const CATC = [C.cov, C.data, C.call];
  const Y = '#FFC400';                                          /* yellow line: readable on dark and light theme */
  const dark = () => document.documentElement.getAttribute('data-theme') !== 'light';
  const yl = () => (dark() ? '#FFD84D' : '#8A5E00');            /* yellow label text per theme */
  const bl = () => (dark() ? '#7DB2FF' : '#1E4FD8');
  const SEQ = { pink: { d: ['#3B2A4A', '#7A2A68', '#B3237F', '#E0188A', '#FF5FAE'], l: ['#FDE4F0', '#F9B3D6', '#F378B5', '#E0368F', '#A80E66'] },
    orange: { d: ['#3A2F1A', '#6E4A14', '#A8660F', '#E08A12', '#FFB62E'], l: ['#FFF1D6', '#FFD89A', '#FFB54D', '#F08A00', '#B35C00'] },
    blue: { d: ['#1B3358', '#25508F', '#2F6BFF', '#5E92FF', '#9DBBFF'], l: ['#E3ECFF', '#B7CCFF', '#7FA3FF', '#3F72F0', '#1F46B3'] } };
  const fmt = n => (n == null ? '–' : Math.round(n).toLocaleString('en-US'));
  const pc = (n, d = 1) => (n == null ? '–' : (+n).toFixed(d) + '%');
  const sum = a => a.reduce((s, v) => s + (v || 0), 0);
  const argmax = a => a.indexOf(Math.max(...a));
  const argmin = a => { let k = -1; a.forEach((v, i) => { if (v != null && (k < 0 || v < a[k])) k = i; }); return k; };
  const css = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const tok = () => ({ ink: css('--ink-2') || '#C2D3C7', ink1: css('--ink') || '#fff', muted: css('--muted') || '#8FA999', grid: css('--grid') || 'rgba(255,255,255,.08)',
    mode: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark', card: css('--card') });
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const merge = (a, b) => { const o = Object.assign({}, a); for (const k in b) o[k] = isObj(b[k]) && isObj(a[k]) ? merge(a[k], b[k]) : b[k]; return o; };
  const vals = () => window.__vals !== false;
  const teamCol = () => (window.THEME && THEME.teams) || ['#2F6BFF', '#00B8A9', '#FFB020', '#8B5CF6', '#F0558A', '#64748B'];

  let live = [];
  function destroy() { live.forEach(c => { try { c.destroy(); } catch (e) {} }); live = []; }
  function base(o) {
    const t = tok();
    return merge({
      chart: { fontFamily: FONT, foreground: t.ink, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, animations: { speed: 450 } },
      theme: { mode: t.mode }, grid: { borderColor: t.grid, strokeDashArray: 3 }, dataLabels: { enabled: false }, stroke: { width: 2, curve: 'smooth' },
      xaxis: { labels: { style: { colors: t.ink, fontSize: '12.5px' } }, axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
      yaxis: { labels: { style: { colors: t.muted, fontSize: '12px' } } },
      legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', labels: { colors: t.ink }, markers: { radius: 12 }, itemMargin: { horizontal: 10 } },
      tooltip: { theme: t.mode }, plotOptions: {},
    }, o);
  }
  function draw(id, o) {
    const el = document.getElementById(id);
    if (!el) return null;
    const c = new ApexCharts(el, base(o)); c.render(); live.push(c); return c;
  }
  const ax = (o = {}) => merge({ labels: { style: { colors: tok().muted, fontSize: '12px' }, formatter: v => (v == null ? '' : Math.round(v).toLocaleString('en-US')) } }, o);

  /* ---------- card + layout builders ---------- */
  const card = (span, id, h, why, badge, h2) => `<article class="card c${span}"><div class="head"><div><h2>${h}</h2><p class="why">${why || ''}</p></div>${badge ? `<span class="badge ${badge[1] || ''}">${badge[0]}</span>` : ''}</div><div class="chart" id="${id}"></div></article>`;
  const row = cards => `<section class="grid">${cards.join('')}</section>`;
  const sec = (t, s) => `<div class="secbar"><h3>${t}</h3>${s ? `<span>${s}</span>` : ''}</div>`;
  function kpis(list) {
    KPI.render(list);                                             // card markup lives in js/kpi.js
    const s = document.getElementById('story'); if (s) s.innerHTML = '';
  }

  /* ---------- chart recipes ---------- */
  const stackCols = (id, cats, series, o = {}) => draw(id, merge({
    chart: { type: 'bar', height: o.h || 320, stacked: true }, series, colors: series.map(s => s.color), xaxis: { categories: cats },
    yaxis: ax(), plotOptions: { bar: { columnWidth: '58%', borderRadius: 4, borderRadiusApplication: 'end' } }, dataLabels: { enabled: vals() && !o.noLabels, style: { fontSize: '11px', colors: ['#fff'] }, formatter: v => (v ? fmt(v) : '') },
  }, o.x || {}));
  const hbar = (id, items, color, o = {}) => draw(id, merge({
    chart: { type: 'bar', height: o.h || Math.max(220, items.length * 34 + 40) }, series: [{ name: o.name || 'Complaints', data: items.map(i => i[1]) }], colors: Array.isArray(color) ? color : [color],
    plotOptions: { bar: { horizontal: true, barHeight: '66%', borderRadius: 5, distributed: Array.isArray(color) } }, legend: { show: false },
    xaxis: { categories: items.map(i => i[0]), labels: { style: { colors: tok().muted }, formatter: v => (o.f ? o.f(v) : fmt(v)) }, min: o.min, max: o.max }, yaxis: { labels: { style: { colors: tok().ink, fontSize: '12.5px' }, maxWidth: 190 } },
    dataLabels: { enabled: vals(), formatter: v => (o.f ? o.f(v) : fmt(v)), style: { fontSize: '12px', fontWeight: 700 }, textAnchor: 'start', offsetX: 6, background: { enabled: false } }, grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
  }, o.x || {}));
  const donut = (id, obj, colors, o = {}) => draw(id, merge({
    chart: { type: 'donut', height: o.h || 300 }, series: Object.values(obj), labels: Object.keys(obj), colors, stroke: { width: 2, colors: [tok().mode === 'dark' ? '#0B2016' : '#fff'] },
    plotOptions: { pie: { donut: { size: '66%', labels: { show: true, total: { show: true, label: o.tl || 'Total', color: tok().ink, fontSize: '13px', formatter: w => fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) }, value: { color: tok().ink1, fontSize: '26px', fontWeight: 800, formatter: v => fmt(+v) } } } } },
    legend: { position: 'bottom' }, dataLabels: { enabled: vals(), formatter: v => Math.round(v) + '%', dropShadow: { enabled: false } },
  }, o.x || {}));
  const radial = (id, v, color, label, o = {}) => draw(id, merge({
    chart: { type: 'radialBar', height: o.h || 300 }, series: [v], colors: [color], labels: [label],
    plotOptions: { radialBar: { hollow: { size: '62%' }, track: { background: tok().grid }, startAngle: -120, endAngle: 120, dataLabels: { name: { color: tok().muted, fontSize: '13px', offsetY: 24 }, value: { color: tok().ink1, fontSize: '34px', fontWeight: 800, offsetY: -16, formatter: x => (+x).toFixed(1) + '%' } } } },
    stroke: { lineCap: 'round' },
  }, o.x || {}));
  function seqRanges(M, pal) {
    const mx = Math.max(1, ...M.flat().filter(v => v != null)), P = SEQ[pal][dark() ? 'd' : 'l'], n = P.length;
    return P.map((c, i) => { const f = i ? mx * i / n + 1e-6 : 0, t = mx * (i + 1) / n + (i === n - 1 ? 1 : 0); return { from: f, to: t, color: c, name: fmt(f) + '–' + fmt(Math.min(t, mx)) }; });
  }
  const heat = (id, rows, cols, M, o = {}) => {
    const rg = o.ranges || (o.seq ? seqRanges(M, o.seq) : null), mx = Math.max(1, ...M.flat().filter(v => v != null));
    return draw(id, merge({
      chart: { type: 'heatmap', height: o.h || rows.length * 46 + 70 }, series: rows.map((r, i) => ({ name: r, data: cols.map((c, j) => ({ x: c, y: M[i][j] })) })),
      plotOptions: { heatmap: { radius: 6, enableShades: !rg, shadeIntensity: .65, colorScale: rg ? { ranges: rg } : undefined } }, colors: [o.color || C.blue],
      dataLabels: { enabled: o.labels !== false, formatter: v => (v == null ? '' : (o.f ? o.f(v) : fmt(v))), style: { fontSize: '11px', fontWeight: 600, colors: o.seq ? [({ seriesIndex, dataPointIndex, w }) => (dark() || w.config.series[seriesIndex].data[dataPointIndex].y >= mx * .5 ? '#fff' : '#1A2A20')] : undefined } },
      stroke: { width: 2, colors: [dark() ? '#0B2016' : '#fff'] }, legend: { show: !!o.legend, position: 'bottom', horizontalAlign: 'left' }, yaxis: { labels: { style: { colors: tok().ink } } },
      tooltip: { y: { formatter: v => (v == null ? 'no data' : (o.f ? o.f(v) : fmt(v))) } },
    }, o.x || {}));
  };
  const GBR = [{ from: -1, to: 90, color: C.bad, name: 'below 90%' }, { from: 90.0001, to: 98, color: C.warn, name: '90–98%' }, { from: 98.0001, to: 100.01, color: C.good, name: '98%+' }];
  const mshare = (a, i) => Math.round(100 * a[i] / sum(a));

  /* ======================================================== CRR */
  function crr(Q) {
    const D = Q.crr, M = Q.months, mo = D.monthly, tn = Q.teams, lo = argmin(mo.rate);
    const lm = mo.rate.length - 1;
    kpis([{ l: 'CRR · Jan–Oct', v: pc(D.rate), s: `lowest ${M[lo]} · ${pc(mo.rate[lo])}`, bar: D.rate, c: C.good },
      { l: 'CRR · Mar–Oct', v: pc(D.rate_mar, 2), d: KPI.delta(mo.rate[lm], mo.rate[lm - 1], { unit: ' pp', vs: M[lm - 1] }), spark: mo.rate.slice(2), lab: M.slice(2), u: '%', c: C.teal },
      { l: 'Resolved late', v: fmt(D.late), s: `${pc(100 * D.late / D.total)} of all complaints`, bar: 100 * D.late / D.total, c: C.warn },
      { l: 'Still pending', v: fmt(D.open), s: `${pc(100 * D.open / D.total)} of all complaints`, spark: mo.open, lab: M, c: C.bad }]);
    const worst = argmin(D.team_rate), lc = D.low_cities[0];
    document.getElementById('view').innerHTML =
      row([card(8, 'r1', `CRR was ${pc(mo.rate[lo], 0)} in ${M[lo]}, and ${pc(D.rate_mar, 1)} from March on`, 'Bars: how each complaint ended · Line: CRR %', [fmt(D.ok) + ' resolved on time', 'green']),
        card(4, 'r2', `${pc(D.rate, 1)} of complaints were resolved on time`, '', null)]) +
      row([card(6, 'r3', `Almost every miss sits in Jan–Feb · ${tn[worst]} had the lowest CRR`, 'Green = 98%+, amber = 90–98%, red = below 90%', null),
        card(6, 'r4', `${tn[argmax(D.team_late)]} resolved the most complaints late (${fmt(Math.max(...D.team_late))})`, 'Complaints resolved late per team', null)]) +
      row([card(4, 'r5', 'How complaints were closed', 'Closure state of every ticket', null),
        card(4, 'r6', `${lc ? lc[0] : ''} has the lowest CRR among big cities (${lc ? pc(lc[1]) : ''})`, 'Cities with 30+ complaints · lowest 8', null),
        card(4, 'r7', 'Which complaint type gets resolved best?', 'CRR % by complaint type', null)]);
    const lab = (th, last) => ({ enabled: vals(), enabledOnSeries: [0, 1, 2, 3], formatter: (v, o) => (o.seriesIndex === 3 ? (+v).toFixed(1) + '%' : (v >= th ? fmt(v) : '')), offsetY: -6, style: { fontSize: '11px', fontWeight: 700, colors: ['#fff', '#fff', '#fff', yl()] } });
    draw('r1', { chart: { type: 'line', height: 330, stacked: true }, series: [{ name: 'Resolved on time', type: 'column', data: mo.ok }, { name: 'Resolved late', type: 'column', data: mo.late }, { name: 'Pending / not resolved', type: 'column', data: mo.open }, { name: 'CRR %', type: 'line', data: mo.rate }],
      colors: [C.good, C.warn, C.bad, Y], stroke: { width: [0, 0, 0, 4] }, xaxis: { categories: M }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
      yaxis: [ax({ seriesName: 'Resolved on time', title: { text: 'Complaints', style: { color: tok().muted } } }), ax({ seriesName: 'Resolved on time', show: false }), ax({ seriesName: 'Resolved on time', show: false }),
        ax({ seriesName: 'CRR %', opposite: true, min: 70, max: 100, title: { text: 'CRR %', style: { color: tok().muted } }, labels: { formatter: v => Math.round(v) + '%', style: { colors: tok().muted } } })],
      markers: { size: [0, 0, 0, 6], colors: [Y], strokeColors: '#7A5B00', strokeWidth: 2 }, dataLabels: lab(30) });
    radial('r2', D.rate, C.good, 'CRR');
    heat('r3', tn, M, D.heat, { ranges: GBR, f: v => Math.round(v) + '', h: 330 });
    hbar('r4', tn.map((t, i) => [t, D.team_late[i]]), teamCol());
    donut('r5', D.closure, [C.good, C.blue, C.teal, C.warn, C.call, '#64748B'], { tl: 'Tickets' });
    hbar('r6', D.low_cities.map(c => [c[0], c[1]]), C.warn, { f: v => (+v).toFixed(1) + '%', min: 90, max: 100, name: 'CRR %' });
    hbar('r7', Object.entries(D.cat_rate), CATC, { f: v => (+v).toFixed(1) + '%', min: 90, max: 100, name: 'CRR %' });
  }

  /* ======================================================== CRS */
  function crs(Q) {
    const D = Q.crs, M = Q.months, tn = Q.teams, mo = D.monthly, bt = argmin(D.team_rate), rt = argmax(D.team_resp);
    const lm = D.rate_m.length - 1;
    kpis([{ l: 'CRS · satisfied ÷ answered', v: pc(D.rate), d: KPI.delta(D.rate_m[lm], D.rate_m[lm - 1], { unit: ' pp', vs: M[lm - 1] }), spark: D.rate_m, lab: M, u: '%', c: C.good },
      { l: 'Survey answer rate', v: pc(D.resp_rate), d: KPI.delta(D.resp_m[lm], D.resp_m[lm - 1], { unit: ' pp', vs: M[lm - 1] }), spark: D.resp_m, lab: M, u: '%', c: C.blue },
      { l: 'Satisfied customers', v: fmt(D.sat), spark: mo.Satisfied, lab: M, c: C.teal },
      { l: 'Not satisfied', v: fmt(D.notsat), spark: mo['Not Satisfied'], lab: M, c: C.bad }]);
    const kinds = Object.keys(D.kind);
    document.getElementById('view').innerHTML =
      row([card(4, 's1', `Only 1 in ${Math.round(100 / D.resp_rate)} customers answers the survey, ${pc(D.rate, 0)} of them are satisfied`, 'From closed tickets to satisfied customers', null),
        card(8, 's2', `Satisfaction stays near ${Math.round(D.rate)}% in every month`, 'Bars: customers who answered · Lines: CRS % and answer rate %', null)]) +
      row([card(6, 's3', `${tn[bt]} has the lowest CRS (${pc(D.team_rate[bt])}) · ${tn[rt]} gets the most answers (${pc(D.team_resp[rt], 0)})`, 'Bars: CRS % · Line: answer rate %', null),
        card(6, 's4', 'Satisfied answers only come when the customer closes the ticket', 'Survey result by how the ticket was closed (% of tickets)', null)]) +
      row([card(6, 's5', 'Where do the not-satisfied customers come from?', 'Not satisfied answers by city · top 8', [fmt(D.notsat) + ' total', '']),
        card(6, 's6', 'CRS by FOPs team, month by month', 'Green = 90%+, amber = 85–90%, red = below 85% · blank = fewer than 5 answers', null)]) +
      (D.not_played ? row([card(12, 's7', `${fmt(D.not_played)} tickets got no survey call (${M[0]}–${M[2]})`, 'IVR not played, per month', null)]) : '');
    draw('s1', { chart: { type: 'bar', height: 300 }, series: [{ name: 'Tickets', data: [D.played, D.resp, D.sat] }], colors: [C.blue, C.warn, C.good], legend: { show: false },
      plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '72%', borderRadius: 6 } }, xaxis: { categories: ['Survey call made', 'Customer answered', 'Satisfied'], labels: { formatter: v => fmt(v) } }, yaxis: { labels: { style: { colors: tok().ink, fontSize: '13px' } } },
      dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '13px', fontWeight: 700 } } });
    draw('s2', { chart: { type: 'line', height: 330, stacked: true }, series: [{ name: 'Satisfied', type: 'column', data: mo.Satisfied }, { name: 'Not satisfied', type: 'column', data: mo['Not Satisfied'] }, { name: 'CRS %', type: 'line', data: D.rate_m }, { name: 'Answer rate %', type: 'line', data: D.resp_m }],
      colors: [C.good, C.bad, Y, '#5E9BFF'], stroke: { width: [0, 0, 4, 3], dashArray: [0, 0, 0, 6] }, xaxis: { categories: M }, plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      yaxis: [ax({ seriesName: 'Satisfied', title: { text: 'Customers', style: { color: tok().muted } } }), ax({ seriesName: 'Satisfied', show: false }),
        ax({ seriesName: 'CRS %', opposite: true, min: 0, max: 100, labels: { formatter: v => Math.round(v) + '%', style: { colors: tok().muted } } }), ax({ seriesName: 'CRS %', opposite: true, show: false, min: 0, max: 100 })],
      markers: { size: [0, 0, 6, 5], colors: [Y, '#5E9BFF'], strokeColors: ['#7A5B00', '#1E4FD8'], strokeWidth: 2 },
      dataLabels: { enabled: vals(), enabledOnSeries: [0, 1, 2, 3], formatter: (v, o) => (o.seriesIndex >= 2 ? Math.round(v) + '%' : (v >= 20 ? fmt(v) : '')), offsetY: -6, style: { fontSize: '11px', fontWeight: 700, colors: ['#fff', '#fff', yl(), bl()] } } });
    draw('s3', { chart: { type: 'line', height: 320 }, series: [{ name: 'CRS %', type: 'column', data: D.team_rate }, { name: 'Answer rate %', type: 'line', data: D.team_resp }], colors: [C.good, C.blue], stroke: { width: [0, 3] }, xaxis: { categories: tn },
      plotOptions: { bar: { columnWidth: '50%', borderRadius: 5 } }, yaxis: ax({ min: 0, max: 100, labels: { formatter: v => Math.round(v) + '%', style: { colors: tok().muted } } }), markers: { size: [0, 5] },
      dataLabels: { enabled: vals(), formatter: v => Math.round(v) + '%', style: { fontSize: '11px' } } });
    const pcts = k => { const t = sum(Object.values(D.kind[k])); return ['Satisfied', 'Not Satisfied', 'No Response'].map(s => +(100 * D.kind[k][s] / t).toFixed(1)); };
    draw('s4', { chart: { type: 'bar', height: 320, stacked: true, stackType: '100%' }, series: ['Satisfied', 'Not satisfied', 'No response'].map((n, i) => ({ name: n, data: kinds.map(k => D.kind[k][['Satisfied', 'Not Satisfied', 'No Response'][i]]) })),
      colors: [C.good, C.bad, '#64748B'], plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 5 } }, xaxis: { categories: kinds, labels: { formatter: v => Math.round(v) + '%' } }, yaxis: { labels: { style: { colors: tok().ink } } },
      dataLabels: { enabled: vals(), formatter: v => (v > 4 ? Math.round(v) + '%' : ''), style: { fontSize: '12px' } } });
    hbar('s5', D.notsat_cities.map(c => [c[0], c[1]]), C.bad, { name: 'Not satisfied' });
    heat('s6', tn, M, D.heat, { ranges: [{ from: -1, to: 85, color: C.bad, name: '<85' }, { from: 85.0001, to: 90, color: C.warn, name: '85–90' }, { from: 90.0001, to: 100.01, color: C.good, name: '90+' }], f: v => Math.round(v) + '', h: 330 });
    if (D.not_played) draw('s7', { chart: { type: 'bar', height: 230 }, series: [{ name: 'No survey call', data: D.not_played_m }], colors: [C.warn], xaxis: { categories: M }, yaxis: ax(), legend: { show: false }, plotOptions: { bar: { columnWidth: '45%', borderRadius: 5 } }, dataLabels: { enabled: vals(), formatter: v => (v ? fmt(v) : '') } });
  }

  /* ======================================================== TAT */
  function tat(Q) {
    const D = Q.tat, M = D.months, tn = Q.teams, mo = D.monthly, wp = argmax(D.pend_share_m);
    const tl = D.rate_m.length - 1;
    kpis([{ l: 'Inside TAT · L-3', v: pc(D.rate, 2), d: KPI.delta(D.rate_m[tl], D.rate_m[tl - 1], { unit: ' pp', dp: 2, vs: M[tl - 1] }), spark: D.rate_m, lab: M, u: '%', c: C.good },
      { l: 'TAT breaches', v: fmt(D.over), spark: mo.over, lab: M, c: C.bad },
      { l: 'Open, still inside TAT', v: fmt(D.pend), spark: mo.pend, lab: M, c: C.warn },
      { l: 'L-3 tickets tracked', v: fmt(D.total), spark: mo.ok.map((v, i) => v + mo.pend[i] + mo.over[i]), lab: M, c: C.blue }]);
    const wt = argmax(D.team.over);
    document.getElementById('view').innerHTML =
      row([card(8, 't1', `${pc(D.rate, 1)} of L-3 tickets met their TAT · open tickets peaked in ${M[wp]} (${pc(D.pend_share_m[wp], 0)})`, 'Bars: ticket status · Line: TAT met %', [fmt(D.over) + ' breaches', 'orange']),
        card(4, 't2', `Only ${D.over} of ${fmt(D.total)} tickets went past TAT`, '', null)]) +
      row([card(6, 't3', `${tn[wt]} had the most TAT breaches (${D.team.over[wt]})`, 'Tickets by status per FOPs team', null),
        card(6, 't4', 'Which complaint types sit open longest?', 'Tickets by complaint type and status', null)]) +
      row([card(7, 't5', 'The ' + D.over + ' TAT breaches, one by one', 'Date · team · city · complaint type', null),
        card(5, 't6', 'How many L-3 tickets arrive each day', 'Daily tickets, all tracked months', null)]) +
      (D.unmapped ? row([card(12, 't7', `${fmt(D.unmapped)} tickets (${D.unmapped_months.join(', ')}) have no site or city in the source`, 'City views exclude them', null)]) : '');
    draw('t1', { chart: { type: 'line', height: 330, stacked: true }, series: [{ name: 'Met TAT', type: 'column', data: mo.ok }, { name: 'Open, inside TAT', type: 'column', data: mo.pend }, { name: 'TAT breach', type: 'column', data: mo.over }, { name: 'TAT met %', type: 'line', data: D.rate_m }],
      colors: [C.good, C.warn, C.bad, Y], stroke: { width: [0, 0, 0, 4] }, xaxis: { categories: M }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
      yaxis: [ax({ seriesName: 'Met TAT', title: { text: 'Tickets', style: { color: tok().muted } } }), ax({ seriesName: 'Met TAT', show: false }), ax({ seriesName: 'Met TAT', show: false }),
        ax({ seriesName: 'TAT met %', opposite: true, min: 95, max: 100, labels: { formatter: v => v + '%', style: { colors: tok().muted } } })],
      markers: { size: [0, 0, 0, 6], colors: [Y], strokeColors: '#7A5B00', strokeWidth: 2 },
      dataLabels: { enabled: vals(), enabledOnSeries: [0, 1, 2, 3], formatter: (v, o) => (o.seriesIndex === 3 ? (+v).toFixed(1) + '%' : (v >= 1 ? fmt(v) : '')), offsetY: -6, style: { fontSize: '11px', fontWeight: 700, colors: ['#fff', '#fff', '#fff', yl()] } } });
    radial('t2', D.rate, C.good, 'TAT met');
    stackCols('t3', tn, [{ name: 'Met TAT', data: D.team.ok, color: C.good }, { name: 'Open, inside TAT', data: D.team.pend, color: C.warn }, { name: 'TAT breach', data: D.team.over, color: C.bad }], { h: 300 });
    const sv = Object.keys(D.svc);
    draw('t4', { chart: { type: 'bar', height: 300, stacked: true }, series: [{ name: 'Met TAT', data: sv.map(s => D.svc[s].ok) }, { name: 'Open, inside TAT', data: sv.map(s => D.svc[s].pend) }, { name: 'TAT breach', data: sv.map(s => D.svc[s].over) }],
      colors: [C.good, C.warn, C.bad], plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } }, xaxis: { categories: sv, labels: { formatter: v => fmt(v) } }, yaxis: { labels: { style: { colors: tok().ink }, maxWidth: 180 } },
      dataLabels: { enabled: vals(), formatter: v => (v > 0 ? fmt(v) : ''), style: { fontSize: '11px', colors: ['#fff'] } } });
    document.getElementById('t5').innerHTML = `<div class="tscroll"><table class="tbl compact"><thead><tr><th>Date</th><th>Team</th><th>City</th><th>Complaint type</th></tr></thead><tbody>${D.over_list.map(r => `<tr><td>${r.d}</td><td><b>${r.team}</b></td><td>${r.city}</td><td>${r.svc}</td></tr>`).join('')}</tbody></table></div>`;
    draw('t6', { chart: { type: 'area', height: 250 }, series: [{ name: 'Tickets', data: D.daily.map(d => [new Date(d[0]).getTime(), d[1]]) }], colors: [C.blue], xaxis: { type: 'datetime', labels: { datetimeUTC: false } }, yaxis: ax(), fill: { type: 'gradient', gradient: { opacityFrom: .5, opacityTo: .05 } }, legend: { show: false } });
    if (D.unmapped) draw('t7', { chart: { type: 'bar', height: 120 }, series: [{ name: 'Mapped', data: [D.total - D.unmapped] }, { name: 'No site / city', data: [D.unmapped] }], colors: [C.good, C.warn], plotOptions: { bar: { horizontal: true, barHeight: '70%', borderRadius: 5 } }, chart: { type: 'bar', height: 120, stacked: true, stackType: '100%' }, xaxis: { labels: { show: false } }, yaxis: { show: false }, grid: { show: false }, dataLabels: { enabled: true, formatter: (v, o) => fmt(o.w.config.series[o.seriesIndex].data[0]) } });
  }

  const PAGES = { crr, crs, tat };
  const HEAD = { crr: ['CRR · Complaint Resolution', 'How many complaints were resolved on time'],
    crs: ['CRS · Customer Satisfaction', 'What customers said after the survey call'], tat: ['L-3 TAT · Turn-around time', 'Did L-3 tickets close inside their TAT'] };
  let cur = null;
  function render(key, Q) {
    destroy(); cur = [key, Q];
    document.getElementById('h1').textContent = HEAD[key][0]; document.getElementById('sub').textContent = HEAD[key][1];
    const b = document.getElementById('vals'); if (b) { b.classList.toggle('on', vals()); b.onclick = () => { window.__vals = !vals(); b.classList.toggle('on', vals()); b.setAttribute('aria-pressed', String(vals())); render(cur[0], cur[1]); }; }
    PAGES[key](Q);
  }
  new MutationObserver(() => { if (cur) setTimeout(() => render(cur[0], cur[1]), 60); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.AK = { C, CATC, fmt, pc, sum, argmax, argmin, tok, merge, draw, destroy, ax, card, row, sec, kpis, stackCols, hbar, donut, radial, heat, GBR, vals, teamCol, base };
  window.QUALITY = { render, keys: Object.keys(PAGES), live: () => live };
})();