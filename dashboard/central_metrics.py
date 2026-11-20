"""
Every number on the Central complaint dashboards (CPM, CRR, CRS, L-3 TAT and Compare),
computed from the CentralCase rows. Inputs are plain pandas DataFrames, so this file does not need Django.

Definitions (nothing else is assumed):
  CPM complaints      : every row of tab 'CPM - NOMC-E2E-REGIONS'
  CRR %               : rows with 'CRR Indicator' = 1, divided by rows with indicator 1 or 0 ('-' rows are left out)
  CRS rows            : tab 'CRS - NOMC'; 'IVR played' = Satisfaction is Satisfied / Not Satisfied / No Response
  Satisfied % (resp.) : Satisfied / (Satisfied + Not Satisfied)
  Within TAT %        : 'Within TAT' + 'Pending Within TAT', divided by all rows of tab 'L-3 TAT'
  Re-opened %         : TAT rows whose COMPLAINTSTATE chain contains 'Re-Opened'
  Handovers           : number of '->' in HANDLINGID
"""
import numpy as np
import pandas as pd

ALL_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
CAT = {'Coverage Related': 'Coverage', 'Internet / Data Speed Related': 'Data speed',
       'Call Connectivity/Quality Related': 'Call quality'}
CAT_ORDER = ['Coverage', 'Data speed', 'Call quality']
SUBS = ['Central I', 'Central II', 'Central III', 'Central IV', 'Central V', 'Central VI']
SAT = ['Satisfied', 'Not Satisfied', 'No Response']
CRR_STATUS = ['Resolved', 'Future Resolved', 'Pending Resolution', 'Not Resolved']
TAT_STATUS = ['Within TAT', 'Pending Within TAT', 'TAT Over']
NOT_MAPPED = 'Not mapped'
MIN_HEAT_N = 10          # heat-map cells with fewer complaints than this are left blank


def _pct(a, b, d=1):
    return round(100.0 * float(a) / float(b), d) if b else None


def _bymonth(d, months):
    s = d['month'].value_counts()
    return [int(s.get(m, 0)) for m in months]


def _vc(series, n=None):
    s = series.value_counts()
    if n:
        s = s.head(n)
    return [{'name': str(k), 'n': int(v)} for k, v in s.items()]


def _clean(o):
    if isinstance(o, dict):
        return {str(k): _clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_clean(v) for v in o]
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating, float)):
        return None if np.isnan(o) else float(o)
    if isinstance(o, np.bool_):
        return bool(o)
    return o


def _prep(df):
    d = df.copy()
    d['cat'] = d['main_tagging'].map(CAT).fillna('Other')
    d['sub'] = d['sub_region'].replace('', np.nan)
    d['ts'] = pd.to_datetime(d['accept_time'])
    return d


# ------------------------------------------------------------------------------------------------ CPM
def _cpm(d, months, labels, teams):
    n = len(d)
    mc = _bymonth(d, months)
    i = int(np.argmax(mc))
    tn = d['team'].value_counts()
    span = (d['ts'].max().normalize() - d['ts'].min().normalize()).days + 1
    k = {'total': n, 'peak': labels[i], 'peak_n': mc[i], 'last': labels[-1], 'last_n': mc[-1],
         'mom': _pct(mc[-1] - mc[-2], mc[-2]) if len(mc) > 1 and mc[-2] else None,
         'coverage_share': _pct((d['cat'] == 'Coverage').sum(), n),
         'top_team': int(tn.idxmax()), 'top_team_share': _pct(tn.max(), n), 'per_day': round(n / span, 1)}
    g = d.groupby(['sub', 'month']).size()
    city = d.groupby('city').agg(n=('sn', 'size'), team=('team', lambda s: int(s.mode().iat[0]) if s.notna().any() else 0))
    city = city.sort_values('n', ascending=False).head(12)
    ch = d['channel'].replace('', 'Not recorded').replace({'Socia Media': 'Social Media'})
    hw = d.groupby([d['ts'].dt.dayofweek, d['ts'].dt.hour]).size()
    day = d['ts'].dt.strftime('%Y-%m-%d').value_counts().sort_index()
    return {
        'kpis': k, 'monthly': mc,
        'type_month': {c: _bymonth(d[d['cat'] == c], months) for c in CAT_ORDER},
        'team_share': [{'team': t, 'n': int((d['team'] == t).sum())} for t in teams],
        'team_month': [_bymonth(d[d['team'] == t], months) for t in teams],
        'sub_heat': [[mi, si, int(g.get((s, m), 0))] for si, s in enumerate(SUBS) for mi, m in enumerate(months)],
        'cities': [{'name': c, 'n': int(r['n']), 'team': int(r['team'])} for c, r in city.iterrows()],
        'titles': _vc(d['service_title']),
        'site_class': _vc(d['site_class'].replace('-', 'Unclassified')),
        'channel': _vc(ch),
        'hour_week': [[h, w, int(hw.get((w, h), 0))] for w in range(7) for h in range(24)],
        'daily': [[k_, int(v)] for k_, v in day.items()],
        'day_range': [day.index[0], day.index[-1]],
        'cat_share': [{'name': c, 'n': int((d['cat'] == c).sum())} for c in CAT_ORDER],
    }


