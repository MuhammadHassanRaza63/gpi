"""CPM / CRR / CRS / L-3 TAT numbers for the RCTO Central dashboard, built from Central-RCTO.xlsx (all 6 tabs).
No Django needed: build(path) returns a JSON-able dict that load_rcto stores as Snapshot 'quality'."""
import pandas as pd
import numpy as np

KEY = 'quality'
MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
TEAMS = [1, 2, 3, 4, 5, 6]
SUBS = ['Central I', 'Central II', 'Central III', 'Central IV', 'Central V', 'Central VI']
CAT = {'Coverage Related': 'Coverage', 'Internet / Data Speed Related': 'Data speed', 'Call Connectivity/Quality Related': 'Call quality'}
CATS = ['Coverage', 'Data speed', 'Call quality']
CLASS = ['Platinum +', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Strategic']
SHEETS = ['CPM - NOMC-E2E-REGIONS', 'CRR - E2E & REGIONS', 'CRR - NOMC', 'CRS - E2E & REGIONS', 'CRS - NOMC', 'L-3 TAT']


def _r(x, n=1):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), n)


def _pct(a, b):
    return None if not b else round(100.0 * a / b, 2)


def _team(s):
    return pd.to_numeric(s.astype(str).str.extract(r'C(\d)')[0], errors='coerce')


def _chan(s):
    s = s.fillna('Not tagged').astype(str).str.strip()
    out = pd.Series('Others', index=s.index)
    out[s.str.contains('Contact Center|CSC|Franchise', regex=True)] = 'Contact Center / CSC'
    out[s.str.contains('Website|MZA|Zong|ZEA|Chat', regex=True)] = 'Web / App'
    out[s.str.contains('PTA')] = 'PTA'
    out[s.str.contains('Soci|Facebook', regex=True)] = 'Social media'
    out[s.str.contains('Email')] = 'Email'
    out[s.eq('Not tagged')] = 'Not tagged'
    out[s.str.contains('^CSC|Franchise', regex=True)] = 'CSC / Franchise'
    return out


def _bymonth(df, mcol='m'):
    return [int((df[mcol] == m).sum()) for m in range(1, 11)]


def read(path):
    x = pd.ExcelFile(path)
    d = {s: x.parse(s).dropna(how='all') for s in SHEETS}
    for s, df in d.items():
        df.columns = [str(c).strip() for c in df.columns]
    return d


