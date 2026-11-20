/* Central complaint dashboards: CPM, CRR, CRS, L-3 TAT and Compare.
   Charts: Apache ECharts + ApexCharts. Every number comes from DATA (computed in central_metrics.py);
   headings are written from the data, so they always match the chart under them. */
(function () {
  'use strict';
  const MT = DATA.meta, SUBS = MT.subs, L = MT.labels, TL = MT.tat_labels, CATS = MT.cats;
  const FONT = 'Calibri, Carlito, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  const TEAMC = THEME.teams;                                              // C1..C6, same colours as the RCTO dashboards
  const DS = { CPM: '#F0147F', CRR: '#14B870', CRS: '#7B61FF', TAT: '#FF9A1F' };
  const CATC = ['#2F6BFF', '#FFB020', '#F0558A'];                         // Coverage, Data speed, Call quality
  const SATC = { 'Satisfied': '#14B870', 'Not Satisfied': '#F0147F', 'No Response': '#7C8DA0', 'IVR not played': '#475569' };
  const RESC = { 'Resolved': '#14B870', 'Future Resolved': '#FFB020', 'Pending Resolution': '#7B61FF', 'Not Resolved': '#F0147F' };
  const TATC = { 'Within TAT': '#14B870', 'Pending Within TAT': '#FFB020', 'TAT Over': '#F0147F' };
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const RANK = ['#F0147F', '#FFB020', '#14B870'];                         // worst -> best

  const fmt = n => n == null ? '–' : Math.round(n).toLocaleString('en-US');
  const f1 = n => n == null ? '–' : Number(n).toFixed(1);
  const pc = n => n == null ? '–' : Number(n).toFixed(1) + '%';
  const sum = a => a.reduce((x, y) => x + (y || 0), 0);
  const maxI = a => a.reduce((b, v, i) => (v != null && (a[b] == null || v > a[b]) ? i : b), 0);
  const minI = a => a.reduce((b, v, i) => (v != null && (a[b] == null || v < a[b]) ? i : b), 0);
  const tn = t => 'C' + t;
  const sgn = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%';
  const dateTxt = s => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  let P = {}, showVals = true, lastKey = null;
  const live = [];
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function pal() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return { dark, ink: css('--ink') || '#EAF3EC', ink2: css('--ink-2') || '#C2D3C7', muted: css('--muted') || '#8FA999',
             grid: css('--grid') || 'rgba(255,255,255,.08)', line: css('--line') || 'rgba(180,240,60,.16)',
             bg: css('--canvas') || (dark ? '#03100A' : '#EAF4E1'), edge: dark ? '#0A1C12' : '#F4FAF0',
             empty: dark ? 'rgba(255,255,255,.05)' : 'rgba(20,70,30,.07)' };
  }
  function deep(t, s) {
    for (const k in s) {
      if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && !(s[k] instanceof echarts.graphic.LinearGradient) &&
          t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) deep(t[k], s[k]);
      else t[k] = s[k];
    }
    return t;
  }

  /* ---------------------------------------------------------------- ECharts helpers */
  const grad = (c, horizontal) => new echarts.graphic.LinearGradient(0, 0, horizontal ? 1 : 0, horizontal ? 0 : 1,
    horizontal ? [{ offset: 0, color: c + '8C' }, { offset: 1, color: c }] : [{ offset: 0, color: c }, { offset: 1, color: c + '8C' }]);
  const G = o => Object.assign({ left: 4, right: 14, top: 38, bottom: 4, containLabel: true }, o || {});
  const lab = o => Object.assign({ show: showVals, color: P.ink, fontFamily: FONT, fontSize: 12.5, fontWeight: 700 }, o || {});
  const catAxis = (data, o) => deep({ type: 'category', data, axisTick: { show: false }, axisLine: { lineStyle: { color: P.line } },
    axisLabel: { color: P.muted, fontSize: 13, fontFamily: FONT } }, o || {});
  const valAxis = o => deep({ type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: P.grid } },
    axisLabel: { color: P.muted, fontSize: 13, fontFamily: FONT } }, o || {});
  const legend = o => deep({ top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, itemGap: 16,
    textStyle: { color: P.ink2, fontSize: 13, fontFamily: FONT } }, o || {});
  const tipAxis = { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(180,240,60,.08)' } } };

  function ec(id, o) {
    const el = document.getElementById(id);
    if (!el) return null;
    const c = echarts.init(el);
    const base = {
      textStyle: { fontFamily: FONT, color: P.ink2 }, animationDuration: 600,
      tooltip: { backgroundColor: '#0A1A10', borderColor: 'rgba(255,255,255,.18)', textStyle: { color: '#fff', fontFamily: FONT, fontSize: 13 },
                 extraCssText: 'border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.45);' },
      toolbox: { right: 0, top: 0, itemSize: 14, iconStyle: { borderColor: P.muted }, emphasis: { iconStyle: { borderColor: '#B4F03C' } },
                 feature: { saveAsImage: { title: 'Save PNG', pixelRatio: 2, backgroundColor: P.bg } } },
    };
    c.setOption(deep(base, o));
    live.push({ dispose: () => c.dispose(), resize: () => c.resize() });
    return c;
  }

  /* heat map: cells = [x, y, value]; blank cells use '-' */
  function heat(id, xs, ys, cells, o) {
    o = o || {};
    const vals = cells.map(c => c[2]).filter(v => v != null);
    const lo = o.min != null ? o.min : 0, hi = o.max != null ? o.max : Math.max(1, ...vals);
    ec(id, {
      grid: G({ top: o.top != null ? o.top : 8, left: 4, right: 10 }),
      tooltip: { position: 'top', formatter: p => `<b>${ys[p.value[1]]}</b> · ${xs[p.value[0]]}<br>${o.unit ? (p.value[2] == null || p.value[2] === '-' ? '–' : f1(p.value[2]) + o.unit) : fmt(p.value[2])}` },
      xAxis: catAxis(xs, { splitArea: { show: false }, position: o.xTop ? 'top' : 'bottom', axisLine: { show: false }, axisLabel: { interval: o.xInterval || 0 } }),
      yAxis: catAxis(ys, { inverse: true, axisLine: { show: false }, axisLabel: { color: P.ink2, fontSize: 13.5 } }),
      visualMap: { show: false, min: lo, max: hi, inRange: { color: o.colors || [P.empty, DS.CPM] }, outOfRange: { color: P.empty } },
      series: [{ type: 'heatmap', data: cells.map(c => [c[0], c[1], c[2] == null ? '-' : c[2]]),
        itemStyle: { borderColor: P.edge, borderWidth: 3, borderRadius: 6 },
        label: { show: showVals && o.labels !== false, color: o.labelColor || P.ink, fontFamily: FONT, fontSize: 12.5, fontWeight: 700,
                 formatter: p => (p.value[2] === '-' || p.value[2] == null) ? '' : (o.unit ? f1(p.value[2]) : fmt(p.value[2])) },
        emphasis: { itemStyle: { borderColor: '#B4F03C' } } }],
    });
  }

  /* horizontal ranked bars: items = [{name, n, color?}] */
  function hbars(id, items, color, o) {
    o = o || {};
    ec(id, {
      grid: G({ top: 8, right: 54 }), tooltip: Object.assign({}, tipAxis),
      xAxis: valAxis({ show: false }),
      yAxis: catAxis(items.map(i => i.name), { inverse: true, axisLine: { show: false },
        axisLabel: { color: P.ink2, fontSize: 13.5, width: o.labelW || 150, overflow: 'truncate' } }),
      series: [{ type: 'bar', data: items.map(i => ({ value: i.n, itemStyle: { color: grad(i.color || color, true), borderRadius: [0, 7, 7, 0] } })),
        barWidth: o.barW || '58%', label: lab({ position: 'right' }), emphasis: { focus: 'self' } }],
    });
  }

  /* ---------------------------------------------------------------- ApexCharts helpers */
  function ax(id, o) {
    const el = document.getElementById(id);
    if (!el) return null;
    const base = {
      chart: { fontFamily: FONT, foreColor: P.muted, background: 'transparent', height: el.clientHeight || 330, animations: { speed: 500 },
               toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } } },
      theme: { mode: P.dark ? 'dark' : 'light' },
      grid: { borderColor: P.grid, strokeDashArray: 0, padding: { left: 6, right: 10 } },
      tooltip: { theme: P.dark ? 'dark' : 'light' },
      dataLabels: { enabled: false },
      legend: { fontSize: '13px', labels: { colors: P.ink2 }, markers: { radius: 3, size: 6 }, itemMargin: { horizontal: 10 } },
      stroke: { show: true },
      states: { hover: { filter: { type: 'lighten', value: 0.06 } } },
    };
    const c = new ApexCharts(el, deep(base, o));
    c.render();
    live.push({ dispose: () => c.destroy(), resize: () => {} });
    return c;
  }
  const aLab = o => Object.assign({ enabled: showVals, style: { fontSize: '11.5px', fontWeight: 700, colors: ['#fff'] }, dropShadow: { enabled: false } }, o || {});
  const aCats = c => ({ categories: c, axisBorder: { color: P.line }, axisTicks: { show: false }, labels: { style: { colors: P.muted, fontSize: '13px' } } });
  const aInt = () => ({ labels: { formatter: v => fmt(v), style: { colors: P.muted, fontSize: '13px' } } });
  const aBar = o => ({ bar: Object.assign({ borderRadius: 5, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last', columnWidth: '54%' }, o || {}) });

  /* ---------------------------------------------------------------- page chrome */
  const badge = (t, cls) => `<span class="badge ${cls || ''}">${t}</span>`;
  const card = (id, span, title, h, tag) =>
    `<article class="card c${span}"><div class="head"><div><h2>${title}</h2></div>${tag || ''}</div><div class="chart" id="${id}" style="height:${h || 340}px"></div></article>`;
  const kpiHTML = list => KPI.html(list);                                  // card markup lives in js/kpi.js
  const dlt = (a, o) => KPI.delta(a[a.length - 1], a[a.length - 2], o);
  const row = (...cards) => `<section class="grid">${cards.join('')}</section>`;

  /* ================================================================ CPM */
  function viewCPM() {
    const d = DATA.cpm, k = d.kpis, T = MT.teams;
    const subTot = SUBS.map((s, si) => sum(d.sub_heat.filter(c => c[1] === si).map(c => c[2])));
    const si = maxI(subTot);
    let bt = { v: -1, t: 1, m: 0 };
    d.team_month.forEach((r, ti) => r.forEach((v, mi) => { if (v > bt.v) bt = { v, t: T[ti], m: mi }; }));
    let hb = d.hour_week[0];
    d.hour_week.forEach(c => { if (c[2] > hb[2]) hb = c; });
    const day = d.daily.reduce((b, c) => c[1] > b[1] ? c : b, d.daily[0]);
    const total = k.total, c1 = d.site_class[0], c2 = d.site_class[1];
    const ti = d.titles[0], ch = d.channel[0];
    const prev = L[L.length - 2];
    /* every calendar day from first to last complaint (days with no complaint count as 0), so an averaged bucket is exact complaints per day */
    const byDay = {}; d.daily.forEach(x => { byDay[x[0]] = x[1]; });
    const cal = []; for (let t = new Date(d.day_range[0] + 'T00:00:00Z'), e = new Date(d.day_range[1] + 'T00:00:00Z'); t <= e; t.setUTCDate(t.getUTCDate() + 1)) { const k = t.toISOString().slice(0, 10); cal.push([k, byDay[k] || 0]); }
    const html =
      row(card('cpm-month', 8, `Complaints peaked in ${k.peak} at ${fmt(k.peak_n)}`, 360, k.mom == null ? '' : badge(`${k.last} ${sgn(k.mom)}`, k.mom <= 0 ? 'green' : '')),
          card('cpm-team', 4, `${tn(k.top_team)} handles ${f1(k.top_team_share)}% of complaints`, 360)) +
      row(card('cpm-type', 6, `Coverage is ${f1(k.coverage_share)}% of every complaint`, 340),
          card('cpm-lines', 6, `${tn(bt.t)} peaked in ${L[bt.m]} with ${fmt(bt.v)}`, 340)) +
      row(card('cpm-heat', 7, `${SUBS[si]} carries ${f1(100 * subTot[si] / total)}% of complaints`, 360),
          card('cpm-city', 5, `${d.cities[0].name} leads with ${fmt(d.cities[0].n)} complaints`, 360)) +
      row(card('cpm-title', 5, `${ti.name} is ${f1(100 * ti.n / total)}% of complaints`, 360),
          card('cpm-hw', 7, `Busiest hour: ${DOW[hb[1]]} ${String(hb[0]).padStart(2, '0')}:00 (${fmt(hb[2])})`, 360)) +
      row(card('cpm-cal', 12, `Busiest day: ${dateTxt(day[0])} with ${fmt(day[1])} complaints`, 250)) +
      row(card('cpm-class', 5, `${c1.name} and ${c2.name} hold ${f1(100 * (c1.n + c2.n) / total)}% of complaints`, 340),
          card('cpm-chan', 7, `${ch.name} brings ${f1(100 * ch.n / total)}% of complaints`, 340));
    const draw = () => {
      /* complaints per month */
      ec('cpm-month', {
        grid: G(), tooltip: Object.assign({}, tipAxis), xAxis: catAxis(L), yAxis: valAxis(),
        series: [{ type: 'bar', data: d.monthly, barWidth: '46%', itemStyle: { color: grad(DS.CPM), borderRadius: [8, 8, 0, 0] },
          label: lab({ position: 'top' }),
          markLine: { silent: true, symbol: 'none', lineStyle: { color: P.muted, type: 'dashed' }, label: { color: P.muted, fontSize: 12.5, formatter: p => 'Avg ' + fmt(p.value) }, data: [{ type: 'average' }] } }],
      });
      /* team share */
      ec('cpm-team', {
        tooltip: { trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fmt(p.value)} · ${f1(p.percent)}%` },
        legend: legend({ top: 'auto', bottom: 0, left: 'center' }),
        graphic: [{ type: 'text', left: 'center', top: '38%', style: { text: fmt(total), fill: P.ink, font: `800 30px ${FONT}`, textAlign: 'center' } }],
        series: [{ type: 'pie', radius: ['52%', '76%'], center: ['50%', '45%'], avoidLabelOverlap: true,
          itemStyle: { borderColor: P.edge, borderWidth: 3, borderRadius: 8 },
          label: { show: showVals, formatter: '{d}%', color: P.ink, fontFamily: FONT, fontSize: 12.5, fontWeight: 700 }, labelLine: { length: 8, length2: 6 },
          data: d.team_share.map((t, i) => ({ name: tn(t.team), value: t.n, itemStyle: { color: TEAMC[i % TEAMC.length] } })) }],
      });
      /* complaint type by month */
      ax('cpm-type', {
        chart: { type: 'bar', stacked: true }, series: CATS.map(c => ({ name: c, data: d.type_month[c] })), colors: CATC,
        plotOptions: aBar(), xaxis: aCats(L), yaxis: aInt(), dataLabels: aLab(), legend: { position: 'top', horizontalAlign: 'left' },
      });
      /* team trend */
      ax('cpm-lines', {
        chart: { type: 'line' }, series: T.map((t, i) => ({ name: tn(t), data: d.team_month[i] })), colors: TEAMC,
        stroke: { width: 3, curve: 'smooth' }, markers: { size: 4, strokeWidth: 0, hover: { size: 6 } }, xaxis: aCats(L), yaxis: aInt(),
        legend: { position: 'top', horizontalAlign: 'left' },
      });
      /* sub-region x month */
      heat('cpm-heat', L, SUBS, d.sub_heat, { colors: [P.empty, DS.CPM] });
      /* top cities, coloured by main team */
      hbars('cpm-city', d.cities.map(c => ({ name: c.name, n: c.n, color: TEAMC[(c.team - 1) % TEAMC.length] })), DS.CPM, { labelW: 110 });
      /* service title treemap */
      const tc = ['#F0147F', '#2F6BFF', '#FFB020', '#8B5CF6', '#00B8A9', '#F0558A', '#64748B', '#14B870'];
      ec('cpm-title', {
        tooltip: { formatter: p => `<b>${p.name}</b><br>${fmt(p.value)} · ${f1(100 * p.value / total)}%` },
        series: [{ type: 'treemap', top: 8, left: 0, right: 0, bottom: 0, roam: false, nodeClick: false, breadcrumb: { show: false },
          itemStyle: { borderColor: P.edge, borderWidth: 3, gapWidth: 2, borderRadius: 8 },
          label: { show: true, color: '#fff', fontFamily: FONT, fontSize: 13, fontWeight: 700, overflow: 'truncate', formatter: p => `${p.name}\n${fmt(p.value)}` },
          data: d.titles.map((t, i) => ({ name: t.name, value: t.n, itemStyle: { color: tc[i % tc.length] } })) }],
      });
      /* weekday x hour */
      heat('cpm-hw', Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), DOW, d.hour_week, { labels: false, colors: [P.empty, DS.CPM], xInterval: 1 });
      /* calendar */
      const dmax = Math.max(...d.daily.map(x => x[1]));
      ec('cpm-cal', {
        tooltip: { formatter: p => `<b>${dateTxt(p.value[0])}</b><br>${fmt(p.value[1])} complaints` },
        visualMap: { show: false, min: 0, max: dmax, inRange: { color: [P.empty, DS.CPM] } },
        calendar: { top: 34, left: 40, right: 14, bottom: 4, cellSize: ['auto', 20], range: d.day_range, itemStyle: { color: P.empty, borderWidth: 3, borderColor: P.edge },
          yearLabel: { show: false }, monthLabel: { color: P.muted, fontSize: 13, nameMap: 'en' }, dayLabel: { color: P.muted, fontSize: 12, firstDay: 1, nameMap: 'en' }, splitLine: { show: false } },
        series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: d.daily, itemStyle: { borderRadius: 4 } }],
      });
      /* site classification */
      ax('cpm-class', {
        chart: { type: 'bar' }, series: [{ name: 'Complaints', data: d.site_class.map(s => s.n) }],
        colors: ['#2F6BFF', '#FFB020', '#14B870', '#8B5CF6', '#F0558A', '#00B8A9', '#64748B', '#FF9A1F'],
        plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 6, barHeight: '62%' } },
        xaxis: { categories: d.site_class.map(s => s.name), labels: { style: { colors: P.muted, fontSize: '13px' }, formatter: v => fmt(v) }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: P.ink2, fontSize: '13.5px' } } }, legend: { show: false }, dataLabels: aLab({ formatter: v => fmt(v) }),
      });
      /* channel */
      hbars('cpm-chan', d.channel.map(c => ({ name: c.name, n: c.n })), '#2F6BFF', { labelW: 190 });
    };
    return { h1: 'Complaints · CPM', kpis: [
      { l: 'Complaints', v: fmt(k.total), s: MT.period, spark: d.monthly, lab: L, c: DS.CPM },
      { l: `${k.last} complaints`, v: fmt(k.last_n), d: dlt(d.monthly, { pct: true, good: 'down', vs: prev }), spark: d.monthly, lab: L, c: '#FF9A1F' },
      { l: 'Coverage complaints', v: f1(k.coverage_share), unit: '%', s: 'of all complaints', bar: k.coverage_share, c: '#2F6BFF' },
      { l: 'Complaints per day', v: f1(k.per_day), s: 'daily average', spark: cal.map(x => x[1]), lab: cal.map(x => dateTxt(x[0]).replace('Sept', 'Sep')), bu: ' / day', c: '#14B870' }], html, draw };
  }

  /* ================================================================ CRR */
  function viewCRR() {
    const d = DATA.crr, k = d.kpis, T = MT.teams;
    const tp = d.team.map(t => t.pct), bi = maxI(tp), wi = minI(tp);
    let lo = { v: 101, s: 0, m: 0 };
    d.sub_heat.forEach(c => { if (c[2] != null && c[2] < lo.v) lo = { v: c[2], s: c[1], m: c[0] }; });
    const fi = maxI(d.status_month['Future Resolved']);
    const cl = d.closure[0], fx = d.fix[0];
    const ti = maxI(d.type.map(x => x.pct));
    const resolved = d.status[0].n;
    const html =
      row(card('crr-month', 8, `CRR is ${pc(k.pct)} overall, lowest in ${k.low_label} at ${pc(k.low_pct)}`, 360),
          card('crr-status', 4, `${pc(100 * resolved / k.rows)} of complaints are resolved`, 360)) +
      row(card('crr-team', 5, `${tn(T[bi])} is best at ${pc(tp[bi])}, ${tn(T[wi])} lowest at ${pc(tp[wi])}`, 340),
          card('crr-heat', 7, `Lowest cell: ${SUBS[lo.s]} in ${L[lo.m]} at ${pc(lo.v)}`, 340)) +
      row(card('crr-stack', 6, `${L[fi]} had the most future-resolved cases (${fmt(d.status_month['Future Resolved'][fi])})`, 340),
          card('crr-closure', 6, `${cl.name} closes ${f1(100 * cl.n / k.rows)}% of complaints`, 340)) +
      row(card('crr-type', 5, `${d.type[ti].name} resolves best at ${pc(d.type[ti].pct)}`, 340),
          card('crr-fix', 7, `${fx.name} is the top fix type (${fmt(fx.n)} of ${fmt(d.fix_total)})`, 340));
    const draw = () => {
      const pmin = Math.floor(Math.min(...d.monthly_pct.filter(v => v != null)) - 4);
      ec('crr-month', {
        grid: G({ right: 10 }), tooltip: Object.assign({}, tipAxis), legend: legend(), xAxis: catAxis(L),
        yAxis: [valAxis({ min: pmin, max: 100, axisLabel: { formatter: v => v + '%' } }), valAxis({ splitLine: { show: false }, position: 'right' })],
        series: [
          { name: 'Complaints considered', type: 'bar', yAxisIndex: 1, data: d.monthly_n, barWidth: '44%', itemStyle: { color: DS.CRR + '38', borderRadius: [8, 8, 0, 0] }, emphasis: { itemStyle: { color: DS.CRR + '66' } } },
          { name: 'CRR %', type: 'line', yAxisIndex: 0, data: d.monthly_pct, smooth: true, symbol: 'circle', symbolSize: 9, lineStyle: { width: 4, color: DS.CRR },
            itemStyle: { color: DS.CRR, borderColor: P.edge, borderWidth: 2 }, label: lab({ position: 'top', formatter: p => f1(p.value) + '%' }) }],
      });
      ax('crr-status', {
        chart: { type: 'donut' }, series: d.status.map(s => s.n), labels: d.status.map(s => s.name), colors: d.status.map(s => RESC[s.name]),
        stroke: { width: 3, colors: [P.edge] }, dataLabels: aLab({ formatter: v => v.toFixed(1) + '%' }), legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '66%', labels: { show: true, name: { color: P.muted, fontSize: '13px' },
          value: { color: P.ink, fontSize: '26px', fontWeight: 800, formatter: v => fmt(+v) },
          total: { show: true, label: 'Complaints', color: P.muted, formatter: w => fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) } } } } },
      });
      /* team lollipop */
      const lmin = Math.floor(Math.min(...tp) - 2);
      ec('crr-team', {
        grid: G({ top: 10, right: 40 }), tooltip: { trigger: 'item', formatter: p => `<b>${p.name}</b><br>CRR ${pc(p.value[0])}` },
        xAxis: valAxis({ min: lmin, max: 100, axisLabel: { formatter: v => v + '%' } }),
        yAxis: catAxis(T.map(tn), { inverse: true, axisLine: { show: false }, axisLabel: { color: P.ink2, fontSize: 14 } }),
        series: [
          { type: 'bar', silent: true, barWidth: 4, data: d.team.map((t, i) => ({ value: t.pct, itemStyle: { color: TEAMC[i % TEAMC.length] + '88', borderRadius: 4 } })) },
          { type: 'scatter', symbolSize: 22, data: d.team.map((t, i) => ({ name: tn(t.team), value: [t.pct, tn(t.team)], itemStyle: { color: TEAMC[i % TEAMC.length], borderColor: P.edge, borderWidth: 3 } })),
            label: lab({ position: 'right', distance: 12, formatter: p => f1(p.value[0]) + '%' }) }],
      });
      /* sub-region x month CRR % */
      heat('crr-heat', L, SUBS, d.sub_heat, { unit: '%', min: Math.floor(Math.min(...d.sub_heat.map(c => c[2]).filter(v => v != null))), max: 100,
        colors: RANK, labelColor: '#fff' });
      ax('crr-stack', {
        chart: { type: 'bar', stacked: true }, series: d.status.map(s => ({ name: s.name, data: d.status_month[s.name] })), colors: d.status.map(s => RESC[s.name]),
        plotOptions: aBar(), xaxis: aCats(L), yaxis: aInt(), dataLabels: aLab({ formatter: v => v > 25 ? fmt(v) : '' }), legend: { position: 'top', horizontalAlign: 'left' },
      });
      hbars('crr-closure', d.closure, '#2F6BFF', { labelW: 200 });
      ax('crr-type', {
        chart: { type: 'radialBar' }, series: d.type.map(x => x.pct), labels: d.type.map(x => x.name), colors: CATC,
        plotOptions: { radialBar: { hollow: { size: '36%' }, track: { background: P.grid }, dataLabels: {
          name: { fontSize: '14px', color: P.ink2 }, value: { fontSize: '20px', fontWeight: 800, color: P.ink, formatter: v => (+v).toFixed(1) + '%' },
          total: { show: true, label: 'CRR', color: P.muted, formatter: () => pc(k.pct) } } } },
        stroke: { lineCap: 'round' }, legend: { show: true, position: 'bottom' },
      });
      hbars('crr-fix', d.fix, DS.CRR, { labelW: 230 });
    };
    const sm = d.status_month;
    return { h1: 'Resolution · CRR', kpis: [
      { l: 'CRR', v: f1(k.pct), unit: '%', s: MT.period, d: dlt(d.monthly_pct, { unit: ' pp', vs: L[L.length - 2] }), spark: d.monthly_pct, lab: L, u: '%', c: DS.CRR },
      { l: 'Complaints considered', v: fmt(k.considered), s: MT.period, spark: d.monthly_n, lab: L, c: '#2F6BFF' },
      { l: 'Future resolved + not resolved', v: fmt(k.unresolved), s: `${pc(100 * k.unresolved / k.considered)} of considered`, spark: d.monthly_open, lab: L, c: '#FFB020' },
      { l: 'Pending resolution', v: fmt(k.pending), s: `${pc(100 * k.pending / k.rows)} of all complaints`, spark: sm['Pending Resolution'], lab: L, c: '#7B61FF' }], html, draw };
  }

  /* ================================================================ CRS */
  function viewCRS() {
    const d = DATA.crs, k = d.kpis, T = MT.teams;
    const share = r => { const resp = r['Satisfied'] + r['Not Satisfied']; return resp ? 100 * r['Satisfied'] / resp : null; };
    const ts = d.team.map(share), bi = maxI(ts), wi = minI(ts);
    const notShare = r => { const resp = r['Satisfied'] + r['Not Satisfied']; return resp ? 100 * r['Not Satisfied'] / resp : null; };
    const ss = d.sub.map(notShare), si = maxI(ss);
    const ty = d.type.map(notShare), tyi = maxI(ty);
    const mv = d.month_sat_resp.filter(v => v != null), c0 = d.city[0];
    const sat0 = d.flow.links.filter(l => l.target === 'Satisfied').reduce((b, l) => l.value > b.value ? l : b, { value: -1, source: '' });
    const html =
      row(card('crs-month', 8, `${pc(k.resp_rate)} of IVR calls got a response`, 360),
          card('crs-donut', 4, `${pc(k.sat_played)} of IVR calls ended satisfied`, 360)) +
      row(card('crs-team', 6, `${tn(T[bi])} is most satisfied at ${pc(ts[bi])} of responses`, 340),
          card('crs-sub', 6, `${SUBS[si]} has the most not-satisfied share (${pc(ss[si])})`, 340)) +
      row(card('crs-flow', 8, `${sat0.source}: ${f1(100 * sat0.value / k.sat)}% of satisfied answers`, 400),
          card('crs-type', 4, `${d.type[tyi].key}: ${pc(ty[tyi])} of responses not satisfied`, 400)) +
      row(card('crs-rate', 6, `Satisfied stays ${pc(Math.min(...mv))}–${pc(Math.max(...mv))} of responses each month`, 340),
          card('crs-city', 6, `${c0.name} has the most not-satisfied customers (${fmt(c0.not)})`, 340));
    const draw = () => {
      ax('crs-month', {
        chart: { type: 'bar', stacked: true, stackType: '100%' }, series: ['Satisfied', 'Not Satisfied', 'No Response'].map(s => ({ name: s, data: d.month[s] })),
        colors: [SATC['Satisfied'], SATC['Not Satisfied'], SATC['No Response']], plotOptions: aBar(), xaxis: aCats(L),
        yaxis: { labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } } },
        dataLabels: aLab({ formatter: (v, o) => { const n = o.w.config.series[o.seriesIndex].data[o.dataPointIndex]; return v > 7 ? fmt(n) : ''; } }),
        legend: { position: 'top', horizontalAlign: 'left' }, tooltip: { y: { formatter: v => fmt(v) } },
      });
      ec('crs-donut', {
        tooltip: { trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fmt(p.value)} · ${f1(p.percent)}%` }, legend: legend({ top: 'auto', bottom: 0, left: 'center' }),
        graphic: [{ type: 'text', left: 'center', top: '38%', style: { text: fmt(k.played), fill: P.ink, font: `800 30px ${FONT}`, textAlign: 'center' } }],
        series: [{ type: 'pie', radius: ['52%', '76%'], center: ['50%', '45%'], itemStyle: { borderColor: P.edge, borderWidth: 3, borderRadius: 8 },
          label: { show: showVals, formatter: '{d}%', color: P.ink, fontFamily: FONT, fontSize: 12.5, fontWeight: 700 }, labelLine: { length: 8, length2: 6 },
          data: [['Satisfied', k.sat], ['Not Satisfied', k.not], ['No Response', k.none]].map(x => ({ name: x[0], value: x[1], itemStyle: { color: SATC[x[0]] } })) }],
      });
      ec('crs-team', {
        grid: G(), tooltip: Object.assign({}, tipAxis), legend: legend(), xAxis: valAxis({ axisLabel: { formatter: v => fmt(v) } }),
        yAxis: catAxis(T.map(tn), { inverse: true, axisLine: { show: false }, axisLabel: { color: P.ink2, fontSize: 14 } }),
        series: ['Satisfied', 'Not Satisfied', 'No Response'].map(s => ({ name: s, type: 'bar', stack: 'a', barWidth: '56%', data: d.team.map(r => r[s]),
          itemStyle: { color: SATC[s] }, label: lab({ show: showVals, formatter: p => p.value > 150 ? fmt(p.value) : '', color: '#fff' }), emphasis: { focus: 'series' } })),
      });
      ax('crs-sub', {
        chart: { type: 'bar', stacked: true, stackType: '100%' }, series: ['Satisfied', 'Not Satisfied', 'No Response'].map(s => ({ name: s, data: d.sub.map(r => r[s]) })),
        colors: [SATC['Satisfied'], SATC['Not Satisfied'], SATC['No Response']], plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 4 } },
        xaxis: { categories: SUBS, labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: P.ink2, fontSize: '13.5px' } } }, dataLabels: aLab({ formatter: (v, o) => v > 6 ? v.toFixed(0) + '%' : '' }),
        legend: { position: 'top', horizontalAlign: 'left' }, tooltip: { y: { formatter: v => fmt(v) } },
      });
      /* closure state -> customer answer */
      const nodeC = n => SATC[n] || '#2F6BFF';
      ec('crs-flow', {
        tooltip: { trigger: 'item', formatter: p => p.dataType === 'edge' ? `${p.data.source} → ${p.data.target}<br><b>${fmt(p.data.value)}</b>` : `<b>${p.name}</b><br>${fmt(p.value)}` },
        series: [{ type: 'sankey', left: 8, right: 150, top: 30, bottom: 8, nodeWidth: 16, nodeGap: 14, draggable: false, emphasis: { focus: 'adjacency' },
          data: d.flow.nodes.map(n => ({ name: n, itemStyle: { color: SATC[n] || '#2F6BFF' } })),
          links: d.flow.links.map(l => ({ source: l.source, target: l.target, value: l.value, lineStyle: { color: nodeC(l.target), opacity: .38, curveness: .5 } })),
          label: { color: P.ink, fontFamily: FONT, fontSize: 12.5, fontWeight: 700 }, lineStyle: { curveness: .5 } }],
      });
      ax('crs-type', {
        chart: { type: 'bar', stacked: true, stackType: '100%' }, series: ['Satisfied', 'Not Satisfied', 'No Response'].map(s => ({ name: s, data: d.type.map(r => r[s]) })),
        colors: [SATC['Satisfied'], SATC['Not Satisfied'], SATC['No Response']], plotOptions: aBar({ columnWidth: '58%' }), xaxis: aCats(d.type.map(r => r.key)), yaxis: { labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } } },
        dataLabels: aLab({ formatter: (v, o) => v > 7 ? fmt(o.w.config.series[o.seriesIndex].data[o.dataPointIndex]) : '' }), legend: { position: 'top', horizontalAlign: 'left' }, tooltip: { y: { formatter: v => fmt(v) } },
      });
      const rmin = Math.floor(Math.min(...d.month_sat_resp.filter(v => v != null), ...d.month_resp_rate.filter(v => v != null)) - 6);
      ec('crs-rate', {
        grid: G(), tooltip: Object.assign({}, tipAxis, { trigger: 'axis' }), legend: legend(), xAxis: catAxis(L), yAxis: valAxis({ min: Math.max(0, rmin), max: 100, axisLabel: { formatter: v => v + '%' } }),
        series: [
          { name: 'Satisfied % of responses', type: 'line', data: d.month_sat_resp, smooth: true, symbol: 'circle', symbolSize: 9, lineStyle: { width: 4, color: SATC['Satisfied'] }, itemStyle: { color: SATC['Satisfied'], borderColor: P.edge, borderWidth: 2 }, label: lab({ position: 'top', formatter: p => f1(p.value) }) },
          { name: 'Response rate %', type: 'line', data: d.month_resp_rate, smooth: true, symbol: 'circle', symbolSize: 9, lineStyle: { width: 4, color: DS.CRS }, itemStyle: { color: DS.CRS, borderColor: P.edge, borderWidth: 2 }, label: lab({ position: 'bottom', formatter: p => f1(p.value) }) }],
      });
      ec('crs-city', {
        grid: G({ top: 10, right: 54 }), tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ps => `<b>${ps[0].name}</b><br>${fmt(ps[0].value)} not satisfied of ${fmt(d.city[ps[0].dataIndex].played)} IVR calls` },
        xAxis: valAxis({ show: false }), yAxis: catAxis(d.city.map(c => c.name), { inverse: true, axisLine: { show: false }, axisLabel: { color: P.ink2, fontSize: 13.5 } }),
        series: [{ type: 'bar', data: d.city.map(c => ({ value: c.not, itemStyle: { color: grad(SATC['Not Satisfied'], true), borderRadius: [0, 7, 7, 0] } })), barWidth: '58%', label: lab({ position: 'right' }) }],
      });
    };
    return { h1: 'Satisfaction · CRS', kpis: [
      { l: 'IVR calls played', v: fmt(k.played), s: MT.period, spark: d.month['Satisfied'].map((v, i) => v + d.month['Not Satisfied'][i] + d.month['No Response'][i]), lab: L, c: DS.CRS },
      { l: 'Satisfied, of responses', v: f1(k.sat_resp), unit: '%', d: dlt(d.month_sat_resp.filter(v => v != null), { unit: ' pp', vs: L[L.length - 2] }), spark: d.month_sat_resp, lab: L, u: '%', c: '#14B870' },
      { l: 'IVR calls answered', v: f1(k.resp_rate), unit: '%', d: dlt(d.month_resp_rate.filter(v => v != null), { unit: ' pp', vs: L[L.length - 2] }), spark: d.month_resp_rate, lab: L, u: '%', c: '#2F6BFF' },
      { l: 'Not satisfied', v: fmt(k.not), s: 'customers', spark: d.month['Not Satisfied'], lab: L, c: '#F0147F' }], html, draw };
  }

  /* ================================================================ L-3 TAT */
  function viewTAT() {
    const d = DATA.tat, k = d.kpis, T = MT.teams, tm = TL;
    const openT = T.map((t, i) => d.status_team['Pending Within TAT'][i] + d.status_team['TAT Over'][i]);
    const oi = maxI(openT);
    let ob = { v: -1, t: 0, m: 0 };
    d.open_heat.forEach(c => { if (c[2] > ob.v) ob = { v: c[2], t: c[1], m: c[0] }; });
    const hmode = d.hand_dist.reduce((b, c) => c.n > b.n ? c : b, d.hand_dist[0]);
    const hi = maxI(d.hand_team);
    const rv = d.reopen_month.filter(v => v != null);
    const nt = d.arpu.find(a => a.name === 'Not tagged');
    const subTot = d.sub_keys.map((s, si) => sum(d.sub_heat.filter(c => c[1] === si).map(c => c[2])));
    const mapped = SUBS.map((s, i) => subTot[i]), mi = maxI(mapped);
    const covSh = T.map((t, i) => { const tot = sum(CATS.map(c => d.type_team[c][i])); return tot ? 100 * d.type_team['Coverage'][i] / tot : 0; });
    const html =
      row(card('tat-month', 8, `${pc(k.within_pct)} of cases are within TAT, ${fmt(k.over)} are over`, 360),
          card('tat-donut', 4, `${fmt(k.pending)} cases pending within TAT`, 360)) +
      row(card('tat-open', 6, `${tn(T[oi])} holds the most open cases (${fmt(openT[oi])})`, 340),
          card('tat-openheat', 6, `Open cases peak: ${tn(T[ob.t])} in ${tm[ob.m]} (${fmt(ob.v)})`, 340)) +
      row(card('tat-hand', 6, `Most cases change hands ${hmode.k} times (${fmt(hmode.n)} cases)`, 340),
          card('tat-handteam', 6, `${tn(T[hi])} averages ${f1(d.hand_team[hi])} handovers per case`, 340)) +
      row(card('tat-reopen', 6, `${pc(k.reopen_pct)} of cases were re-opened at least once`, 340),
          card('tat-arpu', 6, nt ? `${f1(100 * nt.n / k.total)}% of cases carry no ARPU level` : 'Cases by ARPU level', 340)) +
      row(card('tat-sub', 8, `${SUBS[mi]} has the most cases (${fmt(mapped[mi])})`, 360),
          card('tat-type', 4, `Coverage is ${f1(Math.min(...covSh))}–${f1(Math.max(...covSh))}% of each team's cases`, 360));
    const draw = () => {
      ec('tat-month', {
        grid: G(), tooltip: Object.assign({}, tipAxis), legend: legend(), xAxis: catAxis(tm), yAxis: valAxis({ axisLabel: { formatter: v => fmt(v) } }),
        series: Object.keys(TATC).map(s => ({ name: s, type: 'bar', stack: 'a', barWidth: '46%', data: d.status_month[s], itemStyle: { color: TATC[s] },
          label: lab({ show: showVals && s === 'Within TAT', position: 'inside', color: '#fff', formatter: p => fmt(p.value) }), emphasis: { focus: 'series' } })),
      });
      ax('tat-donut', {
        chart: { type: 'donut' }, series: Object.keys(TATC).map(s => k[s === 'Within TAT' ? 'within' : s === 'Pending Within TAT' ? 'pending' : 'over']),
        labels: Object.keys(TATC), colors: Object.values(TATC), stroke: { width: 3, colors: [P.edge] }, dataLabels: aLab({ formatter: v => v < 2 ? '' : v.toFixed(1) + '%' }), legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '66%', labels: { show: true, name: { color: P.muted, fontSize: '13px' }, value: { color: P.ink, fontSize: '26px', fontWeight: 800, formatter: v => fmt(+v) },
          total: { show: true, label: 'Cases', color: P.muted, formatter: w => fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) } } } } },
      });
      ax('tat-open', {
        chart: { type: 'bar', stacked: true }, series: [{ name: 'Pending Within TAT', data: d.status_team['Pending Within TAT'] }, { name: 'TAT Over', data: d.status_team['TAT Over'] }],
        colors: [TATC['Pending Within TAT'], TATC['TAT Over']], plotOptions: aBar(), xaxis: aCats(T.map(tn)), yaxis: aInt(), dataLabels: aLab({ formatter: v => v > 0 ? fmt(v) : '' }), legend: { position: 'top', horizontalAlign: 'left' },
      });
      heat('tat-openheat', tm, T.map(tn), d.open_heat, { colors: [P.empty, TATC['TAT Over']] });
      ec('tat-hand', {
        grid: G(), tooltip: Object.assign({}, tipAxis, { formatter: ps => `<b>${ps[0].name} handovers</b><br>${fmt(ps[0].value)} cases` }),
        xAxis: catAxis(d.hand_dist.map(x => String(x.k))), yAxis: valAxis({ axisLabel: { formatter: v => fmt(v) } }),
        series: [{ type: 'bar', data: d.hand_dist.map(x => x.n), barWidth: '56%', itemStyle: { color: grad(DS.TAT), borderRadius: [7, 7, 0, 0] }, label: lab({ position: 'top', fontSize: 12 }) }],
      });
      ax('tat-handteam', {
        chart: { type: 'radar' }, series: [{ name: 'Avg handovers', data: d.hand_team }], colors: [DS.TAT], labels: T.map(tn),
        stroke: { width: 3, colors: [DS.TAT] }, fill: { opacity: .22, colors: [DS.TAT] }, markers: { size: 5, colors: [DS.TAT], strokeWidth: 0 },
        yaxis: { show: false, min: Math.floor(Math.min(...d.hand_team) - 1) }, dataLabels: aLab({ background: { enabled: false }, formatter: v => f1(v), style: { colors: [P.ink], fontSize: '12px' } }),
        plotOptions: { radar: { polygons: { strokeColors: P.grid, connectorColors: P.grid, fill: { colors: ['transparent'] } } } }, legend: { show: false },
        xaxis: { labels: { style: { colors: Array(T.length).fill(P.ink2), fontSize: '13.5px' } } },
      });
      ax('tat-reopen', {
        chart: { type: 'area' }, series: [{ name: 'Re-opened %', data: d.reopen_month }], colors: [DS.TAT], stroke: { width: 4, curve: 'smooth' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: .42, opacityTo: .04, stops: [0, 95] } }, markers: { size: 5, strokeWidth: 0, hover: { size: 7 } },
        xaxis: aCats(tm), yaxis: { min: 0, max: Math.min(100, Math.ceil(Math.max(...rv) / 10) * 10 + 10), labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } } },
        dataLabels: aLab({ formatter: v => f1(v) + '%', offsetY: -6, style: { colors: [P.ink], fontSize: '12px' } }), legend: { show: false },
      });
      const ac = ['#2F6BFF', '#FFB020', '#8B5CF6', '#00B8A9', '#F0558A', '#14B870', '#FF9A1F', '#64748B'];
      ec('tat-arpu', {
        tooltip: { trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fmt(p.value)} · ${f1(p.percent)}%` }, legend: legend({ top: 'auto', bottom: 0, left: 'center', type: 'scroll' }),
        series: [{ type: 'pie', roseType: 'radius', radius: ['16%', '70%'], center: ['50%', '45%'], itemStyle: { borderColor: P.edge, borderWidth: 2, borderRadius: 6 },
          label: { show: showVals, formatter: '{b}\n{c}', color: P.ink, fontFamily: FONT, fontSize: 12, fontWeight: 700 }, labelLine: { length: 8, length2: 6 },
          data: d.arpu.map((a, i) => ({ name: a.name, value: a.n, itemStyle: { color: a.name === 'Not tagged' ? '#475569' : ac[i % ac.length] } })) }],
      });
      heat('tat-sub', tm, d.sub_keys, d.sub_heat, { colors: [P.empty, DS.TAT] });
      ax('tat-type', {
        chart: { type: 'bar', stacked: true, stackType: '100%' }, series: CATS.map(c => ({ name: c, data: d.type_team[c] })), colors: CATC, plotOptions: aBar({ columnWidth: '60%' }),
        xaxis: aCats(T.map(tn)), yaxis: { labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } } },
        dataLabels: aLab({ formatter: (v, o) => v > 8 ? fmt(o.w.config.series[o.seriesIndex].data[o.dataPointIndex]) : '' }), legend: { position: 'top', horizontalAlign: 'left' }, tooltip: { y: { formatter: v => fmt(v) } },
      });
    };
    const sm = d.status_month, tot = DATA.compare.vol.TAT.filter(v => v != null), wpct = d.within_month;   // cases per month, Within-TAT % per month (same definition as the number)
    return { h1: 'L-3 TAT', kpis: [
      { l: 'L-3 cases', v: fmt(k.total), s: tm.join(' · '), spark: tot, lab: tm, c: DS.TAT },
      { l: 'Within TAT', v: f1(k.within_pct), unit: '%', d: dlt(wpct.filter(v => v != null), { unit: ' pp', vs: tm[tm.length - 2] }), spark: wpct, lab: tm, u: '%', c: '#14B870' },
      { l: 'TAT over', v: fmt(k.over), s: `${pc(100 * k.over / k.total)} of cases`, spark: sm['TAT Over'], lab: tm, c: '#F0147F' },
      { l: 'Re-opened at least once', v: f1(k.reopen_pct), unit: '%', s: 'of cases', spark: d.reopen_month, lab: tm, u: '%', c: '#7B61FF' }], html, draw };
  }

  /* ================================================================ Compare */
  function viewCompare() {
    const d = DATA.compare, rows = MT.rows;
    const crrK = DATA.crr.kpis, crsK = DATA.crs.kpis, tatK = DATA.tat.kpis, f = d.funnel;
    const rates = [].concat(d.rates.CRR, d.rates.CRS, d.rates.TAT).filter(v => v != null);
    const MEAS = [['CRR %', 'crr', true], ['Satisfied %', 'sat', true], ['Within TAT %', 'tat', true], ['Re-opened %', 'reopen', false]];
    const norm = list => MEAS.map(m => { const vs = list.map(r => r[m[1]]).filter(v => v != null), lo = Math.min(...vs), hi = Math.max(...vs); return { lo, hi }; });
    const score = (list, nr) => list.map(r => { const s = MEAS.map((m, i) => { const v = r[m[1]]; if (v == null || nr[i].hi === nr[i].lo) return .5; const x = (v - nr[i].lo) / (nr[i].hi - nr[i].lo); return m[2] ? x : 1 - x; }); return sum(s) / s.length; });
    const tNr = norm(d.team_score), sNr = norm(d.sub_score), tSc = score(d.team_score, tNr), sSc = score(d.sub_score, sNr);
    const tLead = ['CPM', 'CRR', 'CRS', 'TAT'].map(x => maxI(d.team_vol[x]));
    const same = tLead.every(i => i === tLead[0]);
    const cov = Object.values(d.type_mix).map(a => 100 * a[0] / sum(a));
    const html =
      row(card('cmp-vol', 8, `Complaints, CRR, CRS and TAT volumes by month`, 360),
          card('cmp-funnel', 4, `${fmt(f[5].n)} of ${fmt(f[0].n)} complaints end satisfied`, 360)) +
      row(card('cmp-rates', 12, `Within TAT stays ${pc(Math.min(...d.rates.TAT.filter(v => v != null)))}–${pc(Math.max(...d.rates.TAT.filter(v => v != null)))}; CRR dips to ${pc(Math.min(...d.rates.CRR.filter(v => v != null)))}`, 340)) +
      row(card('cmp-team', 6, `${d.team_score[maxI(tSc)].label} ranks highest across the four measures`, 360),
          card('cmp-sub', 6, `${d.sub_score[maxI(sSc)].label} ranks highest across the four measures`, 360)) +
      row(card('cmp-teamvol', 6, same ? `${tn(MT.teams[tLead[0]])} is the largest team in all four datasets` : 'The largest team differs by dataset', 340),
          card('cmp-mix', 6, `Coverage is ${f1(Math.min(...cov))}–${f1(Math.max(...cov))}% in every dataset`, 340));
    const draw = () => {
      const present = k => d.vol[k];
      ec('cmp-vol', {
        grid: G(), tooltip: Object.assign({}, tipAxis, { trigger: 'axis' }), legend: legend(), xAxis: catAxis(L), yAxis: valAxis({ axisLabel: { formatter: v => fmt(v) } }),
        series: ['CPM', 'CRR', 'CRS', 'TAT'].map(s => ({ name: s, type: 'line', data: present(s), smooth: true, symbol: 'circle', symbolSize: 8, connectNulls: false,
          lineStyle: { width: 3.5, color: DS[s] }, itemStyle: { color: DS[s], borderColor: P.edge, borderWidth: 2 }, areaStyle: { color: DS[s] + '1C' },
          label: lab({ show: showVals && s === 'CPM', position: 'top', fontSize: 12 }), emphasis: { focus: 'series' } })),
      });
      ec('cmp-funnel', {
        tooltip: { trigger: 'item', formatter: p => `<b>${p.name}</b><br>${fmt(p.value)}` },
        series: [{ type: 'funnel', left: '5%', right: '5%', top: 12, bottom: 12, minSize: '22%', maxSize: '100%', sort: 'none', gap: 4,
          label: { show: true, position: 'inside', color: '#fff', fontFamily: FONT, fontSize: 13, fontWeight: 700, formatter: p => `${p.name}\n${fmt(p.value)}` },
          itemStyle: { borderWidth: 0, borderRadius: 6 }, emphasis: { label: { fontSize: 14 } },
          data: f.map((s, i) => ({ name: s.name, value: s.n, itemStyle: { color: ['#F0147F', '#3FD18F', '#14B870', '#9A85FF', '#7B61FF', '#5B3FE0'][i] } })) }],
      });
      const rv = [].concat(d.rates.CRR, d.rates.CRS, d.rates.TAT).filter(v => v != null);
      ax('cmp-rates', {
        chart: { type: 'line' }, series: [{ name: 'CRR %', data: d.rates.CRR }, { name: 'Satisfied % of CRS responses', data: d.rates.CRS }, { name: 'Within TAT %', data: d.rates.TAT }],
        colors: [DS.CRR, DS.CRS, DS.TAT], stroke: { width: 4, curve: 'smooth' }, markers: { size: 5, strokeWidth: 0, hover: { size: 7 } }, xaxis: aCats(L),
        yaxis: { min: Math.floor(Math.min(...rv) / 5) * 5 - 5, max: 100, labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } } },
        dataLabels: aLab({ formatter: v => v == null ? '' : v.toFixed(1), offsetY: -8, style: { colors: [P.ink], fontSize: '11.5px' } }), legend: { position: 'top', horizontalAlign: 'left' },
      });
      const scoreboard = (id, list, nr, labelFor) => {
        const cells = [];
        list.forEach((r, ri) => MEAS.forEach((m, mi) => {
          const v = r[m[1]];
          const x = (v == null || nr[mi].hi === nr[mi].lo) ? .5 : (v - nr[mi].lo) / (nr[mi].hi - nr[mi].lo);
          cells.push([mi, ri, m[2] ? x : 1 - x, v]);
        }));
        ec(id, {
          grid: G({ top: 34, left: 4, right: 10 }),
          tooltip: { position: 'top', formatter: p => `<b>${list[p.value[1]].label}</b> · ${MEAS[p.value[0]][0]}<br>${pc(p.value[3])}` },
          xAxis: catAxis(MEAS.map(m => m[0]), { position: 'top', axisLine: { show: false }, axisLabel: { color: P.ink2, fontSize: 13.5, fontWeight: 700 } }),
          yAxis: catAxis(list.map(labelFor), { inverse: true, axisLine: { show: false }, axisLabel: { color: P.ink2, fontSize: 13.5 } }),
          visualMap: { show: false, dimension: 2, min: 0, max: 1, inRange: { color: RANK } },
          series: [{ type: 'heatmap', data: cells, itemStyle: { borderColor: P.edge, borderWidth: 3, borderRadius: 6 },
            label: { show: true, color: '#fff', fontFamily: FONT, fontSize: 13.5, fontWeight: 800, formatter: p => pc(p.value[3]) }, emphasis: { itemStyle: { borderColor: '#B4F03C' } } }],
        });
      };
      scoreboard('cmp-team', d.team_score, tNr, r => `${r.label} · ${fmt(r.n)}`);
      scoreboard('cmp-sub', d.sub_score, sNr, r => `${r.label} · ${fmt(r.n)}`);
      ax('cmp-teamvol', {
        chart: { type: 'bar' }, series: ['CPM', 'CRR', 'CRS', 'TAT'].map(s => ({ name: s, data: d.team_vol[s] })), colors: [DS.CPM, DS.CRR, DS.CRS, DS.TAT],
        plotOptions: { bar: { columnWidth: '72%', borderRadius: 4, borderRadiusApplication: 'end' } }, xaxis: aCats(MT.teams.map(tn)), yaxis: aInt(),
        dataLabels: aLab({ style: { fontSize: '10.5px', fontWeight: 700, colors: [P.ink] }, offsetY: -18, formatter: v => fmt(v) }), legend: { position: 'top', horizontalAlign: 'left' },
      });
      ax('cmp-mix', {
        chart: { type: 'bar', stacked: true, stackType: '100%' }, series: CATS.map((c, i) => ({ name: c, data: ['CPM', 'CRR', 'CRS', 'TAT'].map(s => d.type_mix[s][i]) })), colors: CATC,
        plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
        xaxis: { categories: ['CPM', 'CRR', 'CRS', 'TAT'], labels: { formatter: v => Math.round(v) + '%', style: { colors: P.muted, fontSize: '13px' } }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: P.ink2, fontSize: '14px' } } }, dataLabels: aLab({ formatter: (v, o) => v > 6 ? v.toFixed(0) + '%' : '' }),
        legend: { position: 'top', horizontalAlign: 'left' }, tooltip: { y: { formatter: v => fmt(v) } },
      });
    };
    return { h1: 'Compare · CPM, CRR, CRS, TAT', kpis: [
      { l: 'CPM complaints', v: fmt(rows.CPM), s: MT.period, spark: d.vol.CPM, lab: L, c: DS.CPM },
      { l: 'CRR', v: f1(crrK.pct), unit: '%', s: 'of considered complaints', spark: d.rates.CRR, lab: L, u: '%', c: DS.CRR },
      { l: 'CRS satisfied, of responses', v: f1(crsK.sat_resp), unit: '%', spark: d.rates.CRS, lab: L, u: '%', c: DS.CRS },
      { l: 'Within TAT', v: f1(tatK.within_pct), unit: '%', spark: d.rates.TAT, lab: L, u: '%', c: DS.TAT }], html, draw };
  }

  /* ================================================================ router */
  const VIEWS = { cpm: viewCPM, crr: viewCRR, crs: viewCRS, tat: viewTAT, compare: viewCompare };
  function show() {
    const view = document.getElementById('view');
    if (!window.echarts || !window.ApexCharts) {
      view.innerHTML = '<div class="card c12"><div class="chart-error">The chart libraries could not be loaded. Check the internet connection, or copy echarts.min.js and apexcharts.min.js into static/dashboard/js/.</div></div>';
      return;
    }
    const key = (location.hash || '#cpm').slice(1);
    const k = VIEWS[key] ? key : 'cpm';
    live.splice(0).forEach(c => c.dispose());
    P = pal();
    const v = VIEWS[k]();
    document.getElementById('h1').textContent = v.h1;
    document.getElementById('hero-kpis').innerHTML = kpiHTML(v.kpis);
    view.innerHTML = v.html;
    document.querySelectorAll('#tabs a').forEach(a => { const on = a.dataset.k === k; a.classList.toggle('on', on); a.setAttribute('aria-current', on ? 'page' : 'false'); });
    document.title = v.h1 + ' · RCTO Central Performance Hub';
    v.draw();
    if (lastKey !== k) window.scrollTo(0, 0);
    lastKey = k;
  }
  document.getElementById('periodLbl').textContent = MT.period;
  window.addEventListener('hashchange', show);
  let rz = null;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => live.forEach(c => c.resize()), 120); });
  new MutationObserver(show).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const vb = document.getElementById('vals');
  vb.addEventListener('click', () => { showVals = !showVals; vb.classList.toggle('on', showVals); vb.setAttribute('aria-pressed', String(showVals)); show(); });
  show();
})();