# ------------------------------------------------------------------------------------------------ CRR
def _crr(d, months, teams):
    c = d[d['crr_flag'].notna()]
    ok = c['crr_flag'] == 1
    mp = [_pct(((c['month'] == m) & ok).sum(), (c['month'] == m).sum()) for m in months]
    low = min((v, i) for i, v in enumerate(mp) if v is not None)
    heat = []
    for si, s in enumerate(SUBS):
        for mi, m in enumerate(months):
            x = c[(c['sub'] == s) & (c['month'] == m)]
            heat.append([mi, si, _pct((x['crr_flag'] == 1).sum(), len(x)) if len(x) >= MIN_HEAT_N else None])
    cl = d['closure'].replace('', 'Not recorded').value_counts()
    closure = [{'name': a, 'n': int(b)} for a, b in cl.head(8).items()]
    if len(cl) > 8:
        closure.append({'name': 'Other', 'n': int(cl.iloc[8:].sum())})
    fix = d['fix_type'].replace('', np.nan).dropna()
    return {
        'kpis': {'rows': len(d), 'considered': len(c), 'pct': _pct(ok.sum(), len(c)), 'unresolved': int((~ok).sum()),
                 'pending': int((d['resolution'] == 'Pending Resolution').sum()),
                 'low_label': None, 'low_pct': low[0], 'low_i': low[1]},
        'monthly_pct': mp, 'monthly_n': [int((c['month'] == m).sum()) for m in months],
        'monthly_open': [int(((c['month'] == m) & ~ok).sum()) for m in months],
        'team': [{'team': t, 'pct': _pct(((c['team'] == t) & ok).sum(), (c['team'] == t).sum()),
                  'n': int((c['team'] == t).sum()), 'open': int(((c['team'] == t) & ~ok).sum())} for t in teams],
        'sub_heat': heat,
        'status': [{'name': s, 'n': int((d['resolution'] == s).sum())} for s in CRR_STATUS],
        'status_month': {s: _bymonth(d[d['resolution'] == s], months) for s in CRR_STATUS},
        'closure': closure,
        'type': [{'name': k, 'pct': _pct(((c['cat'] == k) & ok).sum(), (c['cat'] == k).sum()),
                  'n': int((c['cat'] == k).sum())} for k in CAT_ORDER],
        'fix': _vc(fix, 10), 'fix_total': int(len(fix)),
    }


# ------------------------------------------------------------------------------------------------ CRS
def _split(p, col, keys):
    return [{'key': k, **{s: int(((p[col] == k) & (p['satisfaction'] == s)).sum()) for s in SAT}} for k in keys]