def build(path=None, sheets=None):
    d = sheets or read(path)
    cpm = d['CPM - NOMC-E2E-REGIONS'].copy()
    crr = d['CRR - NOMC'].copy()
    crs = d['CRS - NOMC'].copy()
    tat = d['L-3 TAT'].copy()
    # E2E tabs are the same tickets as the NOMC tabs (checked on every load)
    check = {'crr_e2e_same': set(d['CRR - E2E & REGIONS']['SN'].astype(str)) == set(crr['SN'].astype(str)),
             'crs_e2e_in_nomc': set(d['CRS - E2E & REGIONS']['SN'].astype(str)) <= set(crs['SN'].astype(str))}

    for df in (cpm, crr, crs):
        df['m'] = pd.to_numeric(df['Month#'], errors='coerce').astype(int)
        df['ts'] = pd.to_datetime(df['ACCEPTTIME'])
        df['team'] = _team(df['Routing Team'])
        df['cat'] = df['Main Tagging'].map(CAT)
        df['city'] = df['City'].astype(str).str.strip().replace({'DG Khan': 'Dera Ghazi Khan'})
    tat['ts'] = pd.to_datetime(tat['ACCEPTTIME'], errors='coerce')
    tat['m'] = tat['ts'].dt.month
    tat['team'] = _team(tat['Team'])
    tat['city'] = tat['City'].astype(str).str.strip().replace({'DG Khan': 'Dera Ghazi Khan', 'nan': np.nan})

    Q = {'months': MON[:10], 'teams': ['C%d' % t for t in TEAMS], 'subs': SUBS, 'check': check}

    # ------------------------------------------------------------------ CPM
    cl = cpm['Site Classification'].where(cpm['Site Classification'].isin(CLASS), 'Other / unknown')
    ch = _chan(cpm['Channel Final'])
    cc = cpm['city'].value_counts()
    hr = [int((cpm.ts.dt.hour == h).sum()) for h in range(24)]
    Q['cpm'] = {
        'total': len(cpm), 'monthly': _bymonth(cpm),
        'cat': {c: _bymonth(cpm[cpm.cat == c]) for c in CATS},
        'team': {'C%d' % t: _bymonth(cpm[cpm.team == t]) for t in TEAMS},
        'sub': [int((cpm['Sub Region'] == s).sum()) for s in SUBS],
        'class': {k: int((cl == k).sum()) for k in CLASS + ['Other / unknown']},
        'channel': {k: int(v) for k, v in ch.value_counts().items()},
        'hvc': int((cpm['HVC (Yes/No)'] == 'Yes').sum()),
        'cities': [[k, int(v)] for k, v in cc.head(10).items()], 'n_cities': int(len(cc)), 'n_sites': int(pd.to_numeric(cpm['Site ID'], errors='coerce').nunique()),
        'hour': hr, 'big': {b: int((cpm['Big Region'] == b).sum()) for b in sorted(cpm['Big Region'].dropna().unique())},
        'sub_cat': {c: [int(((cpm['Sub Region'] == s) & (cpm.cat == c)).sum()) for s in SUBS] for c in CATS},
    }

    # ------------------------------------------------------------------ CRR
    crr['ind'] = crr['CRR Indicator (-/1/0)'].astype(str)
    crr['out'] = np.select([crr.ind == '1', crr.ind == '0'], ['ok', 'late'], 'open')
    cnt = lambda df, o: int((df.out == o).sum())
    rate = lambda df: _pct(cnt(df, 'ok'), cnt(df, 'ok') + cnt(df, 'late'))
    base = crr[crr.out != 'open']
    cg = base.groupby('city').apply(lambda g: pd.Series({'n': len(g), 'crr': rate(g), 'late': cnt(g, 'late')}), include_groups=False)
    low = cg[cg.n >= 30].sort_values('crr').head(8)
    clo = crr['Closure State'].value_counts()
    top_c = list(clo.head(5).index)
    clo2 = {k: int(clo[k]) for k in top_c}
    clo2['Other closures'] = int(clo.iloc[5:].sum())
    Q['crr'] = {
        'total': len(crr), 'ok': cnt(crr, 'ok'), 'late': cnt(crr, 'late'), 'open': cnt(crr, 'open'),
        'rate': rate(crr), 'rate_mar': rate(crr[crr.m >= 3]),
        'monthly': {'ok': [cnt(crr[crr.m == m], 'ok') for m in range(1, 11)], 'late': [cnt(crr[crr.m == m], 'late') for m in range(1, 11)],
                    'open': [cnt(crr[crr.m == m], 'open') for m in range(1, 11)], 'rate': [rate(crr[crr.m == m]) for m in range(1, 11)]},
        'team_rate': [rate(crr[crr.team == t]) for t in TEAMS],
        'team_late': [cnt(crr[crr.team == t], 'late') for t in TEAMS],
        'team_late_m': {'C%d' % t: [cnt(crr[(crr.team == t) & (crr.m == m)], 'late') for m in (1, 2)] for t in TEAMS},
        'heat': [[rate(crr[(crr.team == t) & (crr.m == m)]) for m in range(1, 11)] for t in TEAMS],
        'cat_rate': {c: rate(crr[crr.cat == c]) for c in CATS},
        'low_cities': [[k, _r(v.crr, 2), int(v.late), int(v.n)] for k, v in low.iterrows()],
        'closure': clo2,
        'nsu': int((crr['Desk For CRR/CRS'] == 'NSU').sum()),
        'class_rate': {k: rate(crr[crr['Site Classification'] == k]) for k in CLASS},
    }

    # ------------------------------------------------------------------ CRS
    crs['sat'] = crs['Satisfaction'].astype(str)
    crs['kind'] = np.where(crs['Closure State'] == 'Closed by Customer', 'Closed by customer', np.where(crs['Closure State'] == 'Closed by System', 'Closed by system', 'Other closure'))
    played = crs[crs['IVR Status'] == 'IVR Played']
    resp = lambda df: df[df.sat.isin(['Satisfied', 'Not Satisfied'])]
    crs_rate = lambda df: _pct(int((df.sat == 'Satisfied').sum()), len(resp(df)))
    resp_rate = lambda df: _pct(len(resp(df)), len(df))
    cs = resp(played).groupby('city').apply(lambda g: pd.Series({'n': len(g), 'ns': int((g.sat == 'Not Satisfied').sum())}), include_groups=False)
    cs = cs[cs.ns > 0].sort_values('ns', ascending=False).head(8)
    Q['crs'] = {
        'total': len(crs), 'played': len(played), 'not_played': len(crs) - len(played),
        'resp': len(resp(played)), 'sat': int((played.sat == 'Satisfied').sum()), 'notsat': int((played.sat == 'Not Satisfied').sum()),
        'rate': crs_rate(played), 'resp_rate': resp_rate(played),
        'monthly': {k: [int(((played.m == m) & (played.sat == k)).sum()) for m in range(1, 11)] for k in ['Satisfied', 'Not Satisfied', 'No Response']},
        'not_played_m': [int(((crs.m == m) & (crs['IVR Status'] != 'IVR Played')).sum()) for m in range(1, 11)],
        'rate_m': [crs_rate(played[played.m == m]) for m in range(1, 11)],
        'resp_m': [resp_rate(played[played.m == m]) for m in range(1, 11)],
        'team_rate': [crs_rate(played[played.team == t]) for t in TEAMS],
        'team_resp': [resp_rate(played[played.team == t]) for t in TEAMS],
        'team_notsat': [int(((played.team == t) & (played.sat == 'Not Satisfied')).sum()) for t in TEAMS],
        'cat_rate': {c: crs_rate(played[played.cat == c]) for c in CATS},
        'cat_resp': {c: resp_rate(played[played.cat == c]) for c in CATS},
        'kind': {k: {s: int(((played.kind == k) & (played.sat == s)).sum()) for s in ['Satisfied', 'Not Satisfied', 'No Response']}
                 for k in ['Closed by customer', 'Closed by system', 'Other closure']},
        'notsat_cities': [[k, int(v.ns), int(v.n)] for k, v in cs.iterrows()],
        'heat': [[crs_rate(played[(played.team == t) & (played.m == m)]) if len(resp(played[(played.team == t) & (played.m == m)])) >= 5 else None for m in range(1, 11)] for t in TEAMS],
    }

    # ------------------------------------------------------------------ L-3 TAT
    tat['st'] = np.select([tat['TAT Status'] == 'Within TAT', tat['TAT Status'] == 'TAT Over'], ['ok', 'over'], 'pend')
    tm = sorted(tat.m.dropna().astype(int).unique())
    tn = lambda df, s: int((df.st == s).sum())
    trate = lambda df: _pct(tn(df, 'ok'), tn(df, 'ok') + tn(df, 'over'))
    sv = tat['Service Title'].astype(str).str.replace(' - Web/App', '', regex=False).str.replace(' Complaint', '', regex=False)
    tat['svc'] = sv
    top_sv = list(tat.svc.value_counts().head(6).index)
    ov = tat[tat.st == 'over'].sort_values('ts')
    Q['tat'] = {
        'total': len(tat), 'ok': tn(tat, 'ok'), 'pend': tn(tat, 'pend'), 'over': tn(tat, 'over'), 'rate': trate(tat),
        'months': [MON[m - 1] for m in tm], 'month_no': [int(m) for m in tm],
        'monthly': {s: [tn(tat[tat.m == m], s) for m in tm] for s in ['ok', 'pend', 'over']},
        'rate_m': [trate(tat[tat.m == m]) for m in tm],
        'pend_share_m': [_pct(tn(tat[tat.m == m], 'pend'), len(tat[tat.m == m])) for m in tm],
        'team': {s: [tn(tat[tat.team == t], s) for t in TEAMS] for s in ['ok', 'pend', 'over']},
        'team_rate': [trate(tat[tat.team == t]) for t in TEAMS],
        'svc': {s: {k: tn(tat[tat.svc == s], k) for k in ['ok', 'pend', 'over']} for s in top_sv},
        'over_list': [{'d': r.ts.strftime('%d %b'), 'team': 'C%d' % r.team, 'city': (r.city if isinstance(r.city, str) else 'n/a'), 'svc': r.svc} for r in ov.itertuples()],
        'unmapped': int(tat['Site ID'].isna().sum()),
        'unmapped_months': [MON[m - 1] for m in sorted(tat[tat['Site ID'].isna()].m.dropna().astype(int).unique())],
        'daily': [[x.strftime('%Y-%m-%d'), int(n)] for x, n in tat.groupby(tat.ts.dt.date).size().items()],
        'channel': {k: int(v) for k, v in _chan(tat['Channel']).value_counts().items()},
    }

    # ------------------------------------------------------------------ Critical analysis
    cities = list(cc.index)
    top12 = cities[:12]
    cpm['site'] = pd.to_numeric(cpm['Site ID'], errors='coerce')
    sv_ = cpm['site'].value_counts()
    bins = {'1': (sv_ == 1), '2': (sv_ == 2), '3': (sv_ == 3), '4': (sv_ == 4), '5+': (sv_ >= 5)}
    sm = cpm.groupby('site')['m'].nunique()
    chronic = set(sm[sm >= 3].index)
    top_s = sv_.head(12)
    s_city = cpm.groupby('site')['city'].agg(lambda s: s.mode().iat[0])
    ms = cpm['MSISDN'].dropna().astype(str).str.replace(r'\.0$', '', regex=True).str.replace(r'\D', '', regex=True).str[-10:]
    mv = ms.value_counts()
    callers = {'1': int((mv == 1).sum()), '2': int((mv == 2).sum()), '3': int((mv == 3).sum()), '4+': int((mv >= 4).sum())}
    day = cpm.groupby(cpm.ts.dt.date).size()
    mu, sd = day.mean(), day.std()
    dow = [[int(((cpm.ts.dt.dayofweek == w) & (cpm.ts.dt.hour == h)).sum()) for h in range(24)] for w in range(7)]
    sub_m = [[int(((cpm['Sub Region'] == s) & (cpm.m == m)).sum()) for m in range(1, 11)] for s in SUBS]
    city_m = [[int(((cpm.city == c) & (cpm.m == m)).sum()) for m in range(1, 11)] for c in top12]
    # team scorecard
    sc = []
    for t in TEAMS:
        c = cpm[cpm.team == t]
        sc.append({'team': 'C%d' % t, 'vol': len(c), 'crr': rate(crr[crr.team == t]), 'late': cnt(crr[crr.team == t], 'late'),
                   'crs': crs_rate(played[played.team == t]), 'resp': resp_rate(played[played.team == t]),
                   'tat': trate(tat[tat.team == t]), 'pend': _pct(tn(tat[tat.team == t], 'pend'), len(tat[tat.team == t])),
                   'repeat': _pct(int(c['site'].map(sv_).ge(3).sum()), len(c))})
    # flow: category -> team -> outcome (CRR tab)
    flow = []
    for cname in CATS:
        for t in TEAMS:
            n = int(((crr.cat == cname) & (crr.team == t)).sum())
            if n:
                flow.append(['cat', cname, 'C%d' % t, n])
    for t in TEAMS:
        for o, lab in [('ok', 'Resolved on time'), ('late', 'Resolved late'), ('open', 'Pending / not resolved')]:
            n = int(((crr.team == t) & (crr.out == o)).sum())
            if n:
                flow.append(['out', 'C%d' % t, lab, n])
    cov = {'CPM': [1] * 10, 'CRR': [1] * 10,
           'CRS': [1 if (crs.m == m).any() else 0 for m in range(1, 11)],
           'TAT': [1 if m in tm else 0 for m in range(1, 11)]}
    Q['an'] = {
        'cities_all': [[k, int(v)] for k, v in cc.items()], 'top5_share': _pct(int(cc.head(5).sum()), len(cpm)),
        'site_bins': {k: {'sites': int(v.sum()), 'compl': int(sv_[v].sum())} for k, v in bins.items()},
        'n_sites': int(len(sv_)), 'chronic_sites': len(chronic), 'chronic_compl': int(cpm['site'].isin(chronic).sum()),
        'top_sites': [[int(k), s_city.get(k, ''), int(v)] for k, v in top_s.items()],
        'callers': callers, 'callers_total': int(len(mv)), 'repeat_callers': int((mv >= 2).sum()), 'repeat_compl': int(mv[mv >= 2].sum()), 'msisdn_rows': int(len(ms)),
        'dow_hour': dow, 'daily': [[k.strftime('%Y-%m-%d'), int(v)] for k, v in day.items()], 'daily_mean': _r(mu, 1), 'daily_hi': _r(mu + 2 * sd, 1),
        'sub_month': sub_m, 'top12': top12, 'city_month': city_m,
        'score': sc, 'flow': flow, 'coverage': cov,
        'funnel': [['Tickets closed', len(crs)], ['IVR played', len(played)], ['Customer answered', len(resp(played))], ['Satisfied', int((played.sat == 'Satisfied').sum())]],
        'c1_c6': int(((cpm.team == 1) & (cpm['Sub Region'] == 'Central VI')).sum()),
    }
    return Q


ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6}
_CATS = {'Coverage Related': 'Coverage', 'Internet / Data Speed Related': 'Data speed', 'Call Connectivity/Quality Related': 'Call quality'}


