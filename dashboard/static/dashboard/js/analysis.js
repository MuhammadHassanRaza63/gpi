/* RCTO Central · Critical Analysis (separate page, like the Grid "Analysis lab").
   ApexCharts for most charts, Apache ECharts for the flow diagram. Needs quality.js (window.AK) loaded first. */
(function () {
  'use strict';
  const A = window.AK, C = A.C, fmt = A.fmt, pc = A.pc, sum = A.sum, tok = A.tok, ax = A.ax;
  const Q = window.QDATA, D = Q.an, M = Q.months, TN = Q.teams;
  let ech = null;

  function page() {
    A.destroy(); if (ech) { ech.dispose(); ech = null; }
    const T = A.teamCol(), sb = D.site_bins, sites = D.n_sites;
    const worst = D.score.slice().sort((a, b) => a.crs - b.crs)[0];
    const rep = 100 * D.repeat_compl / D.msisdn_rows, chr = 100 * D.chronic_compl / Q.cpm.total;
    A.kpis([{ l: 'Top 5 cities', v: pc(D.top5_share, 0), s: 'share of all complaints', bar: D.top5_share, c: C.cov },
      { l: 'Chronic sites (3+ months)', v: pc(chr, 0), s: 'share of complaints', bar: chr, c: C.warn },
      { l: 'Repeat callers', v: pc(rep, 0), s: 'share of complaints', bar: rep, c: C.call },
      { l: 'Survey answer rate', v: pc(Q.crs.resp_rate, 0), s: 'customers who answer the survey', bar: Q.crs.resp_rate, c: C.blue }]);

    const cities = D.cities_all, cum = []; let run = 0; cities.forEach(c => { run += c[1]; cum.push(+(100 * run / Q.cpm.total).toFixed(1)); });
    const p80 = cum.findIndex(v => v >= 80) + 1;
    const dly = D.daily, hi = D.daily_hi, spikes = dly.filter(d => d[1] > hi);
    const sm = D.sub_month, idx = sm.map(r => { const a = sum(r) / r.length; return r.map(v => Math.round(100 * v / a)); });
    const dh = D.dow_hour, dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const flat = []; dh.forEach((r, w) => r.forEach((v, h) => flat.push([v, w, h]))); const pk = flat.sort((a, b) => b[0] - a[0])[0];
    const sbk = Object.keys(sb);
    const byTeam = {}, byCat = {}; D.flow.filter(f => f[0] === 'cat').forEach(f => { (byTeam[f[2]] = byTeam[f[2]] || []).push({ name: f[1], value: f[3] }); byCat[f[1]] = (byCat[f[1]] || 0) + f[3]; });
    const topT = Object.entries(byTeam).map(e => [e[0], sum(e[1].map(x => x.value))]).sort((a, b) => b[1] - a[1])[0], topC = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

    document.getElementById('view').innerHTML =
      A.sec('1 · Where the pain is concentrated', 'Fix a few places, remove a big part of the complaints') +
      A.row([A.card(8, 'a1', `${p80} cities give 80% of all complaints · the top 5 give ${pc(D.top5_share, 0)}`, 'Bars: complaints per city · Line: running share of all complaints', null),
        A.card(4, 'a2', `${fmt(D.chronic_sites)} sites complained in 3+ different months`, `They are ${pc(100 * D.chronic_sites / sites, 0)} of sites but ${pc(chr, 0)} of complaints`, [pc(chr, 0) + ' of complaints', 'orange'])]) +
      A.row([A.card(6, 'a3', `${fmt(sb['3'].sites + sb['4'].sites + sb['5+'].sites)} sites complained 3 times or more`, 'Number of sites by how many complaints they received (bars) and the complaints they caused (line)', null),
        A.card(6, 'a4', 'The 12 sites with the most complaints', 'Site ID and city · complaints Jan–Oct', null)]) +
      A.row([A.card(4, 'a5', `${fmt(D.repeat_callers)} customers called more than once`, `They raised ${fmt(D.repeat_compl)} complaints (${pc(rep, 0)})`, null),
        A.card(8, 'a6', 'Which cities were hot in which month?', 'Darker = more complaints · 12 busiest cities', null)]) +
      A.sec('2 · When complaints hit', 'Plan staffing around the peaks') +
      A.row([A.card(8, 'b1', `${spikes.length} days were unusually busy (above ${Math.round(hi)} complaints a day)`, `Daily complaints · dotted line = usual ${D.daily_mean}/day + 2 spreads`, [spikes.length + ' spike days', 'orange']),
        A.card(4, 'b2', 'Which site region runs hot in which month?', '100 = that region’s own monthly average', null)]) +
      A.row([A.card(12, 'b3', `Busiest slot of the week: ${dow[pk[1]]} at ${pk[2]}:00 (${pk[0]} complaints)`, 'Complaints by weekday and hour of the day', null)]) +
      A.sec('3 · Who handles what, and how well we fix', 'Workload by team, then outcomes') +
      A.row([A.card(12, 'c1', `${topT[0]} handles the most complaints (${fmt(topT[1])}) · ${topC[0].toLowerCase()} is the biggest complaint type`, `Each block is one FOPs team · tile size = complaints (total ${fmt(Q.crr.total)}) · colour = complaint type`, null)]) +
      A.row([A.card(6, 'c2', `Almost all late resolutions were in Jan–Feb · ${TN[Q.crr.team_late.indexOf(Math.max(...Q.crr.team_late))]} had the most`, 'Complaints resolved late, per team and month', null),
        A.card(6, 'c3', 'Share of L-3 tickets still open inside TAT, month by month', 'A rising line means a growing backlog', null)]) +
      A.sec('4 · What customers feel', 'The survey only hears a small part of them') +
      A.row([A.card(5, 'd1', 'From closed ticket to satisfied customer', 'Each step shows how many customers are left', null),
        A.card(7, 'd2', 'Which closure type gives answers?', 'Survey result by closure type', null)]) +
      A.sec('5 · Team scorecard', 'Six teams, seven measures, one picture') +
      A.row([A.card(8, 'e1', `Team scorecard: ${worst.team} has the weakest satisfaction (${pc(worst.crs)})`, 'Green = good, red = needs attention (each column compared across the 6 teams)', null),
        A.card(4, 'e2', 'Workload vs satisfaction', 'Bubble size = share of complaints from repeat sites', null)]) +
      A.row([A.card(12, 'e3', 'How complete is the data?', 'Green = month present in the sheet · red = missing', null)]);

    /* 1 */
    A.draw('a1', { chart: { type: 'line', height: 330 }, series: [{ name: 'Complaints', type: 'column', data: cities.slice(0, 15).map(c => c[1]) }, { name: 'Running share %', type: 'line', data: cum.slice(0, 15) }], colors: [C.blue, C.cov],
      stroke: { width: [0, 3] }, xaxis: { categories: cities.slice(0, 15).map(c => c[0]), labels: { rotate: -35, style: { colors: tok().ink } } }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
      yaxis: [ax(), ax({ opposite: true, min: 0, max: 100, labels: { formatter: v => v + '%', style: { colors: tok().muted } } })], markers: { size: [0, 4] }, dataLabels: { enabled: A.vals(), enabledOnSeries: [1], formatter: v => Math.round(v) + '%', offsetY: -6, style: { fontSize: '11px' } } });
    A.draw('a2', { chart: { type: 'donut', height: 300 }, series: [D.chronic_compl, Q.cpm.total - D.chronic_compl], labels: ['Chronic sites (3+ months)', 'All other sites'], colors: [C.warn, '#5E7BB8'], stroke: { width: 2, colors: [tok().mode === 'dark' ? '#0B2016' : '#fff'] },
      plotOptions: { pie: { donut: { size: '66%', labels: { show: true, total: { show: true, label: 'Complaints', color: tok().ink, formatter: () => fmt(Q.cpm.total) }, value: { color: tok().ink1, fontSize: '26px', fontWeight: 800, formatter: v => fmt(+v) } } } } }, legend: { position: 'bottom' }, dataLabels: { enabled: A.vals(), formatter: v => Math.round(v) + '%' } });
    A.draw('a3', { chart: { type: 'line', height: 320 }, series: [{ name: 'Sites', type: 'column', data: sbk.map(k => sb[k].sites) }, { name: 'Complaints they caused', type: 'line', data: sbk.map(k => sb[k].compl) }], colors: [C.blue, C.cov], stroke: { width: [0, 3] },
      xaxis: { categories: sbk.map(k => k + (k === '1' ? ' complaint' : ' complaints')), labels: { style: { colors: tok().ink } } }, plotOptions: { bar: { columnWidth: '55%', borderRadius: 5 } }, yaxis: [ax(), ax({ opposite: true, show: false })], markers: { size: [0, 5] },
      dataLabels: { enabled: A.vals(), formatter: v => fmt(v), style: { fontSize: '11px' } } });
    A.hbar('a4', D.top_sites.map(s => ['Site ' + s[0] + ' · ' + s[1], s[2]]), [C.cov].concat(Array(11).fill('#F08A4B')));
    A.draw('a5', { chart: { type: 'bar', height: 300 }, series: [{ name: 'Customers', data: ['1', '2', '3', '4+'].map(k => D.callers[k]) }], colors: [C.blue, C.warn, C.data, C.bad], legend: { show: false }, plotOptions: { bar: { distributed: true, columnWidth: '55%', borderRadius: 6 } },
      xaxis: { categories: ['1 time', '2 times', '3 times', '4+ times'], labels: { style: { colors: tok().ink } } }, yaxis: ax({ logarithmic: true, min: 10 }), dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '12px', fontWeight: 700 } } });
    A.heat('a6', D.top12, M, D.city_month, { seq: 'pink', legend: true, h: 12 * 34 + 110 });
    /* 2 */
    A.draw('b1', { chart: { type: 'line', height: 320, zoom: { enabled: false } }, series: [{ name: 'Complaints per day', data: dly.map(d => [new Date(d[0]).getTime(), d[1]]) }], colors: [C.blue], stroke: { width: 2 }, xaxis: { type: 'datetime', labels: { datetimeUTC: false } }, yaxis: ax(),
      annotations: { yaxis: [{ y: hi, borderColor: C.bad, strokeDashArray: 4, label: { text: 'unusually busy', style: { color: '#fff', background: C.bad } } }], points: spikes.sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => ({ x: new Date(d[0]).getTime(), y: d[1], marker: { size: 5, fillColor: C.bad, strokeColor: '#fff' }, label: { text: new Date(d[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + d[1], style: { background: C.bad, color: '#fff', fontSize: '11px' } } })) }, legend: { show: false } });
    A.heat('b2', Q.subs.map(s => s.replace('Central ', 'Central–')), M, idx, { ranges: [{ from: 0, to: 79, color: '#2F6BFF', name: 'quiet' }, { from: 80, to: 119, color: '#5E7BB8', name: 'usual' }, { from: 120, to: 999, color: C.cov, name: 'hot' }], h: 340, f: v => v, x: { dataLabels: { style: { fontSize: '10px' } } } });
    A.heat('b3', dow, Array.from({ length: 24 }, (_, i) => i + 'h'), dh, { seq: 'orange', legend: true, h: 7 * 40 + 110, labels: false, x: { xaxis: { labels: { style: { colors: tok().ink, fontSize: '11px' } } } } });
    /* 3 */
    if (window.echarts) {
      const t = tok(), bg = t.mode === 'dark' ? '#0B2016' : '#FFFFFF', catCol = { 'Coverage': C.cov, 'Data speed': C.data, 'Call quality': C.call }, tot = Q.crr.total;
      const data = TN.filter(n => byTeam[n]).map(n => ({ name: n, itemStyle: { color: T[TN.indexOf(n)] }, children: byTeam[n].map(c => ({ name: c.name, value: c.value, itemStyle: { color: catCol[c.name] } })) }));
      ech = echarts.init(document.getElementById('c1'), null, { renderer: 'svg', height: 430 });
      ech.setOption({ tooltip: { formatter: p => `<b>${p.name}</b><br>${fmt(p.value)} complaints (${(100 * p.value / tot).toFixed(1)}% of all)` },
        series: [{ type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, left: 0, right: 0, top: 0, bottom: 0, squareRatio: 1.3, data,
          label: { show: true, color: '#fff', fontFamily: 'Calibri, Carlito, sans-serif', fontSize: 15, fontWeight: 700, lineHeight: 22, formatter: p => `${p.name}\n${fmt(p.value)}  ·  ${(100 * p.value / tot).toFixed(0)}%` },
          upperLabel: { show: true, height: 34, color: '#fff', fontFamily: 'Calibri, Carlito, sans-serif', fontSize: 16, fontWeight: 800, formatter: p => `${p.name}  ·  ${fmt(p.value)} complaints` },
          levels: [{ itemStyle: { borderColor: bg, borderWidth: 4, gapWidth: 4 } }, { itemStyle: { borderColor: bg, borderWidth: 3, gapWidth: 3 }, upperLabel: { show: false } }] }] });
      window.addEventListener('resize', () => ech && ech.resize());
    } else document.getElementById('c1').innerHTML = '<p class="why">ECharts did not load (needs internet).</p>';
    const cl = Q.crr.team_late_m;
    A.stackCols('c2', TN, [{ name: 'January', data: TN.map(t => cl[t][0]), color: C.warn }, { name: 'February', data: TN.map(t => cl[t][1]), color: C.data }], { h: 300 });
    A.draw('c3', { chart: { type: 'line', height: 300 }, series: [{ name: 'Open inside TAT %', data: Q.tat.pend_share_m }], colors: [C.warn], xaxis: { categories: Q.tat.months }, yaxis: ax({ min: 0, labels: { formatter: v => v + '%', style: { colors: tok().muted } } }), stroke: { width: 3 }, markers: { size: 6 },
      dataLabels: { enabled: true, formatter: v => (+v).toFixed(1) + '%', offsetY: -8 }, legend: { show: false } });
    /* 4 */
    A.draw('d1', { chart: { type: 'bar', height: 300 }, series: [{ name: 'Tickets', data: D.funnel.map(f => f[1]) }], colors: [C.blue, '#5E7BB8', C.warn, C.good], legend: { show: false }, plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '74%', borderRadius: 6 } },
      xaxis: { categories: D.funnel.map(f => f[0]), labels: { formatter: v => fmt(v) } }, yaxis: { labels: { style: { colors: tok().ink, fontSize: '13px' } } }, dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '13px', fontWeight: 700 } } });
    const K = Q.crs.kind, ks = Object.keys(K), SN = ['Satisfied', 'Not Satisfied', 'No Response'];
    A.draw('d2', { chart: { type: 'bar', height: 300, stacked: true }, series: SN.map(s => ({ name: s === 'No Response' ? 'No response' : s, data: ks.map(k => K[k][s]) })), colors: [C.good, C.bad, '#64748B'], plotOptions: { bar: { columnWidth: '50%', borderRadius: 4 } }, xaxis: { categories: ks }, yaxis: ax(),
      dataLabels: { enabled: A.vals(), formatter: v => (v > 60 ? fmt(v) : ''), style: { fontSize: '11px' } } });
    /* 5 */
    const S = D.score, cols = [['Complaints', 'vol', 0], ['Resolved on time %', 'crr', 1], ['Late resolved', 'late', 0], ['Satisfaction %', 'crs', 1], ['Survey answers %', 'resp', 1], ['TAT met %', 'tat', 1], ['Complaints from repeat sites %', 'repeat', 0]];
    const z = cols.map(c => { const v = S.map(s => s[c[1]]), mn = Math.min(...v), mx = Math.max(...v); return v.map(x => { const q = mx === mn ? .5 : (x - mn) / (mx - mn); return Math.round(100 * (c[2] ? q : 1 - q)); }); });
    A.draw('e1', { chart: { type: 'heatmap', height: 6 * 50 + 90 }, series: S.map((s, i) => ({ name: s.team, data: cols.map((c, j) => ({ x: c[0], y: z[j][i] })) })), plotOptions: { heatmap: { radius: 6, colorScale: { ranges: [{ from: 0, to: 33, color: C.bad, name: 'needs attention' }, { from: 34, to: 66, color: C.warn, name: 'average' }, { from: 67, to: 100, color: C.good, name: 'strong' }] } } },
      dataLabels: { enabled: true, formatter: (v, o) => { const c = cols[o.dataPointIndex], x = S[o.seriesIndex][c[1]]; return c[2] === 0 && c[1] === 'vol' || c[1] === 'late' ? fmt(x) : Math.round(x * 10) / 10; }, style: { fontSize: '11px', fontWeight: 700 } },
      stroke: { width: 2, colors: [tok().mode === 'dark' ? '#0B2016' : '#fff'] }, legend: { show: true, position: 'top' }, xaxis: { labels: { rotate: 0, style: { colors: tok().ink, fontSize: '11px' } } }, yaxis: { labels: { style: { colors: tok().ink } } },
      tooltip: { y: { formatter: (v, o) => { const c = cols[o.dataPointIndex]; return fmt(S[o.seriesIndex][c[1]]) + (c[1] === 'vol' || c[1] === 'late' ? '' : '%'); } } } });
    A.draw('e2', { chart: { type: 'bubble', height: 330 }, series: S.map((s, i) => ({ name: s.team, data: [[s.vol, s.crs, s.repeat]] })), colors: T, fill: { opacity: .75 }, xaxis: { type: 'numeric', title: { text: 'Complaints', style: { color: tok().muted } }, labels: { formatter: v => fmt(v) } },
      yaxis: ax({ title: { text: 'Satisfaction %', style: { color: tok().muted } }, min: 84, max: 94, labels: { formatter: v => v.toFixed(0) + '%', style: { colors: tok().muted } } }), plotOptions: { bubble: { minBubbleRadius: 12, maxBubbleRadius: 38 } } });
    const names = Object.keys(D.coverage);
    A.heat('e3', names.map(n => ({ CPM: 'CPM complaints', CRR: 'CRR resolution', CRS: 'CRS survey', TAT: 'L-3 TAT' }[n])), M, names.map(n => D.coverage[n].map(v => (v ? 100 : 0))), { ranges: [{ from: -1, to: 50, color: C.bad, name: 'missing' }, { from: 50.1, to: 100, color: C.good, name: 'present' }], labels: false, h: 230 });
  }
  page();
  new MutationObserver(() => setTimeout(page, 60)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const vb = document.getElementById('vals'); if (vb) vb.onclick = () => { window.__vals = !A.vals(); vb.classList.toggle('on', A.vals()); vb.setAttribute('aria-pressed', String(A.vals())); page(); };
})();