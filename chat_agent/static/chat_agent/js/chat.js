/* Zee Chatbot front end: sends the question to /chat/api/, renders interactive ECharts visuals, filterable tables, and executive summaries. */
(function () {
  'use strict';
  var root = document.getElementById('chat');
  var API = root.getAttribute('data-api');
  var chatBox = document.getElementById('chat-box');
  var input = document.getElementById('user-input');
  var form = document.getElementById('chat-form');
  var sendBtn = document.getElementById('send-btn');
  var loading = document.getElementById('loading');
  var stage = document.getElementById('loading-stage');
  var backdrop = document.getElementById('sbk');
  var sideTxt = document.getElementById('sideTxt');
  var sideBtn = document.getElementById('sideBtn');

  var totalQueries = 0, tableCounter = 0, msgCounter = 0, chartCounter = 0, started = false, busy = false, transcript = [];
  var isMobile = function () { return window.innerWidth <= 1000; };
  var PALETTE = ['#3fe6b0', '#ff4d8d', '#8b5cf6', '#38bdf8', '#f59e0b', '#10b981'];

  var ICON = {
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 14h6l-1 7 8-11h-6z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'
  };

  function esc(s) { return String(s).replace(/[&<>'"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[c]; }); }
  function cookie(name) {
    var m = document.cookie.split(';').map(function (c) { return c.trim(); }).filter(function (c) { return c.indexOf(name + '=') === 0; })[0];
    return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
  }
  function scrollDown() { chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' }); }
  function nowTime() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  /* ---------------------------------------------------------------- sidebar */
  function setSide(open) {
    root.classList.toggle('noside', !open);
    sideBtn.setAttribute('aria-expanded', String(open));
    sideTxt.textContent = open ? 'Hide sidebar' : 'Show sidebar';
    backdrop.hidden = !(open && isMobile());
  }
  setSide(!isMobile());
  sideBtn.addEventListener('click', function () { setSide(root.classList.contains('noside')); });
  backdrop.addEventListener('click', function () { setSide(false); });

  /* ---------------------------------------------------------------- input */
  input.addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-prompt],[data-fill]');
    if (!t) return;
    if (isMobile()) setSide(false);
    if (t.hasAttribute('data-prompt')) { input.value = t.getAttribute('data-prompt'); send(); }
    else { input.value = t.getAttribute('data-fill'); input.focus(); }
  });

  /* ---------------------------------------------------------------- send */
  async function send() {
    var message = input.value.trim();
    if (!message || busy) return;
    busy = true; sendBtn.disabled = true;
    if (!started) { started = true; var w = document.getElementById('welcome-hero'); if (w) w.remove(); }

    addMessage(message, 'user');
    input.value = ''; input.style.height = 'auto';
    loading.hidden = false; stage.textContent = 'Routing schema & generating SQL query…'; scrollDown();

    var t0 = performance.now();
    var timer = setTimeout(function () { stage.textContent = 'Executing SQL, building visual & executive insights…'; }, 1400);
    try {
      var res = await fetch(API, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': cookie('csrftoken') },
        body: JSON.stringify({ query: message })
      });
      var secs = ((performance.now() - t0) / 1000).toFixed(2);
      var data = {};
      try { data = await res.json(); } catch (_) {}
      totalQueries++;
      document.getElementById('stat-queries').textContent = totalQueries;
      document.getElementById('stat-latency').textContent = secs + 's';
      if (res.ok && data.answer) addMessage(data.answer, 'bot', false, secs, data.visual || null);
      else addMessage('⚠️ ' + (data.error || 'Unable to process the request right now (HTTP ' + res.status + ').'), 'bot', true, secs, null);
    } catch (err) {
      addMessage('⚠️ Network error: the server could not be reached. Check that it is running and try again.', 'bot', true, null, null);
    } finally {
      clearTimeout(timer); loading.hidden = true; busy = false; sendBtn.disabled = false; input.focus();
    }
  }

  /* ---------------------------------------------------------------- render */
  function renderMarkdown(text) {
    if (!window.marked) return '<p style="white-space:pre-wrap">' + esc(text) + '</p>';
    var html = window.marked.parse(text);
    return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
  }

  function renderVisualCard(container, spec) {
    if (!spec || !window.echarts || !spec.series || !spec.series.length) return;
    var cid = 'zee-chart-' + (++chartCounter);
    var kpiHtml = '';
    if (spec.kpis && spec.kpis.length) {
      kpiHtml = '<div class="zee-vis-kpis">' + spec.kpis.map(function (k, idx) {
        var c = PALETTE[idx % PALETTE.length];
        return '<div class="zee-vis-kpi"><small>' + esc(k.label) + '</small>' +
               '<b style="color:' + c + '">Avg: ' + Number(k.avg).toLocaleString() + '</b>' +
               '<span>Max: ' + Number(k.max).toLocaleString() + '</span></div>';
      }).join('') + '</div>';
    }

    var card = document.createElement('div');
    card.className = 'zee-vis-card';
    card.innerHTML =
      '<div class="zee-vis-head">' +
        '<div><div class="zee-vis-tag">Interactive Analytics Visual</div><div class="zee-vis-title">' + esc(spec.title) + '</div></div>' +
        '<div class="zee-vis-btns">' +
          '<button type="button" data-chart-type="bar" class="' + (spec.mode !== 'line' ? 'on' : '') + '">Bar</button>' +
          '<button type="button" data-chart-type="line" class="' + (spec.mode === 'line' ? 'on' : '') + '">Line</button>' +
          '<button type="button" data-chart-dl="1">PNG</button>' +
        '</div>' +
      '</div>' +
      kpiHtml +
      '<div id="' + cid + '" class="zee-vis-canvas"></div>';

    container.insertBefore(card, container.firstChild);

    var chartDom = document.getElementById(cid);
    var chart = window.echarts.init(chartDom);

    function drawChart(overrideType) {
      var activeType = overrideType || (spec.mode === 'line' ? 'line' : 'bar');
      var series = spec.series.map(function (s, idx) {
        var color = PALETTE[idx % PALETTE.length];
        var sType = (spec.mode === 'combo' && idx > 0 && !overrideType) ? 'line' : activeType;
        return {
          name: s.name,
          type: sType,
          data: s.data,
          smooth: 0.35,
          barMaxWidth: 28,
          itemStyle: { color: color, borderRadius: sType === 'bar' ? [5, 5, 0, 0] : 0 },
          lineStyle: { width: 2.5, color: color }
        };
      });

      chart.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(12,18,25,0.95)',
          borderColor: 'rgba(255,255,255,0.15)',
          textStyle: { color: '#e8eef2', fontSize: 11 }
        },
        legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10.5 } },
        grid: { left: '3%', right: '3%', top: '16%', bottom: '6%', containLabel: true },
        xAxis: {
          type: 'category',
          data: spec.categories,
          axisLabel: { color: '#94a3b8', fontSize: 10, rotate: spec.categories.length > 8 ? 25 : 0 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
          axisLabel: { color: '#64748b', fontSize: 10 }
        },
        series: series
      }, true);
    }

    drawChart();

    card.querySelectorAll('button[data-chart-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        card.querySelectorAll('button[data-chart-type]').forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        drawChart(btn.getAttribute('data-chart-type'));
      });
    });

    card.querySelector('button[data-chart-dl]').addEventListener('click', function () {
      download('ZeeChatbot_Chart_' + cid + '.png', null, null, chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0c1219' }));
    });

    window.addEventListener('resize', function () { chart.resize(); });
  }

  function addMessage(text, sender, isError, secs, visualSpec) {
    var time = nowTime();
    transcript.push({ sender: sender.toUpperCase(), time: time, text: text });
    var row = document.createElement('div');
    row.className = 'msg-item ' + sender;
    if (sender === 'user') {
      row.innerHTML = '<div class="bubble user"><div class="meta"><span>You</span><span>' + time + '</span></div><div>' + esc(text).replace(/\n/g, '<br>') + '</div></div>';
    } else {
      var id = 'bot-msg-' + (++msgCounter);
      row.innerHTML =
        '<div class="bubble bot' + (isError ? ' err' : '') + '">' +
          '<div class="meta"><span class="who">' + ICON.bolt.replace('<svg ', '<svg width="14" height="14" ') + 'Zee Chatbot' +
            (secs ? '<span class="lat">' + secs + 's</span>' : '') + '</span><span>' + time + '</span></div>' +
          '<div id="' + id + '" class="md"></div>' +
          '<div class="acts"><button type="button" data-act="copy" data-target="' + id + '">' + ICON.copy + '<span>Copy</span></button>' +
          '<button type="button" data-act="speak" data-target="' + id + '">' + ICON.speak + '<span>Listen</span></button></div>' +
        '</div>';
      var body = row.querySelector('#' + id);
      body.innerHTML = renderMarkdown(text);
      enhanceTables(body);
      if (visualSpec) renderVisualCard(body, visualSpec);
    }
    chatBox.appendChild(row);
    scrollDown();
  }

  function enhanceTables(scope) {
    scope.querySelectorAll('table').forEach(function (table) {
      tableCounter++;
      var tid = 'data-table-' + tableCounter, wid = 'table-wrap-' + tableCounter;
      table.id = tid;
      var n = table.querySelectorAll('tbody tr').length;
      var bar = document.createElement('div');
      bar.className = 'tbar';
      bar.innerHTML = '<div class="l"><span class="rows">' + n + ' rows</span><input type="search" placeholder="Filter ' + n + ' rows…" aria-label="Filter table rows" data-filter="' + tid + '"></div>' +
        '<div class="r"><button type="button" data-act="expand" data-target="' + wid + '">Expand all</button><button type="button" data-act="csv" data-target="' + tid + '">Export CSV</button></div>';
      var wrap = document.createElement('div');
      wrap.id = wid; wrap.className = 'twrap';
      table.parentNode.insertBefore(bar, table);
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* delegated actions inside answers */
  chatBox.addEventListener('input', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-filter');
    if (!id) return;
    var q = e.target.value.toLowerCase();
    document.querySelectorAll('#' + id + ' tbody tr').forEach(function (r) { r.style.display = r.innerText.toLowerCase().indexOf(q) > -1 ? '' : 'none'; });
  });

  chatBox.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act'), el = document.getElementById(b.getAttribute('data-target'));
    if (!el) return;
    if (act === 'expand') {
      var open = el.style.maxHeight === 'none';
      el.style.maxHeight = open ? '' : 'none';
      b.textContent = open ? 'Expand all' : 'Collapse';
    } else if (act === 'csv') {
      var lines = [];
      el.querySelectorAll('tr').forEach(function (r) {
        if (r.style.display === 'none') return;
        lines.push(Array.prototype.map.call(r.querySelectorAll('th,td'), function (c) { return '"' + c.innerText.replace(/"/g, '""') + '"'; }).join(','));
      });
      download('Zee_KPI_' + el.id + '.csv', lines.join('\n'), 'text/csv;charset=utf-8;');
    } else if (act === 'copy') {
      if (navigator.clipboard) navigator.clipboard.writeText(el.innerText);
      var old = b.innerHTML; b.innerHTML = ICON.check + '<span>Copied</span>';
      setTimeout(function () { b.innerHTML = old; }, 1600);
    } else if (act === 'speak') {
      if (!('speechSynthesis' in window)) return;
      var label = function (icon, txt) { b.innerHTML = icon + '<span>' + txt + '</span>'; };
      if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); label(ICON.speak, 'Listen'); return; }
      var u = new SpeechSynthesisUtterance(el.innerText.slice(0, 600));
      u.rate = 1.05; u.onend = function () { label(ICON.speak, 'Listen'); };
      label(ICON.stop, 'Stop'); window.speechSynthesis.speak(u);
    }
  });

  function download(name, text, type, dataUrl) {
    var a = document.createElement('a');
    a.href = dataUrl || URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; a.click();
    if (!dataUrl) setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ---------------------------------------------------------------- toolbar */
  document.getElementById('chat-search').addEventListener('input', function () {
    var q = this.value.toLowerCase();
    chatBox.querySelectorAll('.msg-item').forEach(function (i) { i.style.display = i.innerText.toLowerCase().indexOf(q) > -1 ? '' : 'none'; });
  });
  document.getElementById('exportBtn').addEventListener('click', function () {
    if (!transcript.length) return;
    var md = '# Zee Chatbot session report\n\n';
    transcript.forEach(function (t) { md += '### ' + t.sender + ' (' + t.time + ')\n' + t.text + '\n\n---\n\n'; });
    download('ZeeChatbot_Report_' + new Date().toISOString().slice(0, 10) + '.md', md, 'text/markdown;charset=utf-8;');
  });
  document.getElementById('clearBtn').addEventListener('click', function () { transcript = []; started = true; chatBox.innerHTML = ''; });

  var rec = null;
  document.getElementById('mic-btn').addEventListener('click', function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = this;
    if (!SR) { alert('Voice input is supported in Chrome or Edge.'); return; }
    rec = new SR(); rec.lang = 'en-US'; mic.classList.add('rec');
    var stop = function () { mic.classList.remove('rec'); };
    rec.onresult = function (ev) { input.value = ev.results[0][0].transcript; input.focus(); stop(); };
    rec.onerror = stop; rec.onend = stop; rec.start();
  });
})();