def complaint_sets(d):
    """The CRR / CRS / L-3 TAT tabs reshaped like the CPM complaints (m, geo, fops, cat, site, ts, city, site_class),
    so the existing 'Complaints & Fiber' dashboard maths (metrics.compute) runs on them unchanged.
    Every row of the tab counts as one ticket; nothing is filtered."""
    out = {}
    for name, tab, team_col, tag_col, mcol in [('crr', 'CRR - NOMC', 'Routing Team', 'Main Tagging', 'Month#'),
                                               ('crs', 'CRS - NOMC', 'Routing Team', 'Main Tagging', 'Month#'),
                                               ('tat', 'L-3 TAT', 'Team', 'Main_Tagging', None)]:
        df = d[tab]
        df.columns = [str(c).strip() for c in df.columns]
        ts = pd.to_datetime(df['ACCEPTTIME'], errors='coerce')
        keep = ts.notna()
        df, ts = df[keep], ts[keep]
        c = pd.DataFrame({
            'm': (ts.dt.month if mcol is None else pd.to_numeric(df[mcol], errors='coerce')).astype(int).values,
            'geo': df['Sub Region'].astype(str).str.replace('Central ', '', regex=False).map(ROMAN).values,
            'fops': pd.to_numeric(df[team_col].astype(str).str.extract(r'FOPs C(\d)')[0], errors='coerce').values,
            'cat': df[tag_col].map(_CATS).values,
            'site': pd.to_numeric(df['Site ID'], errors='coerce').values,
            'ts': ts.values,
            'city': df['City'].fillna('').astype(str).str.strip().values,
            'site_class': df['Site Classification'].fillna('').astype(str).str.strip().values,
        })
        out[name] = c
    return out


def set_meta(name, c):
    """Small facts the dashboard shows beside the data-set switch."""
    have = sorted(int(m) for m in c['m'].unique())
    return {'name': name, 'rows': int(len(c)), 'months': [MON[m - 1] for m in have],
            'no_site': int(c['site'].isna().sum()), 'no_team': int(c['fops'].isna().sum())}