def _crs(d, months, teams):
    p = d[d['satisfaction'].isin(SAT)]
    sc = {s: int((p['satisfaction'] == s).sum()) for s in SAT}
    played, resp = len(p), sc['Satisfied'] + sc['Not Satisfied']
    by = {s: _bymonth(p[p['satisfaction'] == s], months) for s in SAT}
    # closure state -> satisfaction flow (all rows; 'IVR not played' = Satisfaction '-')
    sat_name = {'Satisfied': 'Satisfied', 'Not Satisfied': 'Not Satisfied', 'No Response': 'No Response'}
    flow = d.assign(sat=d['satisfaction'].map(sat_name).fillna('IVR not played'),
                    clo=d['closure'].replace('', 'Not recorded'))
    cc = flow['clo'].value_counts()
    small = set(cc[cc < 50].index)
    flow['clo'] = flow['clo'].where(~flow['clo'].isin(small), 'Other closure')
    ct = flow.groupby(['clo', 'sat']).size()
    links = [{'source': a, 'target': b, 'value': int(v)} for (a, b), v in ct.items() if v > 0]
    nots = p[p['satisfaction'] == 'Not Satisfied'].groupby('city').size()
    city = [{'name': c, 'not': int(v), 'played': int(len(p[p['city'] == c]))}
            for c, v in nots.sort_values(ascending=False).head(10).items()]
    return {
        'kpis': {'rows': len(d), 'played': played, 'not_played': len(d) - played, 'sat': sc['Satisfied'],
                 'not': sc['Not Satisfied'], 'none': sc['No Response'], 'sat_played': _pct(sc['Satisfied'], played),
                 'sat_resp': _pct(sc['Satisfied'], resp), 'resp_rate': _pct(resp, played), 'not_resp': _pct(sc['Not Satisfied'], resp)},
        'month': by,
        'month_sat_resp': [_pct(by['Satisfied'][i], by['Satisfied'][i] + by['Not Satisfied'][i]) for i in range(len(months))],
        'month_resp_rate': [_pct(by['Satisfied'][i] + by['Not Satisfied'][i], sum(by[s][i] for s in SAT)) for i in range(len(months))],
        'team': _split(p, 'team', teams), 'sub': _split(p, 'sub', SUBS), 'type': _split(p, 'cat', CAT_ORDER),
        'flow': {'nodes': sorted({l['source'] for l in links}) + ['Satisfied', 'Not Satisfied', 'No Response', 'IVR not played'],
                 'links': links},
        'city': city,
    }


# ------------------------------------------------------------------------------------------------ TAT
def _tat(d, tm, teams):
    n = len(d)
    st = d['tat_status'].value_counts()
    within, pend, over = int(st.get('Within TAT', 0)), int(st.get('Pending Within TAT', 0)), int(st.get('TAT Over', 0))
    sub = d['sub'].fillna(NOT_MAPPED)
    sub_keys = SUBS + ([NOT_MAPPED] if (sub == NOT_MAPPED).any() else [])
    openm = d['tat_status'].isin(['Pending Within TAT', 'TAT Over'])
    hd = d['handovers'].dropna().astype(int).value_counts().sort_index()
    wm = []
    for m in tm:
        x = d[d['month'] == m]
        wm.append(_pct(x['tat_status'].isin(['Within TAT', 'Pending Within TAT']).sum(), len(x)))
    return {
        'kpis': {'total': n, 'within': within, 'pending': pend, 'over': over, 'within_pct': _pct(within + pend, n),
                 'reopen_pct': _pct(int(d['reopened'].sum()), n), 'avg_hand': round(float(d['handovers'].mean()), 1)},
        'status_month': {s: _bymonth(d[d['tat_status'] == s], tm) for s in TAT_STATUS},
        'within_month': wm,
        'status_team': {s: [int(((d['tat_status'] == s) & (d['team'] == t)).sum()) for t in teams] for s in TAT_STATUS},
        'open_heat': [[mi, ti, int(((d['month'] == m) & (d['team'] == t) & openm).sum())]
                      for ti, t in enumerate(teams) for mi, m in enumerate(tm)],
        'hand_dist': [{'k': int(k), 'n': int(v)} for k, v in hd.items()],
        'hand_team': [round(float(d[d['team'] == t]['handovers'].mean()), 2) for t in teams],
        'reopen_month': [_pct(d[d['month'] == m]['reopened'].sum(), (d['month'] == m).sum()) for m in tm],
        'arpu': _vc(d['arpu'].replace('', 'Not tagged')),
        'type_team': {c: [int(((d['cat'] == c) & (d['team'] == t)).sum()) for t in teams] for c in CAT_ORDER},
        'sub_keys': sub_keys,
        'sub_heat': [[mi, si, int(((d['month'] == m) & (sub == s)).sum())] for si, s in enumerate(sub_keys) for mi, m in enumerate(tm)],
    }


