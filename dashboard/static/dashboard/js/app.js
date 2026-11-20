/* RCTO Central dashboards - chart primitives and the first three dashboards (D3 v7). */
const VIEWS = {"complaints": {"h1": "Complaints &amp; Fiber Cuts", "sub": "RCTO Central · January to October 2026", "body": "\u003csection class=\"grid\">\n  \u003carticle class=\"card c8\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Month by month\u003c/h2>\u003cp class=\"cap\" id=\"cap-combo\">\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"combo\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Do they move together?\u003c/h2>\u003cp class=\"cap\">Each dot is one month of 2026\u003c/p>\u003c/div>\u003cspan class=\"badge\" id=\"r-badge\">\u003c/span>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"scatter\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c12\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Sub-region by sub-region\u003c/h2>\u003cp class=\"cap\">Bars: complaints · Line: OFC cuts · r = correlation\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"minis\" id=\"minis\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Which fiber type tracks complaints?\u003c/h2>\u003cp class=\"cap\">Correlation by link type\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"linkr\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c8\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Fiber cuts, 2025 vs 2026\u003c/h2>\u003cp class=\"cap\" id=\"cap-yoy\">OFC cuts per month\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"yoy\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c8\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>What customers complain about\u003c/h2>\u003cp class=\"cap\">Complaints per month by type\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"mix\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Sites on a cut section\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"sitelink\">\u003c/div>\n  \u003c/article>\n\u003c/section>"}, "fops": {"h1": "FOPs C1 to C6", "sub": "RCTO Central · routing team view · January to October 2026", "body": "\u003csection class=\"grid\">\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Share by FOPs team\u003c/h2>\u003cp class=\"cap\">All complaints routed to FOPs\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart donut-wrap\" id=\"donut\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c8\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Team × month\u003c/h2>\u003cp class=\"cap\">Complaints routed to each team\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"heat\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c8\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Trend by team\u003c/h2>\u003cp class=\"cap\">Complaints per month\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"lines\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Complaint type\u003c/h2>\u003cp class=\"cap\">Mix inside each team\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"mixbar\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c5\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Top cities\u003c/h2>\u003cp class=\"cap\">Colour = team handling most of them\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"cities\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c7\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>When complaints arrive\u003c/h2>\u003cp class=\"cap\">Share of complaints by time of day\u003c/p>\u003c/div>\u003cspan class=\"badge neutral\" id=\"peak-badge\">\u003c/span>\u003c/div>\n    \u003cdiv class=\"parts\" id=\"parts\">\u003c/div>\n    \u003cdiv class=\"chart\" id=\"hourarea\">\u003c/div>\n    \u003cp class=\"cap\" style=\"margin-top:6px\">By day of week\u003c/p>\n    \u003cdiv class=\"chart\" id=\"weekbars\">\u003c/div>\n  \u003c/article>\n\u003c/section>"}, "drivers": {"h1": "Availability, Load Shedding &amp; Fiber", "sub": "What moves FOPs complaints, month on month · January to October 2026", "body": "\u003cdiv class=\"toolbar\">\n  \u003cdiv class=\"seg\" id=\"basis\" role=\"group\" aria-label=\"Group complaints by\">\n    \u003cbutton type=\"button\" data-b=\"fops\" class=\"on\">FOPs team\u003c/button>\n    \u003cbutton type=\"button\" data-b=\"geo\">Site region\u003c/button>\n  \u003c/div>\n  \u003cspan class=\"hint\">Hover any month to compare all measures\u003c/span>\n\u003c/div>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c12\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Four measures, same months\u003c/h2>\u003cp class=\"cap\">One column per FOPs team · same scale across teams\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"matrix-scroll\">\u003cdiv class=\"matrix\" id=\"matrix\">\u003c/div>\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c12\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Month by month, team by team\u003c/h2>\u003cp class=\"cap\">Pick a measure · click a team to hide it\u003c/p>\u003c/div>\n      \u003cdiv class=\"seg\" id=\"mseg\">\u003cbutton type=\"button\" data-m=\"avail\" class=\"on\">Availability\u003c/button>\u003cbutton type=\"button\" data-m=\"ls\">Load shedding\u003c/button>\u003cbutton type=\"button\" data-m=\"cuts\">OFC cuts\u003c/button>\u003cbutton type=\"button\" data-m=\"complaints\">Complaints\u003c/button>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"mline\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c7\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Correlation with complaints\u003c/h2>\u003cp class=\"cap\">Month on month, by team\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"rtable\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c5\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Availability vs load shedding\u003c/h2>\u003cp class=\"cap\">Each bubble is a team-month · size = complaints per 100 sites\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"bubble\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>By site availability\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003cspan class=\"badge\" id=\"av-badge\">\u003c/span>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"avbars\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>By load shedding\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003cspan class=\"badge violet\" id=\"ls-badge\">\u003c/span>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"lsbars\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Both together\u003c/h2>\u003cp class=\"cap\">Availability × load shedding\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"grid2d\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c6\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Cell availability, month by month\u003c/h2>\u003cp class=\"cap\">Central average per site\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"availyoy\">\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c6\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Load shedding, month by month\u003c/h2>\u003cp class=\"cap\">Central average, hours per day per site\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"lsyoy\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c8\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Do fiber cuts pull the network down?\u003c/h2>\u003cp class=\"cap\">Each dot is one month · OFC cuts vs network stat\u003c/p>\u003c/div>\n      \u003cdiv class=\"seg\" id=\"nseg\">\u003cbutton type=\"button\" data-m=\"avail\" class=\"on\">Availability\u003c/button>\u003cbutton type=\"button\" data-m=\"ls\">Load shedding\u003c/button>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"cutscatter\">\u003c/div>\n    \u003cdiv class=\"head\" style=\"margin:6px 0 0\">\u003cspan class=\"badge neutral\" id=\"nbadge\">\u003c/span>\u003c/div>\n  \u003c/article>\n  \u003carticle class=\"card c4\">\n    \u003cdiv class=\"head\">\u003cdiv>\u003ch2>Cuts vs network, by team\u003c/h2>\u003cp class=\"cap\">Correlation with monthly OFC cuts\u003c/p>\u003c/div>\u003c/div>\n    \u003cdiv class=\"chart\" id=\"ntable\">\u003c/div>\n  \u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c4\">\u003cdiv class=\"head\">\u003cdiv>\u003ch2>By site group\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003c/div>\u003cdiv class=\"chart\" id=\"grpbars\">\u003c/div>\u003c/article>\n  \u003carticle class=\"card c4\">\u003cdiv class=\"head\">\u003cdiv>\u003ch2>By power backup\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003c/div>\u003cdiv class=\"chart\" id=\"bbbars\">\u003c/div>\u003c/article>\n  \u003carticle class=\"card c4\">\u003cdiv class=\"head\">\u003cdiv>\u003ch2>Chronic below-target sites\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003c/div>\u003cdiv class=\"chart\" id=\"chrbars\">\u003c/div>\u003c/article>\n\u003c/section>\n\n\u003csection class=\"grid\">\n  \u003carticle class=\"card c4\">\u003cdiv class=\"head\">\u003cdiv>\u003ch2>By DG status\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003c/div>\u003cdiv class=\"chart\" id=\"dgbars\">\u003c/div>\u003c/article>\n  \u003carticle class=\"card c8\">\u003cdiv class=\"head\">\u003cdiv>\u003ch2>Top grids by complaints\u003c/h2>\u003cp class=\"cap\">Complaints per 100 site-months\u003c/p>\u003c/div>\u003c/div>\u003cdiv class=\"chart\" id=\"gridrank\">\u003c/div>\u003c/article>\n\u003c/section>"}};
/* Shared chart primitives (D3 v7). Pages call C.combo(), C.bars(), ... */
function initCharts(P) {
  'use strict';

  const T = P.theme;
  const D = P.data;
  const fmt = d3.format(',');
  const f1 = d3.format('.1f');
  const f2 = d3.format('.2f');
  const tipEl = d3.select('#tip');
  const redraws = [];
  let animate = true;
  setTimeout(() => { animate = false; }, 1600);

  /* ------------------------------------------------------------ tooltip */
  const tip = {
    show(html, ev) {
      tipEl.html(html).style('opacity', 1);
      const node = tipEl.node();
      const pad = 14;
      let x = ev.clientX + pad;
      let y = ev.clientY + pad;
      if (x + node.offsetWidth > window.innerWidth - 8) x = ev.clientX - node.offsetWidth - pad;
      if (y + node.offsetHeight > window.innerHeight - 8) y = ev.clientY - node.offsetHeight - pad;
      tipEl.style('left', x + 'px').style('top', y + 'px');
    },
    hide() { tipEl.style('opacity', 0); },
  };
  const row = (color, text) => `<div class="row"><i style="background:${color}"></i>${text}</div>`;

  /* ------------------------------------------------------------ chart shell */
  function chart(sel, opt, draw) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    const run = () => {
      const w = Math.max(opt.minW || 180, el.clientWidth);
      const h = opt.h || 260;
      const m = Object.assign({ t: 12, r: 12, b: 28, l: 36 }, opt.m || {});
      d3.select(el).selectAll('svg').remove();
      const svg = d3.select(el).append('svg').attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);
      const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
      draw(g, w - m.l - m.r, h - m.t - m.b, svg, animate);
    };
    if (el.__reg) { const k = redraws.indexOf(el.__reg); if (k > -1) redraws.splice(k, 1); }
    el.__reg = run;
    run();
    redraws.push(run);
    return run;
  }
  let rz;
  if (window.__rzh) window.removeEventListener('resize', window.__rzh);
  window.__rzh = () => { clearTimeout(rz); rz = setTimeout(() => redraws.forEach(f => f()), 160); };
  window.addEventListener('resize', window.__rzh);

  function yAxis(g, y, w, o = {}) {
    const ax = g.append('g').attr('class', 'axis gridline')
      .call(d3.axisLeft(y).ticks(o.ticks || 5).tickSize(-w).tickFormat(o.fmt || (d => d)).tickPadding(8));
    ax.select('.domain').remove();
    if (o.color) ax.selectAll('text').style('fill', o.color);
    return ax;
  }
  function yAxisRight(g, y, w, o = {}) {
    const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(${w},0)`)
      .call(d3.axisRight(y).ticks(o.ticks || 5).tickSize(0).tickFormat(o.fmt || (d => d)).tickPadding(10));
    ax.select('.domain').remove();
    if (o.color) ax.selectAll('text').style('fill', o.color);
    return ax;
  }
  function xAxisBand(g, x, h, labels, o = {}) {
    const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(i => labels[i]).tickSize(0).tickPadding(10));
    ax.select('.domain').remove();
    if (o.every) ax.selectAll('text').style('display', (d, i) => (i % o.every ? 'none' : null));
    return ax;
  }

  /* hero strand animation removed in the new design */
  function strands() {}

  /* ------------------------------------------------------------ hero KPIs + story chips */
  function kpis(list) {
    const KC = ['var(--m-complaints)', 'var(--m-cuts)', 'var(--m-avail)', 'var(--m-ls)'];
    KPI.render(list.map((k, i) => Object.assign({ c: KC[i % KC.length] }, k)));   // card markup lives in js/kpi.js
  }
  function story(list) {
    document.getElementById('story').innerHTML = list
      .map(s => `<span class="chip"><i style="background:${s.c}"></i><span>${s.t}</span></span>`).join('');
  }

  /* ------------------------------------------------------------ bars + line combo */
  function combo(el, o) {
    chart(el, { h: o.h || 340, m: { t: 22, r: 46, b: 32, l: 46 } }, (g, w, h, svg, anim) => {
      const n = o.labels.length;
      const x = d3.scaleBand().domain(d3.range(n)).range([0, w]).padding(0.34);
      const y1 = d3.scaleLinear().domain([0, d3.max(o.bars) * 1.12]).nice().range([h, 0]);
      const y2 = d3.scaleLinear().domain([0, d3.max([...(o.hideLine ? [] : o.line), ...(o.line2 && !o.hideLine2 ? o.line2 : []), ...(o.target && !o.hideTarget ? [o.target.y] : []), 1]) * 1.12]).nice().range([h, 0]);
      yAxis(g, y1, w, { fmt, color: o.barColor }).selectAll('text').style('display', o.hideBars ? 'none' : null);
      if (!o.hideLine) yAxisRight(g, y2, w, { fmt, color: o.lineColor });
      xAxisBand(g, x, h, o.labels);

      const bars = g.append('g');
      const pk = d3.maxIndex(o.bars);
      bars.selectAll('rect').data(o.hideBars ? [] : o.bars).join('rect')
        .attr('x', (d, i) => x(i)).attr('width', x.bandwidth()).attr('rx', 7)
        .attr('fill', o.barColor).attr('opacity', (d, i) => (i === pk ? 1 : 0.82))
        .attr('y', anim ? h : (d => (d == null ? h : y1(d)))).attr('height', anim ? 0 : (d => (d == null ? 0 : h - y1(d))))
        .call(s => { if (anim) s.transition().delay((d, i) => 250 + i * 55).duration(700).ease(d3.easeCubicOut)
          .attr('y', d => (d == null ? h : y1(d))).attr('height', d => (d == null ? 0 : h - y1(d))); });

      const line = d3.line().x((d, i) => x(i) + x.bandwidth() / 2).y(d => y2(d)).curve(d3.curveMonotoneX);
      const lp = g.append('path').attr('d', o.hideLine ? null : line(o.line)).attr('fill', 'none')
        .attr('stroke', o.lineColor).attr('stroke-width', 3.2).attr('stroke-linecap', 'round');
      if (anim) {
        const L = lp.node().getTotalLength();
        lp.attr('stroke-dasharray', L).attr('stroke-dashoffset', L)
          .transition().delay(600).duration(1100).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0);
      }
      g.selectAll('circle.pt').data(o.hideLine ? [] : o.line).join('circle').attr('class', 'pt')
        .attr('cx', (d, i) => x(i) + x.bandwidth() / 2).attr('cy', d => y2(d)).attr('r', 4.6)
        .attr('fill', '#fff').attr('stroke', o.lineColor).attr('stroke-width', 2.6);
      if (o.line2 && !o.hideLine2) g.append('path').attr('d', line(o.line2)).attr('fill', 'none').attr('stroke', o.line2Color)
        .attr('stroke-width', 2.6).attr('stroke-dasharray', '6 5').attr('stroke-linecap', 'round');
      if (o.target && !o.hideTarget) {
        g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y2(o.target.y)).attr('y2', y2(o.target.y)).attr('stroke', o.target.color)
          .attr('stroke-width', 2).attr('stroke-dasharray', '2 6').attr('stroke-linecap', 'round');
        g.append('text').attr('class', 'lbl').style('fill', o.target.color).attr('x', 6).attr('y', y2(o.target.y) - 7).text(o.target.label);
      }

      const halo = s => s.style('paint-order', 'stroke').style('stroke', 'var(--card)').style('stroke-width', 3);
      g.selectAll('text.bv').data(o.hideBars || !vals() ? [] : o.bars).join('text').attr('class', 'lbl bv').attr('text-anchor', 'middle').style('fill', '#fff')
        .attr('x', (d, i) => x(i) + x.bandwidth() / 2).attr('y', d => (d == null ? h : y1(d) + 17)).text(d => (d == null ? '' : fmt(d)));
      g.selectAll('text.nd').data(o.hideBars ? [] : o.bars.map((v, i) => ({ v, i })).filter(d => d.v == null)).join('text').attr('class', 'lbl nd').attr('text-anchor', 'middle').style('fill', 'var(--muted)')
        .attr('x', d => x(d.i) + x.bandwidth() / 2).attr('y', h - 8).text('no data');
      g.selectAll('text.lv').data(o.hideLine || !vals() ? [] : o.line).join('text').attr('class', 'lbl lv').attr('text-anchor', 'middle').style('fill', o.lineColor).call(halo)
        .attr('x', (d, i) => x(i) + x.bandwidth() / 2).attr('y', d => y2(d) - 12).text(d => fmt(d));

      // hover
      const guide = g.append('rect').attr('y', 0).attr('height', h).attr('rx', 8)
        .style('fill', 'var(--ink)').attr('opacity', 0).attr('width', x.step());
      g.append('g').selectAll('rect').data(d3.range(n)).join('rect')
        .attr('x', i => x(i) - x.step() * 0.17).attr('width', x.step()).attr('y', 0).attr('height', h).attr('fill', 'transparent')
        .on('mousemove', (ev, i) => {
          guide.attr('x', x(i) - x.step() * 0.17).attr('opacity', 0.05);
          tip.show(`<b>${o.labels[i]}</b>` + row(o.barColor, `${o.barName}: <b>${o.bars[i] == null ? 'no data' : fmt(o.bars[i])}</b>`).slice(o.hideBars ? 1e9 : 0) +
            (o.hideLine ? '' : row(o.lineColor, `${o.lineName}: <b>${fmt(o.line[i])}</b>`)) +
            (o.line2 && !o.hideLine2 ? row(o.line2Color, `${o.line2Name}: <b>${fmt(o.line2[i])}</b>`) : ''), ev);
        })
        .on('mouseleave', () => { guide.attr('opacity', 0); tip.hide(); });
    });
  }

  /* ------------------------------------------------------------ plain vertical bars */
  function bars(el, o) {
    chart(el, { h: o.h || 260, m: { t: 26, r: 8, b: 34, l: 36 } }, (g, w, h, svg, anim) => {
      if (!o.values.length) return;
      const x = d3.scaleBand().domain(d3.range(o.labels.length)).range([0, w]).padding(0.28);
      const y = d3.scaleLinear().domain([0, d3.max(o.values) * 1.15]).nice().range([h, 0]);
      yAxis(g, y, w, { fmt: o.yfmt || fmt, ticks: 4 });
      const mc = Math.max(8, Math.floor(x.step() / 6.5));
      xAxisBand(g, x, h, o.labels.map(l => (String(l).length > mc ? String(l).slice(0, mc - 1) + '…' : l)), { every: o.every });
      const col = i => (Array.isArray(o.colors) ? o.colors[i] : o.colors);
      g.selectAll('rect').data(o.values.map((v, i) => ({ v, i }))).join('rect')
        .attr('x', d => x(d.i)).attr('width', x.bandwidth()).attr('rx', 8).attr('fill', d => col(d.i))
        .attr('y', anim ? h : (d => y(d.v))).attr('height', anim ? 0 : (d => h - y(d.v)))
        .call(s => { if (anim) s.transition().delay((d, i) => 200 + i * 80).duration(650).ease(d3.easeCubicOut)
          .attr('y', d => y(d.v)).attr('height', d => h - y(d.v)); })
        .on('mousemove', (ev, d) => tip.show(o.tip ? o.tip(d.i) : `<b>${o.labels[d.i]}</b> · ${(o.vfmt || f1)(d.v)}`, ev))
        .on('mouseleave', tip.hide);
      g.selectAll('text.v').data(vals() ? o.values : []).join('text').attr('class', 'lbl v').style('font-size', o.small ? '9.5px' : null).attr('text-anchor', 'middle')
        .attr('x', (d, i) => x(i) + x.bandwidth() / 2).attr('y', d => y(d) - 8).text(d => (o.vfmt || f1)(d));
    });
  }

  /* ------------------------------------------------------------ multi-line */
  function lines(el, o) {
    chart(el, { h: o.h || 300, m: { t: 14, r: o.endLabels ? 44 : 14, b: 30, l: 44 } }, (g, w, h, svg, anim) => {
      if (!o.series.length) return;
      const n = o.labels.length;
      const x = d3.scalePoint().domain(d3.range(n)).range([0, w]).padding(0.4);
      const all = o.series.flatMap(s => s.values.filter(v => v != null));
      const lo = o.zero ? 0 : d3.min(all) - (d3.max(all) - d3.min(all)) * 0.12;
      const y = d3.scaleLinear().domain([lo, o.zero ? d3.max(all) * 1.08 : d3.max(all) + (d3.max(all) - d3.min(all)) * 0.12]).nice().range([h, 0]);
      yAxis(g, y, w, { fmt: o.yfmt || fmt, ticks: 5 });
      xAxisBand(g, x, h, o.labels);
      const line = d3.line().defined(d => d != null).x((d, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX);
      const layer = g.append('g');
      o.series.forEach(s => {
        const cut = s.partialFrom != null ? s.partialFrom : null;   // dashed from this index on
        const solid = cut == null ? s.values : s.values.map((v, i) => (i < cut ? v : null));
        const p = layer.append('path').attr('d', line(solid)).attr('fill', 'none')
          .attr('stroke', s.color).attr('stroke-width', s.w || 3).attr('stroke-linecap', 'round').attr('data-s', s.name);
        if (cut != null) {
          const bridge = s.values.map((v, i) => (i >= cut - 1 ? v : null));
          layer.append('path').attr('d', line(bridge)).attr('fill', 'none').attr('stroke', s.color)
            .attr('stroke-width', s.w || 3).attr('stroke-dasharray', '4 5').attr('stroke-linecap', 'round');
        }
        if (anim) {
          const L = p.node().getTotalLength();
          p.attr('stroke-dasharray', L).attr('stroke-dashoffset', L)
            .transition().delay(150).duration(1100).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0);
        }
        layer.selectAll(null).data(s.values).join('circle')
          .attr('cx', (d, i) => x(i)).attr('cy', d => (d == null ? 0 : y(d))).attr('r', d => (d == null ? 0 : (s.dot || 3.6)))
          .attr('fill', (d, i) => (cut != null && i >= cut ? '#fff' : s.color)).attr('stroke', s.color).attr('stroke-width', 2);
        if (o.series.length <= 2 && vals() && !o.noLabels) g.append('g').selectAll('text').data(s.values).join('text').attr('class', 'lbl').style('fill', s.color)
          .style('paint-order', 'stroke').style('stroke', 'var(--card)').style('stroke-width', 3).attr('text-anchor', 'middle')
          .attr('x', (d, i) => x(i)).attr('y', d => (d == null ? 0 : y(d) - 10)).text(d => (d == null ? '' : (o.yfmt || fmt)(d)));
        if (o.endLabels) {
          const last = s.values.length - 1;
          g.append('text').attr('class', 'lbl').style('fill', s.color).attr('x', x(last) + 10).attr('y', y(s.values[last]) + 4).text(s.name);
        }
      });
      const guide = g.append('line').attr('y1', 0).attr('y2', h).style('stroke', 'var(--ink)').attr('opacity', 0).attr('stroke-dasharray', '3 4');
      g.append('g').selectAll('rect').data(d3.range(n)).join('rect')
        .attr('x', i => x(i) - x.step() / 2).attr('width', x.step()).attr('height', h).attr('fill', 'transparent')
        .on('mousemove', (ev, i) => {
          guide.attr('x1', x(i)).attr('x2', x(i)).attr('opacity', 0.25);
          const items = o.series.map(s => ({ s, v: s.values[i] })).filter(a => a.v != null).sort((a, b) => b.v - a.v);
          tip.show(`<b>${o.labels[i]}</b>` + items.map(a => row(a.s.color, `${a.s.name}: <b>${(o.yfmt || fmt)(a.v)}</b>`)).join(''), ev);
        })
        .on('mouseleave', () => { guide.attr('opacity', 0); tip.hide(); });
    });
  }

  /* ------------------------------------------------------------ stacked vertical bars */
  function stack(el, o) {
    chart(el, { h: o.h || 300, m: { t: 14, r: 10, b: 30, l: 44 } }, (g, w, h, svg, anim) => {
      const n = o.labels.length;
      const x = d3.scaleBand().domain(d3.range(n)).range([0, w]).padding(0.3);
      const totals = o.labels.map((_, i) => d3.sum(o.keys, k => o.data[k][i]));
      const y = d3.scaleLinear().domain([0, d3.max(totals) * 1.08]).nice().range([h, 0]);
      yAxis(g, y, w, { fmt, ticks: 5 });
      xAxisBand(g, x, h, o.labels);
      o.keys.forEach((k, ki) => {
        g.selectAll(null).data(o.labels).join('rect').attr('class', 'seg')
          .attr('x', (d, i) => x(i)).attr('width', x.bandwidth())
          .attr('y', (d, i) => y(d3.sum(o.keys.slice(0, ki + 1), kk => o.data[kk][i])))
          .attr('height', (d, i) => y(d3.sum(o.keys.slice(0, ki), kk => o.data[kk][i])) - y(d3.sum(o.keys.slice(0, ki + 1), kk => o.data[kk][i])))
          .attr('fill', o.colors[ki]).attr('rx', ki === o.keys.length - 1 ? 6 : 0)
          .attr('opacity', anim ? 0 : 1)
          .call(s => { if (anim) s.transition().delay((d, i) => 150 + i * 50).duration(600).attr('opacity', 1); });
      });
      if (vals()) {
        g.selectAll('text.tot').data(totals).join('text').attr('class', 'lbl tot').attr('text-anchor', 'middle')
          .attr('x', (d, i) => x(i) + x.bandwidth() / 2).attr('y', d => y(d) - 6).text(d => fmt(d));
        o.keys.forEach((k, ki) => o.labels.forEach((_, i) => {
          const base = d3.sum(o.keys.slice(0, ki), kk => o.data[kk][i]), v = o.data[k][i], hh = y(base) - y(base + v);
          if (hh > 16) g.append('text').attr('class', 'lbl').attr('pointer-events', 'none').attr('text-anchor', 'middle').style('fill', o.colors[ki] === '#F9A8D4' ? T.ink : '#fff')
            .attr('x', x(i) + x.bandwidth() / 2).attr('y', y(base + v) + hh / 2 + 4).text(fmt(v));
        }));
      }
      g.append('g').selectAll('rect').data(d3.range(n)).join('rect')
        .attr('x', i => x(i)).attr('width', x.bandwidth()).attr('height', h).attr('fill', 'transparent')
        .on('mousemove', (ev, i) => tip.show(`<b>${o.labels[i]}</b>` + o.keys.map((k, ki) => row(o.colors[ki], `${k}: <b>${fmt(o.data[k][i])}</b>`)).join('') +
          `<div style="margin-top:3px;opacity:.7">Total ${fmt(totals[i])}</div>`, ev))
        .on('mouseleave', tip.hide);
    });
  }

  /* ------------------------------------------------------------ heat grid */
  function heat(el, o) {
    const cellH = o.cellH || 40;
    const rows = o.values.length;
    chart(el, { h: rows * cellH + (o.topPad || 30) + 10, m: { t: o.topPad || 30, r: 6, b: 4, l: o.left || 42 } }, (g, w, h, svg, anim) => {
      const cols = o.values[0].length;
      const x = d3.scaleBand().domain(d3.range(cols)).range([0, w]).padding(0.08);
      const y = d3.scaleBand().domain(d3.range(rows)).range([0, rows * cellH]).padding(0.1);
      const flat = o.values.flat().filter(v => v != null);
      const sc = o.scale || d3.scaleSequential(d3.interpolateRgb('#FFE9F4', T.complaints)).domain([0, d3.max(flat)]);
      g.append('g').attr('class', 'axis').selectAll('text').data(d3.range(cols)).join('text')
        .attr('x', i => x(i) + x.bandwidth() / 2).attr('y', -10).attr('text-anchor', 'middle')
        .style('display', i => (o.colEvery && i % o.colEvery ? 'none' : null)).text(i => o.colLabels[i]);
      g.append('g').selectAll('text').data(d3.range(rows)).join('text').attr('class', 'lbl')
        .attr('x', -10).attr('y', i => y(i) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end')
        .style('fill', (d, i) => (o.rowColors ? o.rowColors[i] : 'var(--ink)')).text(i => o.rowLabels[i]);
      o.values.forEach((rv, ri) => {
        g.selectAll(null).data(rv.map((v, ci) => ({ v, ci }))).join('rect')
          .attr('x', d => x(d.ci)).attr('y', y(ri)).attr('width', x.bandwidth()).attr('height', y.bandwidth()).attr('rx', o.rx || 8)
          .attr('fill', d => (d.v == null ? '#F1F4FA' : sc(d.v)))
          .attr('opacity', anim ? 0 : 1)
          .call(s => { if (anim) s.transition().delay(d => 100 + (ri + d.ci) * 22).duration(500).attr('opacity', 1); })
          .on('mousemove', (ev, d) => tip.show(o.tip(ri, d.ci, d.v), ev))
          .on('mouseleave', tip.hide);
        if (o.cellText !== false) {
          g.selectAll(null).data(rv).join('text').attr('class', 'lbl').attr('pointer-events', 'none')
            .attr('x', (d, ci) => x(ci) + x.bandwidth() / 2).attr('y', y(ri) + y.bandwidth() / 2 + 4).attr('text-anchor', 'middle')
            .style('fill', d => (d == null ? '#9AA7C2' : (o.textColor ? o.textColor(d, sc) : (d > d3.max(flat) * 0.55 ? '#fff' : T.ink))))
            .text(d => (d == null ? '–' : (o.cellFmt || fmt)(d)));
        }
      });
    });
  }

  /* ------------------------------------------------------------ horizontal bars */
  function hbars(el, o) {
    const rowH = o.rowH || 30;
    chart(el, { h: o.items.length * rowH + 14, m: { t: 4, r: 54, b: 6, l: o.left || 110 } }, (g, w, h, svg, anim) => {
      const y = d3.scaleBand().domain(d3.range(o.items.length)).range([0, o.items.length * rowH]).padding(0.28);
      const x = d3.scaleLinear().domain([0, d3.max(o.items, d => d.v)]).range([0, w]);
      g.append('g').selectAll('text').data(o.items).join('text').attr('class', 'lbl').attr('x', -10).attr('text-anchor', 'end')
        .attr('y', (d, i) => y(i) + y.bandwidth() / 2 + 4).text(d => d.label);
      g.append('g').selectAll('rect').data(o.items).join('rect').attr('x', 0).attr('y', (d, i) => y(i)).attr('height', y.bandwidth()).attr('rx', 7)
        .attr('fill', d => d.color).attr('width', anim ? 0 : (d => x(d.v)))
        .call(s => { if (anim) s.transition().delay((d, i) => 150 + i * 50).duration(700).ease(d3.easeCubicOut).attr('width', d => x(d.v)); })
        .on('mousemove', (ev, d) => tip.show(d.tip || `<b>${d.label}</b> · ${fmt(d.v)}`, ev)).on('mouseleave', tip.hide);
      g.append('g').selectAll('text').data(o.items).join('text').attr('class', 'lbl')
        .attr('x', d => x(d.v) + 8).attr('y', (d, i) => y(i) + y.bandwidth() / 2 + 4).text(d => (o.vfmt || fmt)(d.v));
    });
  }

  /* ------------------------------------------------------------ donut */
  function donut(el, o) {
    chart(el, { h: o.h || 250, m: { t: 4, r: 4, b: 4, l: 4 } }, (g, w, h, svg, anim) => {
      const r = Math.min(w, h) / 2;
      const cx = w / 2, cy = h / 2;
      const pie = d3.pie().sort(null).padAngle(0.02)(o.values);
      const arc = d3.arc().innerRadius(r * 0.64).outerRadius(r).cornerRadius(7);
      const arcH = d3.arc().innerRadius(r * 0.62).outerRadius(r + 6).cornerRadius(7);
      const gg = g.append('g').attr('transform', `translate(${cx},${cy})`);
      const paths = gg.selectAll('path').data(pie).join('path').attr('fill', (d, i) => o.colors[i]).attr('d', arc);
      if (anim) paths.attr('opacity', 0).transition().delay((d, i) => 100 + i * 90).duration(600).attr('opacity', 1);
      if (vals()) gg.selectAll('text.pc').data(pie.filter(d => d.value / d3.sum(o.values) > 0.05)).join('text').attr('class', 'lbl pc').attr('pointer-events', 'none')
        .attr('text-anchor', 'middle').attr('transform', d => `translate(${arc.centroid(d)})`).attr('dy', 4).style('fill', '#fff').text(d => Math.round(d.value / d3.sum(o.values) * 100) + '%');
      paths.on('mousemove', function (ev, d) {
        d3.select(this).attr('d', arcH);
        tip.show(`<b>${o.labels[d.index]}</b> · ${fmt(d.value)} (${f1(d.value / d3.sum(o.values) * 100)}%)`, ev);
      }).on('mouseleave', function () { d3.select(this).attr('d', arc); tip.hide(); });
      gg.append('text').attr('text-anchor', 'middle').attr('y', 4).style('font', '700 32px var(--display)').style('fill', 'var(--ink)').text(fmt(d3.sum(o.values)));
      gg.append('text').attr('text-anchor', 'middle').attr('y', 26).style('font', '500 12.5px var(--body)').style('fill', '#66739A').text(o.center || 'complaints');
    });
  }

  /* ------------------------------------------------------------ scatter with fit line */
  function scatter(el, o) {
    chart(el, { h: o.h || 300, m: { t: 14, r: 16, b: 40, l: 54 } }, (g, w, h, svg, anim) => {
      const ap = o.allPoints || o.points, xs = ap.map(p => p.x), ys = ap.map(p => p.y);
      const x = d3.scaleLinear().domain(o.xDomain || [d3.min(xs) * 0.92, d3.max(xs) * 1.06]).nice().range([0, w]);
      const y = d3.scaleLinear().domain(o.yDomain || [d3.min(ys) * 0.85, d3.max(ys) * 1.08]).nice().range([h, 0]);
      yAxis(g, y, w, { fmt, ticks: 5 });
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10)).select('.domain').remove();
      g.append('text').attr('class', 'axis').style('fill', '#66739A').attr('font-size', 11.5).attr('x', w / 2).attr('y', h + 36).attr('text-anchor', 'middle').text(o.xTitle);
      if (o.yTitle) g.append('text').attr('class', 'axis').style('fill', '#66739A').attr('font-size', 11.5).attr('transform', `translate(-44,${h / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(o.yTitle);
      (o.fits || []).forEach(f => g.append('line').attr('x1', x(x.domain()[0])).attr('x2', x(x.domain()[1]))
        .attr('y1', y(f.b + f.m * x.domain()[0])).attr('y2', y(f.b + f.m * x.domain()[1])).attr('stroke', f.color).attr('stroke-width', 2).attr('stroke-dasharray', '5 5').attr('opacity', 0.7));
      if (o.fit && !o.hideFit) {
        const x0 = x.domain()[0], x1 = x.domain()[1];
        g.append('line').attr('x1', x(x0)).attr('x2', x(x1)).attr('y1', y(o.fit.b + o.fit.m * x0)).attr('y2', y(o.fit.b + o.fit.m * x1))
          .style('stroke', o.fitColor || 'var(--ink)').attr('stroke-width', o.fitColor ? 2.6 : 1.6).attr('stroke-dasharray', o.fitColor ? '7 6' : '5 5').attr('opacity', o.fitColor ? 0.85 : 0.35);
      }
      if (o.vline && !o.hideV) {
        g.append('line').attr('x1', x(o.vline.x)).attr('x2', x(o.vline.x)).attr('y1', 0).attr('y2', h).attr('stroke', o.vline.color)
          .attr('stroke-width', 2).attr('stroke-dasharray', '2 6').attr('stroke-linecap', 'round');
        g.append('text').attr('class', 'lbl').style('fill', o.vline.color).attr('x', x(o.vline.x) + 6).attr('y', 12).text(o.vline.label);
      }
      if (o.meanLines && !o.hidePts) {
        const mx = d3.mean(o.points, p => p.x), my = d3.mean(o.points, p => p.y);
        g.append('line').attr('x1', x(mx)).attr('x2', x(mx)).attr('y1', 0).attr('y2', h).style('stroke', 'var(--ink)').attr('opacity', 0.18).attr('stroke-dasharray', '2 5');
        g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(my)).attr('y2', y(my)).style('stroke', 'var(--ink)').attr('opacity', 0.18).attr('stroke-dasharray', '2 5');
        g.append('text').attr('class', 'lbl').style('fill', '#66739A').attr('x', w - 4).attr('y', y(my) - 6).attr('text-anchor', 'end').text('average complaints');
        g.append('text').attr('class', 'lbl').style('fill', '#66739A').attr('x', x(mx) + 6).attr('y', h - 6).text('average cuts');
      }
      const pts = g.selectAll('g.p').data(o.hidePts ? [] : o.points).join('g').attr('class', 'p').attr('transform', d => `translate(${x(d.x)},${y(d.y)})`);
      pts.append('circle').attr('r', anim ? 0 : (o.r || 15)).attr('fill', d => d.color || o.color).attr('opacity', 0.92)
        .call(s => { if (anim) s.transition().delay((d, i) => 200 + i * 60).duration(500).attr('r', o.r || 15); });
      if (o.outLabel) pts.append('text').attr('class', 'lbl').attr('x', (o.r || 15) + 6).attr('y', 4).style('font-weight', 700).call(halo).attr('pointer-events', 'none').text(d => d.label);
      else pts.append('text').attr('text-anchor', 'middle').attr('y', 4).style('fill', '#fff').style('font', '700 10.5px var(--body)').attr('pointer-events', 'none').text(d => d.label);
      pts.on('mousemove', (ev, d) => tip.show(o.tip(d), ev)).on('mouseleave', tip.hide);
    });
  }

  /* ------------------------------------------------------------ tiny combo (no axes) */
  function mini(el, o) {
    chart(el, { h: 96, minW: 60, m: { t: 6, r: 4, b: 16, l: 4 } }, (g, w, h, svg, anim) => {
      const n = o.bars.length;
      const x = d3.scaleBand().domain(d3.range(n)).range([0, w]).padding(0.22);
      const y1 = d3.scaleLinear().domain([0, d3.max(o.bars) * 1.05]).range([h, 0]);
      const y2 = d3.scaleLinear().domain([0, d3.max(o.line) * 1.05 || 1]).range([h, 0]);
      g.selectAll('rect').data(o.hideBars ? [] : o.bars).join('rect').attr('x', (d, i) => x(i)).attr('width', x.bandwidth()).attr('rx', 3)
        .attr('y', d => y1(d)).attr('height', d => h - y1(d)).attr('fill', T.complaints).attr('opacity', 0.78);
      g.append('path').attr('d', o.hideLine ? null : d3.line().x((d, i) => x(i) + x.bandwidth() / 2).y(d => y2(d)).curve(d3.curveMonotoneX)(o.line))
        .attr('fill', 'none').attr('stroke', T.cuts).attr('stroke-width', 2.4).attr('stroke-linecap', 'round');
      const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h + 3})`);
      [0, n - 1].forEach(i => ax.append('text').attr('x', x(i) + x.bandwidth() / 2).attr('text-anchor', i ? 'end' : 'start')
        .attr('dx', i ? x.bandwidth() / 2 : -x.bandwidth() / 2).attr('y', 11).style('font-size', '10px').text(o.labels[i]));
      g.append('g').selectAll('rect').data(d3.range(n)).join('rect').attr('x', i => x(i) - 1).attr('width', x.step()).attr('height', h).attr('fill', 'transparent')
        .on('mousemove', (ev, i) => tip.show(`<b>${o.labels[i]}</b>` + row(T.complaints, `Complaints: <b>${fmt(o.bars[i])}</b>`) + row(T.cuts, `Cuts: <b>${fmt(o.line[i])}</b>`), ev))
        .on('mouseleave', tip.hide);
    });
  }

  /* ------------------------------------------------------------ helpers for pages */
  function rColor(r) {
    if (r == null) return { bg: '#F1F4FA', fg: '#9AA7C2' };
    const a = Math.min(1, Math.abs(r));
    const base = r >= 0 ? [230, 0, 126] : [47, 107, 255];
    const mix = (c) => Math.round(255 - (255 - c) * (0.12 + a * 0.88));
    const bg = `rgb(${mix(base[0])},${mix(base[1])},${mix(base[2])})`;
    return { bg, fg: a > 0.45 ? '#fff' : T.ink };
  }
  const rTxt = r => (r == null ? '–' : (r > 0 ? '+' : '−') + Math.abs(r).toFixed(2));
  const teamName = t => 'C' + t;

  function withLegend(sel, items, render) {
    const host = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!host) return;
    const hidden = new Set();
    let lg = host.nextElementSibling;
    if (!lg || !lg.classList.contains('legend')) { lg = document.createElement('div'); lg.className = 'legend'; host.after(lg); }
    const paint = () => {
      lg.innerHTML = items.map(i => `<button type="button" class="lg${hidden.has(i.key) ? ' off' : ''}" data-k="${i.key}" title="${i.title || ''}" aria-pressed="${!hidden.has(i.key)}"><i class="${i.type || ''}" style="background:${i.color}"></i>${i.label}</button>`).join('');
    };
    lg.onclick = e => {
      const b = e.target.closest('.lg'); if (!b) return;
      hidden.has(b.dataset.k) ? hidden.delete(b.dataset.k) : hidden.add(b.dataset.k);
      paint(); render(hidden);
    };
    paint(); render(hidden);
  }
  function barsLegend(sel, o) {
    const col = i => (Array.isArray(o.colors) ? o.colors[i] : o.colors);
    withLegend(sel, o.labels.map((l, i) => ({ key: String(i), label: l, color: col(i) })), hd => {
      const ix = o.labels.map((_, i) => i).filter(i => !hd.has(String(i)));
      bars(sel, Object.assign({}, o, { labels: ix.map(i => o.labels[i]), values: ix.map(i => o.values[i]),
        colors: Array.isArray(o.colors) ? ix.map(col) : o.colors, tip: o.tip ? (j => o.tip(ix[j])) : undefined }));
    });
  }
  function gradient(sel, lo, hi, color) {
    const host = document.querySelector(sel); if (!host) return;
    let g = host.nextElementSibling;
    if (!g || !g.classList.contains('grad')) { g = document.createElement('div'); g.className = 'grad'; host.after(g); }
    g.innerHTML = `<span>${lo}</span><b style="background:linear-gradient(90deg,#FFE9F4,${color})"></b><span>${hi}</span>`;
  }
  const vals = () => window.__vals !== false;
  const vb = document.getElementById('vals');
  if (vb) {
    vb.classList.toggle('on', vals());
    vb.onclick = () => { window.__vals = !vals(); vb.classList.toggle('on', vals()); vb.setAttribute('aria-pressed', String(vals())); redraws.forEach(f => f()); };
  }

  function year(sel, text) {
    const h2 = (document.querySelector(sel) || document.body).closest('.card')?.querySelector('.head h2');
    if (h2 && !h2.querySelector('.yr')) h2.insertAdjacentHTML('beforeend', `<span class="yr">${text}</span>`);
  }

  /* ------------------------------------------------------------ correlation helpers (r from -1 to +1) */
  const rWord = r => (r == null ? 'no data' : (Math.abs(r) < 0.3 ? 'weak' : Math.abs(r) < 0.5 ? 'moderate' : 'strong') + (r >= 0 ? ' positive' : ' negative'));
  const NEG = '#4C7DFF';
  const halo = s => s.style('paint-order', 'stroke').style('stroke', 'var(--card)').style('stroke-width', 4).style('stroke-linejoin', 'round');

  /* lollipop: one row per item, a stem from 0 to r, the value written at the end */
  function rlollipop(el, o) {
    const items = o.items.slice().sort((a, b) => (b.r ?? -2) - (a.r ?? -2)), RH = 64, H = items.length * RH;
    chart(el, { h: H + 62, m: { t: 26, r: 58, b: 30, l: 78 } }, (g, w, h, svg, anim) => {
      const x = d3.scaleLinear().domain([-1, 1]).range([0, w]);
      g.append('rect').attr('x', x(-0.3)).attr('width', x(0.3) - x(-0.3)).attr('y', 0).attr('height', H).attr('rx', 10).style('fill', 'var(--ink)').attr('opacity', 0.05);
      g.append('text').attr('class', 'lbl').attr('x', x(0)).attr('y', -10).attr('text-anchor', 'middle').style('fill', '#66739A').text('weak');
      g.append('text').attr('class', 'lbl').attr('x', x(-1)).attr('y', -10).attr('text-anchor', 'start').style('fill', NEG).text('← moves opposite');
      g.append('text').attr('class', 'lbl').attr('x', x(1)).attr('y', -10).attr('text-anchor', 'end').style('fill', o.color).text('moves together →');
      [-1, -0.5, 0.5, 1].forEach(v => g.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', 0).attr('y2', H).style('stroke', 'var(--line)').attr('stroke-dasharray', '2 5'));
      g.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', H).style('stroke', 'var(--ink)').attr('opacity', 0.35);
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${H + 8})`).call(d3.axisBottom(x).tickValues([-1, -0.5, 0, 0.5, 1]).tickFormat(v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1)).tickSize(0).tickPadding(6)).select('.domain').remove();
      items.forEach((d, i) => {
        const cy = i * RH + RH / 2, r = d.r ?? 0, col = r >= 0 ? o.color : NEG, xe = x(r);
        const gr = g.append('g').style('cursor', 'default');
        gr.append('text').attr('class', 'lbl').attr('x', -14).attr('y', cy - 3).attr('text-anchor', 'end').style('font-weight', 700).style('font-size', '15px').text(d.label);
        gr.append('text').attr('class', 'lbl').attr('x', -14).attr('y', cy + 14).attr('text-anchor', 'end').style('fill', '#66739A').style('font-weight', 500).text(d.sub);
        const st = gr.append('line').attr('x1', x(0)).attr('y1', cy).attr('y2', cy).attr('stroke', col).attr('stroke-width', 7).attr('stroke-linecap', 'round').attr('opacity', 0.35 + 0.65 * Math.min(1, Math.abs(r) / 0.7));
        const dot = gr.append('circle').attr('cy', cy).attr('r', 13).attr('fill', col).attr('stroke', '#fff').attr('stroke-width', 3);
        const lab = gr.append('text').attr('class', 'lbl').attr('y', cy + 5).style('font', '800 15px var(--font)').style('fill', col).call(halo)
          .attr('text-anchor', r >= 0 ? 'start' : 'end').text(rTxt(d.r));
        const wd = gr.append('text').attr('class', 'lbl').attr('y', cy + 21).style('fill', '#66739A').style('font-weight', 500).style('font-size', '11.5px').attr('text-anchor', r >= 0 ? 'start' : 'end').text(rWord(d.r).replace(' positive', '').replace(' negative', ''));
        const place = v => { st.attr('x2', x(v)); dot.attr('cx', x(v)); lab.attr('x', x(v) + (r >= 0 ? 20 : -20)); wd.attr('x', x(v) + (r >= 0 ? 20 : -20)); };
        if (anim) { st.attr('x2', x(0)); dot.attr('cx', x(0)); lab.attr('x', x(0)).attr('opacity', 0);
          const T0 = d3.transition().delay(150 + i * 120).duration(750).ease(d3.easeCubicOut);
          st.transition(T0).attr('x2', xe); dot.transition(T0).attr('cx', xe); wd.attr('x', xe + (r >= 0 ? 20 : -20)); lab.transition(T0).attr('x', xe + (r >= 0 ? 20 : -20)).attr('opacity', 1); } else place(r);
        gr.append('rect').attr('x', -78).attr('width', w + 136).attr('y', i * RH).attr('height', RH).attr('fill', 'transparent')
          .on('mousemove', ev => tip.show(`<b>${d.label}</b> cuts vs complaints<br>r = <b>${f2(d.r)}</b> · ${rWord(d.r)}`, ev)).on('mouseleave', tip.hide);
      });
    });
  }

  /* line plot of r across categories (teams), every point labelled */
  function rlines(el, o) {
    chart(el, { h: o.h || 400, m: { t: 18, r: 50, b: 34, l: 48 } }, (g, w, h, svg, anim) => {
      const n = o.cats.length, x = d3.scalePoint().domain(d3.range(n)).range([0, w]).padding(0.45), y = d3.scaleLinear().domain([-1, 1]).range([h, 0]);
      const sf = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
      g.append('rect').attr('x', 0).attr('width', w).attr('y', y(0.3)).attr('height', y(-0.3) - y(0.3)).attr('rx', 8).style('fill', 'var(--ink)').attr('opacity', 0.05);
      g.append('text').attr('class', 'lbl').attr('x', 8).attr('y', y(0.3) + 14).style('fill', '#66739A').text('weak (−0.3 to +0.3)');
      yAxis(g, y, w, { fmt: sf, ticks: 5 });
      g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'var(--ink)').attr('opacity', 0.35);
      xAxisBand(g, x, h, o.cats);
      if (o.sepLast) g.append('line').attr('x1', (x(n - 2) + x(n - 1)) / 2).attr('x2', (x(n - 2) + x(n - 1)) / 2).attr('y1', 0).attr('y2', h).style('stroke', 'var(--line)').attr('stroke-dasharray', '3 5');
      const vis = o.series.filter(s => !s.hidden);
      const line = d3.line().defined(d => d != null).x((d, i) => x(i)).y(d => y(d)).curve(d3.curveLinear);
      vis.forEach(s => {
        const p = g.append('path').attr('d', line(s.values)).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 3.2).attr('stroke-linecap', 'round');
        if (anim) { const L = p.node().getTotalLength(); p.attr('stroke-dasharray', L).attr('stroke-dashoffset', L).transition().delay(150).duration(1000).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0); }
        g.selectAll(null).data(s.values.map((v, i) => ({ v, i })).filter(d => d.v != null)).join('circle').attr('cx', d => x(d.i)).attr('cy', d => y(d.v)).attr('r', 5.8)
          .attr('fill', '#fff').attr('stroke', s.color).attr('stroke-width', 2.8);
      });
      for (let i = 0; i < n; i++) {                       // value labels, nudged apart where points sit close together
        const pts = vis.map(s => ({ s, v: s.values[i] })).filter(d => d.v != null).map(d => ({ ...d, py: y(d.v) })).sort((a, b) => a.py - b.py);
        let lastY = -1e9; pts.forEach(p => { p.ly = Math.max(p.py, lastY + 16); lastY = p.ly; });
        const over = (pts.length ? pts[pts.length - 1].ly : 0) - h; if (over > 0) pts.forEach(p => { p.ly -= over; });
        g.append('g').selectAll('text').data(pts).join('text').attr('class', 'lbl').attr('x', x(i) + 11).attr('y', d => d.ly + 4).style('font', '700 12.5px var(--font)')
          .style('fill', d => d.s.color).call(halo).text(d => rTxt(d.v));
      }
      const guide = g.append('rect').attr('y', 0).attr('height', h).attr('rx', 8).style('fill', 'var(--ink)').attr('opacity', 0).attr('width', x.step()).attr('pointer-events', 'none');
      g.append('g').selectAll('rect').data(d3.range(n)).join('rect').attr('x', i => x(i) - x.step() / 2).attr('width', x.step()).attr('height', h).attr('fill', 'transparent')
        .on('mousemove', (ev, i) => { guide.attr('x', x(i) - x.step() / 2).attr('opacity', 0.05);
          tip.show(`<b>${o.cats[i]}</b>` + vis.map(s => row(s.color, `${s.name}: <b>${rTxt(s.values[i])}</b> · ${rWord(s.values[i])}`)).join(''), ev); })
        .on('mouseleave', () => { guide.attr('opacity', 0); tip.hide(); });
    });
  }

  /* dumbbell: r in two years for every team */
  function rdumbbell(el, o) {
    const RH = 40, n = o.rows.length;
    chart(el, { h: n * RH + 66, m: { t: 30, r: 40, b: 28, l: 42 } }, (g, w, h, svg, anim) => {
      const x = d3.scaleLinear().domain([-1, 1]).range([0, w]), H = n * RH;
      [[o.aName, o.aColor, 0], [o.bName, o.bColor, 1]].forEach(([nm, c, k]) => {
        g.append('circle').attr('cx', 6 + k * 74).attr('cy', -16).attr('r', 5.5).attr('fill', k ? c : '#fff').attr('stroke', c).attr('stroke-width', 2.6);
        g.append('text').attr('class', 'lbl').attr('x', 16 + k * 74).attr('y', -12).text(nm);
      });
      g.append('rect').attr('x', x(-0.3)).attr('width', x(0.3) - x(-0.3)).attr('y', 0).attr('height', H).attr('rx', 8).style('fill', 'var(--ink)').attr('opacity', 0.05);
      [-1, -0.5, 0.5, 1].forEach(v => g.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', 0).attr('y2', H).style('stroke', 'var(--line)').attr('stroke-dasharray', '2 5'));
      g.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', H).style('stroke', 'var(--ink)').attr('opacity', 0.35);
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${H + 6})`).call(d3.axisBottom(x).tickValues([-1, -0.5, 0, 0.5, 1]).tickFormat(v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1)).tickSize(0).tickPadding(6)).select('.domain').remove();
      o.rows.forEach((d, i) => {
        const cy = i * RH + RH / 2, last = d.all;
        if (last) g.append('line').attr('x1', -42).attr('x2', w).attr('y1', i * RH).attr('y2', i * RH).style('stroke', 'var(--line)');
        g.append('text').attr('class', 'lbl').attr('x', -10).attr('y', cy + 4).attr('text-anchor', 'end').style('font-weight', 700).style('fill', d.color || 'var(--ink)').text(d.label);
        if (d.a != null && d.b != null) g.append('line').attr('x1', x(d.a)).attr('x2', x(d.b)).attr('y1', cy).attr('y2', cy).attr('stroke', o.bColor).attr('stroke-width', 5).attr('stroke-linecap', 'round').attr('opacity', 0.3);
        const dot = (v, c, fill, lowSide) => { if (v == null) return;
          g.append('circle').attr('cx', x(v)).attr('cy', cy).attr('r', 7).attr('fill', fill).attr('stroke', c).attr('stroke-width', 2.8);
          g.append('text').attr('class', 'lbl').attr('x', x(v) + (lowSide ? -12 : 12)).attr('y', cy + 4).attr('text-anchor', lowSide ? 'end' : 'start').style('font', '700 12px var(--font)').style('fill', c).call(halo).text(rTxt(v)); };
        const aLow = d.b == null || (d.a != null && d.a <= d.b);
        dot(d.a, o.aColor, '#fff', aLow); dot(d.b, o.bColor, o.bColor, !aLow);
        g.append('rect').attr('x', -42).attr('width', w + 42).attr('y', i * RH).attr('height', RH).attr('fill', 'transparent')
          .on('mousemove', ev => tip.show(`<b>${d.label}</b>` + row(o.aColor, `${o.aName}: <b>${rTxt(d.a)}</b> · ${rWord(d.a)}`) + row(o.bColor, `${o.bName}: <b>${rTxt(d.b)}</b> · ${rWord(d.b)}`), ev)).on('mouseleave', tip.hide);
      });
    });
  }

  const Cobj = { year, withLegend, barsLegend, gradient, vals, P, T, D, fmt, f1, f2, tip, row, chart, strands, kpis, story, combo, bars, lines, stack, heat, hbars, donut, scatter, mini, rColor, rTxt, teamName, redraws, rlollipop, rlines, rdumbbell, rWord };
  strands();
  return Cobj;
}

const pages = {};
pages.complaints = function (C) {
/* Dashboard 1 - Complaints and fiber cuts */
(function () {
  const { D, T, fmt, f2, rTxt, rColor, tip, row } = C;
  const K = D.kpis;

  const MC = D.monthly, last = D.labels.length - 1, span = `${D.labels[0]}–${D.labels[last]} 2026`;
  const cutsVs = K.cuts_py ? KPI.delta(K.cuts, K.cuts_py, { pct: true, good: 'down', vs: `2025 (${fmt(K.cuts_py)})` }) : null;
  C.kpis([
    { l: 'Complaints', v: fmt(K.complaints), s: span, d: KPI.delta(MC.complaints[last], MC.complaints[last - 1], { pct: true, good: 'down', vs: D.labels[last - 1] }), spark: MC.complaints },
    { l: 'OFC cuts', v: fmt(K.cuts), s: span, d: cutsVs, spark: MC.cuts },
    { l: `Monthly correlation · ${K.strength}`, v: f2(K.r), s: 'complaints vs fiber cuts', meter: K.r, c: '#7B61FF' },
  ]);

  const bestLink = D.link_r.slice().sort((a, b) => (b.r ?? -2) - (a.r ?? -2))[0];
  const strongSubs = D.subs.filter(s => s.r != null && s.r >= 0.5).map(s => 'C' + s.team);
  const sl = D.site_link;
  const lift = (sl[1].per100 / sl[0].per100 - 1) * 100;
  C.story([
    { c: T.cuts, t: `Cuts peak in <b>${K.peak_cuts}</b>, complaints in <b>${K.peak_complaints}</b>` },
    { c: T.complaints, t: `<b>${bestLink.link}</b> links track complaints best · r ${f2(bestLink.r)}` },
    { c: '#2F6BFF', t: strongSubs.length ? `<b>${strongSubs.join(' & ')}</b> move with fiber (r ≥ 0.5)` : 'No sub-region moves strongly with fiber' },
    { c: '#14B870', t: `Sites on a cut section: <b>${lift >= 0 ? '+' : ''}${lift.toFixed(0)}%</b> complaints` },
  ]);

  // ---- month by month
  document.getElementById('cap-combo').textContent =
    `Complaints peak ${K.peak_complaints} (${fmt(K.peak_complaints_n)}) · cuts peak ${K.peak_cuts} (${fmt(K.peak_cuts_n)})`;
  const HAS_T = !!(D.target && D.target.cuts != null);   // set CUTS_TARGET = None in settings.py to hide every target line
  const TG = HAS_T ? { y: D.target.cuts, color: '#0F9D8A', label: `Target ≤ ${D.target.cuts} cuts / month` } : null;
  C.withLegend('#combo', [
    { key: 'b', label: 'Complaints 2026', color: T.complaints },
    { key: 'l', label: 'OFC cuts 2026', color: T.cuts, type: 'ln' },
    { key: 'p', label: 'OFC cuts 2025', color: '#8896B8', type: 'ln' },
    ...(HAS_T ? [{ key: 't', label: `Cuts target ≤ ${D.target.cuts}`, color: TG.color, type: 'ln', title: D.target.source }] : []),
  ], hd =>
    C.combo('#combo', { labels: D.labels, bars: D.monthly.complaints.map((v, i) => ((D.gap || []).includes(D.labels[i]) ? null : v)), line: D.monthly.cuts, hideBars: hd.has('b'), hideLine: hd.has('l'),
      line2: D.monthly.cuts25, line2Color: '#8896B8', line2Name: 'OFC cuts 2025', hideLine2: hd.has('p'), target: TG, hideTarget: hd.has('t'),
      barColor: T.complaints, lineColor: T.cuts, barName: 'Complaints 2026', lineName: 'OFC cuts 2026', h: 350 }));

  // ---- scatter
  const rb = document.getElementById('r-badge');
  rb.textContent = `r = ${f2(K.r)}`;
  C.withLegend('#scatter', [{ key: 'p', label: 'Months (light = early, dark = late)', color: T.complaints, type: 'dot' }, { key: 'f', label: 'Trend line', color: T.cuts, type: 'ln' },
    ...(HAS_T ? [{ key: 'g', label: `Cuts target ≤ ${D.target.cuts}`, color: '#0F9D8A', type: 'ln', title: D.target.source }] : [])], hd =>
    C.scatter('#scatter', {
      h: 330, r: 9, outLabel: true, meanLines: true, fitColor: T.cuts, yTitle: 'Complaints in the month', color: T.complaints, xTitle: 'OFC cuts in the month (2026)', hidePts: hd.has('p'), hideFit: hd.has('f'), hideV: hd.has('g'),
      vline: HAS_T ? { x: D.target.cuts, color: '#0F9D8A', label: `≤ ${D.target.cuts}` } : null,
      points: D.scatter.points.map((p, i, a) => ({ x: p.cuts, y: p.complaints, label: p.m, ...p, color: d3.interpolateRgb('#F9A8D4', T.complaints)(a.length > 1 ? i / (a.length - 1) : 1) })),
      fit: { m: D.scatter.slope, b: D.scatter.intercept },
      tip: d => `<b>${d.m} 2026</b>` + row(T.complaints, `Complaints: <b>${fmt(d.complaints)}</b>`) + row(T.cuts, `Cuts: <b>${fmt(d.cuts)}</b>`),
    }));

  // ---- mini multiples
  const host = document.getElementById('minis');
  host.innerHTML = D.subs.map(s => {
    const c = rColor(s.r);
    return `<div class="mini"><div class="t"><b>C${s.team}</b><span style="background:${c.bg};color:${c.fg}">r ${rTxt(s.r)}</span></div>
      <div class="chart" id="mini-${s.team}"></div>
      <div class="nums"><span>${fmt(s.total)} complaints</span><span>${fmt(s.cuts_total)} cuts</span></div></div>`;
  }).join('');
  C.withLegend('#minis', [{ key: 'b', label: 'Complaints', color: T.complaints }, { key: 'l', label: 'OFC cuts', color: T.cuts, type: 'ln' }], hd =>
    D.subs.forEach(s => C.mini('#mini-' + s.team, { labels: D.labels, bars: s.complaints, line: s.cuts, hideBars: hd.has('b'), hideLine: hd.has('l') })));

  // ---- correlation by link type (lollipop)
  C.rlollipop('#linkr', { color: T.complaints, items: D.link_r.map(d => ({ label: d.link, sub: `${fmt(d.cuts)} cuts`, r: d.r })) });

  // ---- year on year
  // a half-finished month would look like a collapse, so it is left out of the line
  const pad = a => a.concat(Array(12 - a.length).fill(null));
  const pm = D.yoy.partial_month;
  const y26 = pm ? D.yoy.y2026.slice(0, pm - 1) : D.yoy.y2026;
  if (pm) document.getElementById('cap-yoy').textContent = `OFC cuts per month · ${D.yoy.labels[pm - 1]} 2026 still running, not shown`;
  const ys = [{ name: '2025', color: '#9AA7C2', values: D.yoy.y2025, w: 2.6 }, { name: '2026', color: T.cuts, values: pad(y26), w: 3.4 }];
  C.withLegend('#yoy', ys.map(s => ({ key: s.name, label: s.name, color: s.color, type: 'ln' })), hd =>
    C.lines('#yoy', { labels: D.yoy.labels, zero: true, h: 290, series: ys.filter(s => !hd.has(s.name)) }));

  // ---- complaint type mix
  const keys = ['Coverage', 'Data speed', 'Call quality'];
  const cols = ['#F0147F', '#3B5BDB', '#F9A8D4'];
  C.withLegend('#mix', keys.map((k, i) => ({ key: k, label: k, color: cols[i] })), hd => {
    const ks = keys.filter(k => !hd.has(k));
    C.stack('#mix', { labels: D.labels, keys: ks, colors: ks.map(k => cols[keys.indexOf(k)]), data: D.mix, h: 300 });
  });

  // ---- sites on a cut section
  C.barsLegend('#sitelink', { h: 260, labels: ['No cut', 'On a cut section'], values: sl.map(d => d.per100),
    colors: ['#CBD5EA', T.cuts], yfmt: d3.format('.0f'), vfmt: d3.format('.1f'),
    tip: i => `<b>${sl[i].label}</b><br>${f2(sl[i].per100)} per 100 site-months<br>${fmt(sl[i].n)} site-months` });
  [['#combo', '2025 · 2026'], ['#scatter', '2026'], ['#minis', '2026'], ['#linkr', '2026'], ['#yoy', '2025 · 2026'], ['#mix', '2026'], ['#sitelink', '2026']].forEach(([s, t]) => C.year(s, t));
})();

};
pages.fops = function (C) {
/* Dashboard 2 - RCTO Central overview, routing team FOPs C1 to C6 */
(function () {
  const { D, T, fmt, f1, tip, row } = C;
  const K = D.kpis;
  const teamCol = T.teams;
  const names = D.teams.map(t => 'C' + t);

  C.kpis([
    { l: 'Complaints routed to FOPs', v: fmt(K.total), s: '2026', spark: D.monthly_total },
    { l: 'Average per month', v: fmt(K.avg_month), s: `peak ${K.top_month} · ${fmt(K.top_month_n)}`, spark: D.monthly_total, c: 'var(--m-cuts)' },
    { l: 'Largest team', v: 'C' + K.top_team, unit: f1(K.top_team_share) + '%', s: 'of all FOPs complaints', bar: K.top_team_share, c: teamCol[K.top_team - 1] },
  ]);
  const topCity = D.cities[0];
  C.story([
    { c: teamCol[K.top_team - 1], t: `<b>C${K.top_team}</b> handles <b>${f1(K.top_team_share)}%</b> of complaints` },
    { c: T.complaints, t: `Busiest month: <b>${K.top_month}</b> · ${fmt(K.top_month_n)}` },
    { c: T.cuts, t: `<b>${topCity.city}</b> alone: ${fmt(topCity.n)}` },
    { c: T.ls, t: `Peak hour: <b>${String(d3.maxIndex(d3.range(24).map(h => d3.sum(D.weekday_hour, r => r[h])))).padStart(2, '0')}:00</b>` },
  ]);

  // ---- donut + legend
  const tot = D.team_total.reduce((a, b) => a + b, 0);
  C.withLegend('#donut', names.map((n, i) => ({ key: n, label: `${n} ${f1(D.team_total[i] / tot * 100)}%`, color: teamCol[i] })), hd => {
    const ix = names.map((_, i) => i).filter(i => !hd.has(names[i]));
    C.donut('#donut', { values: ix.map(i => D.team_total[i]), labels: ix.map(i => names[i]), colors: ix.map(i => teamCol[i]), h: 250 });
  });

  // ---- heat: team x month
  C.heat('#heat', {
    values: D.matrix, rowLabels: names, rowColors: teamCol, colLabels: D.labels, cellH: 46, left: 34, topPad: 28,
    tip: (r, c, v) => `<b>${names[r]} · ${D.labels[c]}</b><br>${fmt(v)} complaints`,
  });

  C.gradient('#heat', 'Fewer', 'More complaints', T.complaints);

  // ---- lines by team
  const ts = D.teams.map((t, i) => ({ name: 'C' + t, color: teamCol[i], values: D.matrix[i], w: 2.8 }));
  C.withLegend('#lines', ts.map(s => ({ key: s.name, label: s.name, color: s.color, type: 'ln' })), hd =>
    C.lines('#lines', { labels: D.labels, h: 320, endLabels: true, zero: true, series: ts.filter(s => !hd.has(s.name)) }));

  // ---- complaint type mix per team (100% bars)
  const cats = D.cats, cc = ['#F0147F', '#3B5BDB', '#F9A8D4'];
  const drawMix = hd => C.chart('#mixbar', { h: 300, m: { t: 6, r: 8, b: 26, l: 34 } }, (g, w, h, svg, anim) => {
    const y = d3.scaleBand().domain(d3.range(6)).range([0, h]).padding(0.28);
    const x = d3.scaleLinear().domain([0, 1]).range([0, w]);
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h + 4})`)
      .call(d3.axisBottom(x).tickValues([0, .25, .5, .75, 1]).tickFormat(d3.format('.0%')).tickSize(0).tickPadding(6)).select('.domain').remove();
    g.append('g').selectAll('text').data(names).join('text').attr('class', 'lbl').attr('x', -8).attr('text-anchor', 'end')
      .attr('y', (d, i) => y(i) + y.bandwidth() / 2 + 4).style('fill', (d, i) => teamCol[i]).text(d => d);
    D.team_mix.forEach((m, i) => {
      const total = d3.sum(cats.filter(k => !hd.has(k)), k => m[k]) || 1;
      let acc = 0;
      cats.forEach((k, ki) => {
        if (hd.has(k)) return;
        const v = m[k] / total, x0 = acc; acc += v;
        g.append('rect').attr('x', x(x0)).attr('width', Math.max(0, x(v) - 2)).attr('y', y(i)).attr('height', y.bandwidth()).attr('rx', 6)
          .attr('fill', cc[ki])
          .on('mousemove', ev => tip.show(`<b>${names[i]} · ${k}</b><br>${fmt(m[k])} (${f1(v * 100)}%)`, ev)).on('mouseleave', tip.hide);
        if (v > 0.12) g.append('text').attr('class', 'lbl').attr('pointer-events', 'none').attr('x', x(x0) + x(v) / 2 - 1).attr('y', y(i) + y.bandwidth() / 2 + 4)
          .attr('text-anchor', 'middle').style('fill', ki === 2 ? T.ink : '#fff').text(Math.round(v * 100) + '%');
      });
    });
  });
  C.withLegend('#mixbar', cats.map((k, i) => ({ key: k, label: k, color: cc[i] })), drawMix);

  // ---- top cities
  const cityItems = D.cities.map(c => ({ label: c.city, v: c.n, team: c.team, color: teamCol[c.team - 1], tip: `<b>${c.city}</b> · ${fmt(c.n)}<br>mostly C${c.team}` }));
  C.withLegend('#cities', names.map((n, i) => ({ key: String(i + 1), label: n, color: teamCol[i] })), hd =>
    C.hbars('#cities', { left: 118, rowH: 32, items: cityItems.filter(c => !hd.has(String(c.team))) }));

  // ---- when complaints arrive: day parts, hour curve, weekday bars
  const wh = D.weekday_hour;
  const byHour = d3.range(24).map(h => d3.sum(wh, r => r[h]));
  const byDay = wh.map(r => d3.sum(r));
  const allN = d3.sum(byHour);
  const peakH = d3.maxIndex(byHour);
  const pad2 = h => String(h).padStart(2, '0');
  document.getElementById('peak-badge').textContent = `Peak ${pad2(peakH)}:00`;
  const PARTS = [
    { n: 'Night', r: '00–06', a: 0, b: 6, c: '#5B6BD6' }, { n: 'Morning', r: '06–12', a: 6, b: 12, c: '#FFB020' },
    { n: 'Afternoon', r: '12–18', a: 12, b: 18, c: '#F0147F' }, { n: 'Evening', r: '18–24', a: 18, b: 24, c: '#7B61FF' },
  ];
  PARTS.forEach(p => { p.v = d3.sum(byHour.slice(p.a, p.b)); });
  const topPart = d3.maxIndex(PARTS, p => p.v);
  document.getElementById('parts').innerHTML = PARTS.map((p, i) =>
    `<div class="part${i === topPart ? ' top' : ''}" style="--c:${p.c}"><b>${Math.round(p.v / allN * 100)}%</b><span>${p.n}</span><small>${p.r}</small><i style="width:${p.v / PARTS[topPart].v * 100}%"></i></div>`).join('');

  C.chart('#hourarea', { h: 210, m: { t: 26, r: 10, b: 28, l: 42 } }, (g, w, h, svg, anim) => {
    const x = d3.scaleLinear().domain([0, 23]).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(byHour) * 1.18]).nice().range([h, 0]);
    PARTS.forEach(p => {
      g.append('rect').attr('x', x(p.a)).attr('width', x(Math.min(p.b, 23)) - x(p.a)).attr('height', h).attr('fill', p.c).attr('opacity', 0.07);
      g.append('text').attr('class', 'lbl').style('fill', p.c).attr('x', x(p.a) + 6).attr('y', -9).text(p.n);
    });
    g.append('g').attr('class', 'axis gridline').call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(fmt).tickPadding(8)).select('.domain').remove();
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(d3.range(0, 24, 3)).tickFormat(d => pad2(d) + ':00').tickSize(0).tickPadding(10)).select('.domain').remove();
    g.append('path').attr('d', d3.area().x((d, i) => x(i)).y0(h).y1(d => y(d)).curve(d3.curveMonotoneX)(byHour)).attr('fill', T.complaints).attr('opacity', 0.16);
    const lp = g.append('path').attr('d', d3.line().x((d, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX)(byHour))
      .attr('fill', 'none').attr('stroke', T.complaints).attr('stroke-width', 3.2).attr('stroke-linecap', 'round');
    if (anim) { const L = lp.node().getTotalLength(); lp.attr('stroke-dasharray', L).attr('stroke-dashoffset', L).transition().duration(1200).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0); }
    g.append('circle').attr('cx', x(peakH)).attr('cy', y(byHour[peakH])).attr('r', 6).attr('fill', '#fff').attr('stroke', T.complaints).attr('stroke-width', 3);
    if (C.vals()) g.append('text').attr('class', 'lbl').attr('text-anchor', 'middle').style('fill', T.complaints).attr('x', x(peakH)).attr('y', y(byHour[peakH]) - 12).text(fmt(byHour[peakH]));
    const guide = g.append('line').attr('y1', 0).attr('y2', h).style('stroke', 'var(--ink)').attr('stroke-dasharray', '3 4').attr('opacity', 0);
    g.append('g').selectAll('rect').data(d3.range(24)).join('rect').attr('x', i => x(i) - x(1) / 2).attr('width', x(1)).attr('height', h).attr('fill', 'transparent')
      .on('mousemove', (ev, i) => { guide.attr('x1', x(i)).attr('x2', x(i)).attr('opacity', 0.3); tip.show(`<b>${pad2(i)}:00 – ${pad2(i)}:59</b><br>${fmt(byHour[i])} complaints · ${f1(byHour[i] / allN * 100)}%`, ev); })
      .on('mouseleave', () => { guide.attr('opacity', 0); tip.hide(); });
  });

  const topD = d3.maxIndex(byDay);
  C.bars('#weekbars', { h: 190, labels: D.weekdays, values: byDay, colors: byDay.map((v, i) => (i === topD ? T.complaints : '#F4A6CF')),
    vfmt: fmt, yfmt: fmt, tip: i => `<b>${D.weekdays[i]}</b><br>${fmt(byDay[i])} complaints · ${f1(byDay[i] / allN * 100)}%` });
  [['#donut', '2026'], ['#heat', '2026'], ['#lines', '2026'], ['#mixbar', '2026'], ['#cities', '2026'], ['#hourarea', '2026'], ['#weekbars', '2026']].forEach(([s, t]) => C.year(s, t));
})();

};
pages.drivers = function (C) {
/* Dashboard 3 - FOPs complaints vs availability, load shedding and fiber cuts */
(function () {
  const { D, T, fmt, f1, f2, tip, row, rColor, rTxt } = C;
  const teamCol = T.teams;
  const state = { basis: 'fops' };
  const cur = () => D[state.basis];
  const K = D.kpis;

  /* ------------------------------------------------ hero + story */
  const NET = D.net;
  C.kpis([
    { l: 'Cell availability', v: f2(K.avail_avg), unit: '%', s: '2026 average', d: KPI.delta(K.avail_avg, K.avail_avg_py, { unit: ' pp', dp: 2, vs: '2025' }), spark: NET.avail26, c: 'var(--m-avail)' },
    { l: 'Load shedding', v: f1(K.ls_avg), unit: 'h', s: '2026 average', d: KPI.delta(K.ls_avg, K.ls_avg_py, { unit: ' h', good: 'down', vs: '2025' }), spark: NET.ls26, c: 'var(--m-ls)' },
    { l: 'Complaints at sites under 95% availability', v: f1(K.multiple), unit: '×', s: `${f1(K.low_avail)} vs ${f1(K.high_avail)} per 100 sites`, c: 'var(--m-complaints)' },
  ]);
  function renderStory() {
    const c = cur().central;
    C.story([
      { c: T.avail, t: `Availability vs complaints: <b>r ${rTxt(c.r_avail)}</b>` },
      { c: T.ls, t: `Load shedding vs complaints: <b>r ${rTxt(c.r_ls)}</b>` },
      { c: T.cuts, t: `Fiber cuts vs complaints: <b>r ${rTxt(c.r_cuts)}</b>` },
      { c: T.complaints, t: `Sites under 95%: <b>${f1(K.multiple)}×</b> the complaints` },
      { c: T.cuts, t: `Cuts vs availability: <b>r ${rTxt(D.net.r.avail.y2025)}</b> (2025) · <b>r ${rTxt(D.net.r.avail.y2026)}</b> (2026)` },
    ]);
  }

  /* ------------------------------------------------ sparkline matrix */
  const ROWS = [
    { key: 'complaints', name: 'Complaints', unit: 'per month', color: T.complaints, kind: 'bars', f: v => fmt(v) },
    { key: 'avail', name: 'Availability', unit: 'cell, %', color: T.avail, kind: 'line', f: v => f2(v) + '%' },
    { key: 'ls', name: 'Load shedding', unit: 'hours', color: T.ls, kind: 'line', f: v => f1(v) + ' h' },
    { key: 'cuts', name: 'OFC cuts', unit: 'per month', color: T.cuts, kind: 'line', f: v => fmt(v) },
  ];
  const mHost = document.getElementById('matrix');
  let html = '<div></div>' + [1, 2, 3, 4, 5, 6].map(t =>
    `<div class="colh"><i style="background:${teamCol[t - 1]}"></i>C${t}</div>`).join('');
  ROWS.forEach(r => {
    html += `<div class="rowh" data-r="${r.key}"><b><i style="background:${r.color}"></i>${r.name}</b><span>${r.unit}</span></div>`;
    for (let t = 1; t <= 6; t++) html += `<div class="cell" data-r="${r.key}" data-t="${t}"><div class="val"></div><div class="mo"></div><div class="chart"></div></div>`;
  });
  mHost.innerHTML = html;

  let cells = [];
  const n = D.labels.length;
  function setHover(i) {
    cells.forEach(c => c.set(i));
  }
  function drawMatrix() {
    cells = [];
    const teams = cur().teams;
    ROWS.forEach(r => {
      const all = teams.flatMap(t => t[r.key]).filter(v => v != null);
      let lo = r.kind === 'bars' ? 0 : d3.min(all), hi = d3.max(all);
      if (r.kind === 'line') { const pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad; }
      teams.forEach(t => {
        const cell = mHost.querySelector(`.cell[data-r="${r.key}"][data-t="${t.team}"]`);
        const host = cell.querySelector('.chart');
        const vals = t[r.key];
        host.innerHTML = '';
        const w = Math.max(100, host.clientWidth || 140), h = 78;
        const svg = d3.select(host).append('svg').attr('width', w).attr('height', h + 14);
        const g = svg.append('g');
        const x = d3.scaleBand().domain(d3.range(n)).range([0, w]).padding(r.kind === 'bars' ? 0.22 : 0);
        const y = d3.scaleLinear().domain([lo, hi * (r.kind === 'bars' ? 1.04 : 1)]).range([h, 8]);
        const cx = i => x(i) + x.bandwidth() / 2;
        let dot;
        if (r.kind === 'bars') {
          g.selectAll('rect').data(vals).join('rect').attr('x', (d, i) => x(i)).attr('width', x.bandwidth()).attr('y', d => y(d)).attr('height', d => h - y(d))
            .attr('rx', 2.5).attr('fill', r.color).attr('opacity', 0.78);
        } else {
          const xs = d3.scalePoint().domain(d3.range(n)).range([4, w - 4]);
          const ln = d3.line().defined(d => d != null).x((d, i) => xs(i)).y(d => y(d)).curve(d3.curveMonotoneX);
          const ar = d3.area().defined(d => d != null).x((d, i) => xs(i)).y0(h).y1(d => y(d)).curve(d3.curveMonotoneX);
          g.append('path').attr('d', ar(vals)).attr('fill', r.color).attr('opacity', 0.10);
          g.append('path').attr('d', ln(vals)).attr('fill', 'none').attr('stroke', r.color).attr('stroke-width', 2.4).attr('stroke-linecap', 'round');
          dot = g.append('circle').attr('r', 4).attr('fill', '#fff').attr('stroke', r.color).attr('stroke-width', 2.4);
          x.posX = i => xs(i);
        }
        const posX = r.kind === 'bars' ? cx : x.posX;
        const guide = g.append('line').attr('y1', 0).attr('y2', h).style('stroke', 'var(--ink)').attr('stroke-dasharray', '2 3').attr('opacity', 0);
        const hl = r.kind === 'bars' ? g.append('rect').attr('rx', 2.5).style('fill', 'var(--ink)').attr('opacity', 0) : null;
        if (r.key === 'cuts') {
          const ax = svg.append('g').attr('class', 'axis');
          [0, n - 1].forEach(i => ax.append('text').attr('x', posX(i)).attr('text-anchor', i ? 'end' : 'start').attr('y', h + 12).style('font-size', '10.5px').text(D.labels[i]));
        }
        const valEl = cell.querySelector('.val'), moEl = cell.querySelector('.mo');
        const set = (i) => {
          const idx = i == null ? n - 1 : i;
          const v = vals[idx];
          valEl.textContent = v == null ? '–' : r.f(v);
          valEl.style.color = r.color;
          moEl.textContent = D.labels[idx];
          guide.attr('opacity', i == null ? 0 : 0.35).attr('x1', posX(idx)).attr('x2', posX(idx));
          if (dot) dot.attr('cx', posX(idx)).attr('cy', v == null ? -20 : y(v));
          if (hl) hl.attr('opacity', i == null ? 0 : 0.18).attr('x', x(idx)).attr('width', x.bandwidth()).attr('y', y(v)).attr('height', h - y(v));
        };
        cells.push({ set });
        set(null);
        svg.append('rect').attr('width', w).attr('height', h + 14).attr('fill', 'transparent')
          .on('mousemove', ev => {
            const [mx] = d3.pointer(ev);
            const i = Math.max(0, Math.min(n - 1, Math.round((mx / w) * (n - 1) - (r.kind === 'bars' ? 0 : 0))));
            setHover(i);
          })
          .on('mouseleave', () => setHover(null));
      });
    });
  }
  C.redraws.push(drawMatrix);
  C.withLegend('#matrix', ROWS.map(r => ({ key: r.key, label: r.name, color: r.color })), hd => {
    mHost.querySelectorAll('[data-r]').forEach(el => { el.style.display = hd.has(el.dataset.r) ? 'none' : ''; });
    drawMatrix();
  });

  /* ------------------------------------------------ correlation table */
  function renderR() {
    const d = cur(), cats = d.teams.map(t => 'C' + t.team).concat('All');
    const ser = [{ key: 'a', name: 'Availability', color: T.avail, values: d.teams.map(t => t.r_avail).concat(d.central.r_avail) },
      { key: 'l', name: 'Load shedding', color: T.ls, values: d.teams.map(t => t.r_ls).concat(d.central.r_ls) },
      { key: 'c', name: 'Fiber cuts', color: T.cuts, values: d.teams.map(t => t.r_cuts).concat(d.central.r_cuts) }];
    C.withLegend('#rtable', ser.map(x => ({ key: x.key, label: x.name, color: x.color, type: 'ln' })), hd =>
      C.rlines('#rtable', { cats, h: 400, sepLast: true, series: ser.map(x => ({ ...x, hidden: hd.has(x.key) })) }));
  }

  /* ------------------------------------------------ bubble: LS x availability */
  let hiddenTeams = new Set();
  const bubble = C.chart('#bubble', { h: 340, m: { t: 14, r: 18, b: 44, l: 62 } }, (g, w, h, svg, anim) => {
    const pts = cur().teams.filter(t => !hiddenTeams.has(String(t.team))).flatMap(t => D.labels.map((m, i) => ({ t: t.team, m, ls: t.ls[i], av: t.avail[i], c: t.complaints[i], p: t.per100[i] })))
      .filter(p => p.ls != null && p.av != null);
    if (!pts.length) return;
    const x = d3.scaleLinear().domain(d3.extent(pts, p => p.ls)).nice().range([0, w]);
    const y = d3.scaleLinear().domain(d3.extent(pts, p => p.av)).nice().range([h, 0]);
    const rr = d3.scaleSqrt().domain([0, d3.max(pts, p => p.p)]).range([4, 20]);
    g.append('g').attr('class', 'axis gridline').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(d => d + '%').tickPadding(8)).select('.domain').remove();
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(6).tickSize(0).tickPadding(10)).select('.domain').remove();
    g.append('text').attr('class', 'axis').style('fill', '#66739A').style('font-size', '11.5px').attr('x', w / 2).attr('y', h + 38).attr('text-anchor', 'middle').text('Load shedding (hours)');
    g.append('text').attr('class', 'axis').style('fill', '#66739A').style('font-size', '11.5px').attr('transform', `translate(-50,${h / 2}) rotate(-90)`).attr('text-anchor', 'middle').text('Cell availability');
    g.selectAll('circle').data(pts).join('circle')
      .attr('cx', p => x(p.ls)).attr('cy', p => y(p.av)).attr('fill', p => teamCol[p.t - 1]).attr('fill-opacity', 0.62)
      .attr('stroke', '#fff').attr('stroke-width', 1.4).attr('r', anim ? 0 : (p => rr(p.p)))
      .call(s => { if (anim) s.transition().delay((d, i) => 150 + i * 8).duration(500).attr('r', p => rr(p.p)); })
      .on('mousemove', (ev, p) => tip.show(`<b>C${p.t} · ${p.m}</b>` + row(T.complaints, `Complaints: <b>${fmt(p.c)}</b> (${f1(p.p)} per 100 sites)`) +
        row(T.avail, `Availability: <b>${f2(p.av)}%</b>`) + row(T.ls, `Load shedding: <b>${f1(p.ls)} h</b>`), ev))
      .on('mouseleave', tip.hide);
  });
  C.withLegend('#bubble', [1, 2, 3, 4, 5, 6].map(t => ({ key: String(t), label: 'C' + t, color: teamCol[t - 1], type: 'dot' })), hd => { hiddenTeams = hd; bubble(); });

  /* ------------------------------------------------ site-level evidence */
  const ab = D.avail_buckets, lb = D.ls_buckets;
  const shade = (rgb, k, nn) => d3.interpolateRgb('#F9A8D4', rgb)(1 - k / Math.max(1, nn - 1));
  document.getElementById('av-badge').textContent = `${f1(ab[0].per100 / ab[ab.length - 1].per100)}× more`;
  document.getElementById('ls-badge').textContent = `${f1(lb[lb.length - 1].per100 / lb[0].per100)}× more`;
  C.barsLegend('#avbars', { h: 270, labels: ab.map(b => b.label + '%'), values: ab.map(b => b.per100),
    colors: ab.map((b, i) => shade(T.complaints, i, ab.length)),
    tip: i => `<b>${ab[i].label}% availability</b><br>${f1(ab[i].per100)} per 100 site-months<br>${fmt(ab[i].complaints)} complaints · ${fmt(ab[i].sites)} site-months` });
  C.barsLegend('#lsbars', { h: 270, labels: lb.map(b => b.label), values: lb.map(b => b.per100),
    colors: lb.map((b, i) => d3.interpolateRgb('#D9D0FF', T.ls)(i / (lb.length - 1))),
    tip: i => `<b>${lb[i].label} load shedding</b><br>${f1(lb[i].per100)} per 100 site-months<br>${fmt(lb[i].complaints)} complaints · ${fmt(lb[i].sites)} site-months` });

  const G = D.grid;
  const gmax = d3.max(G.cells.flat().map(c => c.per100).filter(v => v != null));
  C.heat('#grid2d', {
    values: G.cells.map(r => r.map(c => c.per100)), rowLabels: G.rows.map(r => r + '%'), colLabels: G.cols, left: 52, topPad: 26, cellH: 54, rx: 8,
    cellFmt: v => f1(v), scale: d3.scaleSequential(d3.interpolateRgb('#FFE9F4', T.complaints)).domain([0, gmax]),
    tip: (r, c, v) => `<b>${G.rows[r]}% availability · ${G.cols[c]} LS</b><br>${v == null ? 'too few sites' : f1(v) + ' per 100 site-months'}<br>${fmt(G.cells[r][c].n)} site-months`,
  });

  C.gradient('#grid2d', 'Fewer', 'More complaints', T.complaints);

  /* ------------------------------------------------ explorer: one measure, six teams */
  const MEAS = { avail: { yf: v => d3.format('.1f')(v) + '%' }, ls: { yf: v => d3.format('.1f')(v) + ' h' }, cuts: { yf: fmt }, complaints: { yf: fmt } };
  let meas = 'avail';
  function drawExplorer() {
    const ts = cur().teams.map(t => ({ name: 'C' + t.team, color: teamCol[t.team - 1], values: t[meas], w: 2.8 }));
    C.withLegend('#mline', ts.map(s => ({ key: s.name, label: s.name, color: s.color, type: 'ln' })), hd =>
      C.lines('#mline', { labels: D.labels, h: 330, zero: meas === 'cuts' || meas === 'complaints', yfmt: MEAS[meas].yf, series: ts.filter(s => !hd.has(s.name)) }));
  }
  document.querySelectorAll('#mseg button').forEach(b => b.addEventListener('click', () => {
    meas = b.dataset.m;
    document.querySelectorAll('#mseg button').forEach(x => x.classList.toggle('on', x === b));
    drawExplorer();
  }));

  /* ------------------------------------------------ toggle */
  function renderAll() {
    renderStory(); renderR(); drawMatrix(); bubble(); drawExplorer();
    const cap = document.querySelector('#matrix').closest('.card').querySelector('.cap');
    cap.textContent = state.basis === 'fops' ? 'One column per FOPs team · same scale across teams' : 'One column per site region · same scale across regions';
  }
  document.querySelectorAll('#basis button').forEach(b => b.addEventListener('click', () => {
    state.basis = b.dataset.b;
    document.querySelectorAll('#basis button').forEach(x => x.classList.toggle('on', x === b));
    renderAll();
  }));
  renderAll();
  /* ------------------------------------------------ network stats: 2025 vs 2026 */
  const N = D.net, Y25 = '#8896B8';
  const yoy = (sel, k25, k26, color, yf) => {
    const sr = [{ name: '2025', color: Y25, values: N[k25], w: 2.8 },
      { name: '2026', color, values: N[k26].concat(Array(12 - N[k26].length).fill(null)), w: 3.4 }];
    C.withLegend(sel, sr.map(x => ({ key: x.name, label: x.name, color: x.color, type: 'ln' })), hd =>
      C.lines(sel, { labels: N.labels, h: 300, yfmt: yf, noLabels: true, series: sr.filter(x => !hd.has(x.name)) }));
  };
  yoy('#availyoy', 'avail25', 'avail26', T.avail, v => f2(v) + '%');
  yoy('#lsyoy', 'ls25', 'ls26', T.ls, v => f1(v) + ' h');

  /* ------------------------------------------------ cuts vs network stat, both years */
  let nm = 'avail';
  function drawCutScatter() {
    const mk = (ys, cs, yr, color) => cs.map((c, i) => (ys[i] == null ? null : { x: c, y: ys[i], m: N.labels[i], yr, color, label: '' })).filter(Boolean);
    const p25 = mk(N[nm + '25'], N.cuts25, '2025', Y25), p26 = mk(N[nm + '26'], N.cuts26, '2026', T.cuts);
    const fit = ps => { const mx = d3.mean(ps, p => p.x), my = d3.mean(ps, p => p.y); const m = d3.sum(ps, p => (p.x - mx) * (p.y - my)) / d3.sum(ps, p => (p.x - mx) ** 2); return { m, b: my - m * mx }; };
    const all = p25.concat(p26), lo = d3.min(all, p => p.y), hi = d3.max(all, p => p.y), pad = (hi - lo) * 0.15;
    document.getElementById('nbadge').textContent = `r 2025: ${rTxt(N.r[nm].y2025)}  ·  r 2026: ${rTxt(N.r[nm].y2026)}`;
    const unit = nm === 'avail' ? v => f2(v) + '%' : v => f1(v) + ' h';
    C.withLegend('#cutscatter', [{ key: '2025', label: '2025 months', color: Y25, type: 'dot' }, { key: '2026', label: '2026 months', color: T.cuts, type: 'dot' }], hd => {
      C.scatter('#cutscatter', { h: 340, r: 9, allPoints: all, points: all.filter(p => !hd.has(p.yr)), color: T.cuts,
        xTitle: 'OFC cuts in the month', yTitle: nm === 'avail' ? 'Cell availability %' : 'Load shedding, h/day', yDomain: [lo - pad, hi + pad],
        fits: [hd.has('2025') ? null : { ...fit(p25), color: Y25 }, hd.has('2026') ? null : { ...fit(p26), color: T.cuts }].filter(Boolean),
        tip: d => `<b>${d.m} ${d.yr}</b>` + row(T.cuts, `OFC cuts: <b>${fmt(d.x)}</b>`) + row(nm === 'avail' ? T.avail : T.ls, `${nm === 'avail' ? 'Availability' : 'Load shedding'}: <b>${unit(d.y)}</b>`) });
    });
  }
  drawCutScatter();
  document.querySelectorAll('#nseg button').forEach(b => b.addEventListener('click', () => {
    nm = b.dataset.m; document.querySelectorAll('#nseg button').forEach(x => x.classList.toggle('on', x === b)); drawCutScatter(); drawNT();
  }));
  function drawNT() {
    const av = nm === 'avail', k25 = av ? 'r_av25' : 'r_ls25', k26 = av ? 'r_av26' : 'r_ls26', c26 = av ? T.avail : T.ls;
    C.rdumbbell('#ntable', { aName: '2025', bName: '2026', aColor: Y25, bColor: c26,
      rows: N.teams.map(t => ({ label: 'C' + t.team, color: teamCol[t.team - 1], a: t[k25], b: t[k26] }))
        .concat({ label: 'All', all: true, a: N.r[nm].y2025, b: N.r[nm].y2026 }) });
  }
  drawNT();

  /* ------------------------------------------------ site attributes (2026 complaints, mapped by site ID) */
  const AT = D.attr, shadeP = d3.interpolateRgb('#F9A8D4', T.complaints);
  const attrBars = (sel, rows) => C.barsLegend(sel, { h: 280, labels: rows.map(r => r.label), values: rows.map(r => r.per100),
    colors: rows.map((r, i) => shadeP(1 - i / Math.max(1, rows.length - 1))), yfmt: d3.format('.0f'), vfmt: d3.format('.1f'),
    tip: i => `<b>${rows[i].label}</b><br>${f1(rows[i].per100)} per 100 site-months<br>${fmt(rows[i].complaints)} complaints · ${fmt(rows[i].sites)} sites` });
  attrBars('#grpbars', AT.group); attrBars('#bbbars', AT.backup); attrBars('#chrbars', AT.chronic); attrBars('#dgbars', AT.dg);
  C.withLegend('#gridrank', [1, 2, 3, 4, 5, 6].map(t => ({ key: String(t), label: 'C' + t, color: teamCol[t - 1] })), hd =>
    C.hbars('#gridrank', { left: 70, rowH: 32, vfmt: v => f1(v), items: AT.grids.filter(g => !hd.has(String(g.team))).map(g => ({
      label: g.grid, v: g.per100, color: teamCol[g.team - 1],
      tip: `<b>${g.grid}</b> · C${g.team}<br>${f1(g.per100)} per 100 site-months<br>${fmt(g.complaints)} complaints · ${fmt(g.sites)} sites<br>availability ${f2(g.avail)}% · LS ${f1(g.ls)} h` })) }));
  [['#availyoy', '2025 · 2026'], ['#lsyoy', '2025 · 2026'], ['#cutscatter', '2025 · 2026'], ['#ntable', '2025 · 2026'],
    ['#grpbars', '2026'], ['#bbbars', '2026'], ['#chrbars', '2026'], ['#dgbars', '2026'], ['#gridrank', '2026']].forEach(([s, t]) => C.year(s, t));

  [['#matrix', '2026'], ['#rtable', '2026'], ['#bubble', '2026'], ['#mline', '2026'], ['#avbars', '2026'], ['#lsbars', '2026'], ['#grid2d', '2026']].forEach(([s, t]) => C.year(s, t));
})();

};
