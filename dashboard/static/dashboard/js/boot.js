/* Router: one dashboard per hash (#complaints, #fops, #drivers, #scorecard, #crr, #crs, #tat). */
const MONTHS_FULL = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July',
  Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };

/* Plain-English headings for the original charts (chart id -> heading), so every chart explains itself. */
const RETITLE = {
  combo: 'Complaints and fiber cuts, month by month', scatter: 'Do more fiber cuts mean more complaints?', minis: 'Complaints vs fiber cuts in each sub-region',
  linkr: 'Which fiber type moves with complaints?', yoy: 'Fiber cuts per month: 2025 vs 2026', mix: 'Complaints per month by type', sitelink: 'Do sites on a cut fiber section complain more?',
  donut: 'Share of complaints handled by each FOPs team', heat: 'Complaints per FOPs team in each month', lines: 'Each FOPs team’s complaints, month by month',
  mixbar: 'What each FOPs team’s complaints are about', cities: 'Cities with the most complaints 2025-26', hourarea: 'At what time of day complaints arrive',
  matrix: 'Complaints, availability, load shedding and fiber cuts, team by team', mline: 'One measure, all teams, month by month',
  rtable: 'Does each measure move with complaints? (by team)', bubble: 'Low availability and high load shedding: more complaints?',
  avbars: 'Complaints at sites with low vs high availability', lsbars: 'Complaints at sites with little vs much load shedding', grid2d: 'Availability and load shedding together: which mix hurts most',
  availyoy: 'Network availability, month by month', lsyoy: 'Load shedding, month by month', cutscatter: 'Do fiber cuts pull network availability down?',
  ntable: 'Fiber cuts vs network, by team', grpbars: 'Complaints by site group', bbbars: 'Complaints by power-backup type', chrbars: 'Chronic below-target sites vs others',
  dgbars: 'Complaints by generator (DG) status', gridrank: 'Grids with the most complaints',
};
const QKEYS = ['crr', 'crs', 'tat'];

/* Complaints & Fiber can run on four data sets: CPM complaints (default) or the CRR / CRS / L-3 TAT tickets.
   Same charts, same maths; only the tickets change. */
const SET_NAMES = { cpm: 'CRM', crr: 'CRR', crs: 'CRS', tat: 'TAT' };
const SET_HINT = { cpm: 'Every customer complaint (CRM) · the default view', crr: 'Complaints that went through the resolution (CRR) sheet', crs: 'Complaints in the customer-satisfaction survey (CRS) sheet', tat: 'Tickets in the L-3 turn-around-time (TAT) sheet' };
window.__set = window.__set || 'cpm';
const hasSets = () => typeof DSETS !== 'undefined' && DSETS;
const sourceFor = key => (window.__set !== 'cpm' && hasSets() && DSETS[window.__set] && DSETS[window.__set][key]) ? DSETS[window.__set] : DATA;

function setBar(key) {
  const bar = document.getElementById('dsbar');
  const has = k => k === 'cpm' || (hasSets() && !!DSETS[k]);
  const cur = has(window.__set) ? window.__set : 'cpm';
  const meta = cur === 'cpm' ? null : DSETS[cur].dataset;
  const gap = meta && meta.months.length < DSETS[cur].complaints.labels.length ? ` · months with tickets: ${meta.months.join(', ')}` : '';
  const gapNote = meta && (DSETS[cur].complaints.gap || []).length ? ` · ${DSETS[cur].complaints.gap.join(', ')} have no tickets in this sheet: they are not counted as zero complaints in any correlation, average or rate` : '';
  const nosite = meta && meta.no_site > 0.1 * meta.rows ? ` · ${meta.no_site.toLocaleString('en-US')} tickets have no site in the source` : '';
  bar.innerHTML = '<span class="glab">Complaints</span>' +
    ['cpm', 'crr', 'crs', 'tat'].map(k => `<button type="button" class="vchip${k === cur ? ' on' : ''}" data-set="${k}" aria-pressed="${k === cur}"${has(k) ? '' : ' disabled title="Data not loaded yet" style="opacity:.45;cursor:not-allowed"'}>${SET_NAMES[k]}</button>`).join('') +
    `<span class="count">${!hasSets() ? 'CRR, CRS and TAT are not loaded yet: run  python manage.py load_rcto &lt;Consolidated file with the CRR, CRS and L-3 TAT tabs&gt;' : cur === 'cpm' ? SET_HINT.cpm : `${SET_HINT[cur]} · all ${meta.rows.toLocaleString('en-US')} tickets${gap}${nosite}${gapNote}`}</span>`;
  bar.style.display = 'flex';
  bar.querySelectorAll('button').forEach(b => { b.onclick = () => { if (b.disabled) return; window.__set = b.dataset.set; show(); }; });
}

function retitle() {
  Object.keys(RETITLE).forEach(id => {
    const el = document.getElementById(id), h = el && el.closest('.card') && el.closest('.card').querySelector('h2');
    if (h) h.textContent = RETITLE[id];
  });
}

function show() {
  let k = (location.hash || '#complaints').slice(1);
  if (QKEYS.includes(k)) { if (hasSets() && DSETS[k]) window.__set = k; history.replaceState(null, '', '#complaints'); k = 'complaints'; }
  document.querySelectorAll('#tabs a').forEach(a => { const on = a.dataset.k === k || (!VIEWS[k] && !QKEYS.includes(k) && a.dataset.k === 'complaints'); a.classList.toggle('on', on); a.setAttribute('aria-current', on ? 'page' : 'false'); });
  if (window.AK) AK.destroy();
  if (QKEYS.includes(k)) {                                   /* new data: CPM / CRR / CRS / L-3 TAT */
    document.title = k.toUpperCase() + ' · RCTO Central Performance Hub';
    if (!QDATA) { document.getElementById('view').innerHTML = '<article class="card"><h2>No CRR / CRS / TAT data yet</h2><p class="why">Run: python manage.py load_rcto Central-RCTO.xlsx</p></article>'; return; }
    QUALITY.render(k, QDATA);
    window.scrollTo(0, 0);
    return;
  }
  const key = VIEWS[k] ? k : 'complaints';
  const v = VIEWS[key];
  const S = sourceFor(key);
  const lab = S[key].labels;
  setBar(key);
  const span = `${MONTHS_FULL[lab[0]]} to ${MONTHS_FULL[lab[lab.length - 1]]} 2026`;
  document.getElementById('h1').innerHTML = v.h1 + (S !== DATA ? ' · ' + SET_NAMES[window.__set] : '');
  document.getElementById('periodLbl').textContent = lab[0] + '–' + lab[lab.length - 1] + ' 2026';
  document.getElementById('sub').innerHTML = v.sub.replace('January to October 2026', span);
  document.getElementById('view').innerHTML = v.body;
  document.title = v.h1.replace(/&amp;/g, '&') + ' · RCTO Central Performance Hub';
  const C = initCharts({ theme: THEME, data: S[key] });
  pages[key](C);
  retitle();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', show);
show();