# ------------------------------------------------------------------------------------------------ Compare
def _score(col, keys, labels, cpm, crr_c, crs_p, tat):
    rows = []
    for key, lab in zip(keys, labels):
        a, b, c, e = (x[x[col] == key] for x in (cpm, crr_c, crs_p, tat))
        sat = (c['satisfaction'] == 'Satisfied').sum()
        resp = sat + (c['satisfaction'] == 'Not Satisfied').sum()
        rows.append({'label': lab, 'n': len(a), 'crr': _pct((b['crr_flag'] == 1).sum(), len(b)), 'sat': _pct(sat, resp),
                     'tat': _pct(e['tat_status'].isin(['Within TAT', 'Pending Within TAT']).sum(), len(e)),
                     'reopen': _pct(e['reopened'].sum(), len(e))})
    return rows


def _compare(cpm, crr, crs, tat, months, teams, B):
    crr_c = crr[crr['crr_flag'].notna()]
    crs_p = crs[crs['satisfaction'].isin(SAT)]
    tm = sorted(int(m) for m in tat['month'].unique())
    tat_n, tat_w = dict(zip(tm, _bymonth(tat, tm))), dict(zip(tm, B['tat']['within_month']))
    sat_resp = [x for x in B['crs']['month_sat_resp']]
    resp = int((crs_p['satisfaction'].isin(['Satisfied', 'Not Satisfied'])).sum())
    ok = int((crr_c['crr_flag'] == 1).sum())
    return {
        'vol': {'CPM': B['cpm']['monthly'], 'CRR': B['crr']['monthly_n'], 'CRS': _bymonth(crs_p, months),
                'TAT': [tat_n.get(m) for m in months]},
        'rates': {'CRR': B['crr']['monthly_pct'], 'CRS': sat_resp, 'TAT': [tat_w.get(m) for m in months]},
        'team_score': _score('team', teams, [f'FOPs C{t}' for t in teams], cpm, crr_c, crs_p, tat),
        'sub_score': _score('sub', SUBS, SUBS, cpm, crr_c, crs_p, tat),
        'funnel': [{'name': 'CPM complaints', 'n': len(cpm)}, {'name': 'CRR considered', 'n': len(crr_c)},
                   {'name': 'CRR resolved', 'n': ok}, {'name': 'CRS IVR played', 'n': len(crs_p)},
                   {'name': 'CRS responded', 'n': resp},
                   {'name': 'CRS satisfied', 'n': int((crs_p['satisfaction'] == 'Satisfied').sum())}],
        'type_mix': {k: [int((x['cat'] == c).sum()) for c in CAT_ORDER]
                     for k, x in (('CPM', cpm), ('CRR', crr_c), ('CRS', crs_p), ('TAT', tat))},
        'team_vol': {k: [int((x['team'] == t).sum()) for t in teams]
                     for k, x in (('CPM', cpm), ('CRR', crr_c), ('CRS', crs_p), ('TAT', tat))},
    }


def compute(df):
    """df columns = CentralCase fields. Returns the JSON-ready payload the dashboards draw."""
    d = _prep(df)
    sets = {k: d[d['dataset'] == k] for k in ('CPM', 'CRR', 'CRS', 'TAT')}
    for k, v in sets.items():
        if v.empty:
            raise ValueError(f'no {k} rows loaded - run: python manage.py load_central --file Central-RCTO.xlsx')
    cpm, crr, crs, tat = sets['CPM'], sets['CRR'], sets['CRS'], sets['TAT']
    n_m = int(max(x['month'].max() for x in sets.values()))
    months = list(range(1, n_m + 1))
    labels = ALL_LABELS[:n_m]
    teams = sorted(int(t) for t in cpm['team'].dropna().unique())
    tm = sorted(int(m) for m in tat['month'].unique())
    B = {'cpm': _cpm(cpm, months, labels, teams), 'crr': _crr(crr, months, teams), 'crs': _crs(crs, months, teams),
         'tat': _tat(tat, tm, teams)}
    B['crr']['kpis']['low_label'] = labels[B['crr']['kpis']['low_i']]
    B['compare'] = _compare(cpm, crr, crs, tat, months, teams, B)
    B['meta'] = {'labels': labels, 'months': months, 'teams': teams, 'subs': SUBS, 'tat_months': tm,
                 'tat_labels': [ALL_LABELS[m - 1] for m in tm], 'cats': CAT_ORDER,
                 'period': f'{labels[0]}–{labels[-1]} 2026', 'rows': {k: len(v) for k, v in sets.items()}}
    return _clean(B)
