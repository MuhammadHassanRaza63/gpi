"""Read Central-RCTO.xlsx (CPM, CRR, CRS and L-3 TAT tabs) into the CentralCase table.
Nothing is filtered or guessed: every row with a serial number is stored as it appears in the file.

Tabs that are NOT loaded, on purpose (checked against the file):
  'CRR - NOMC'        - same serial numbers and same CRR Indicator as 'CRR - E2E & REGIONS'
  'CRS - E2E & REGIONS' - exactly the Apr-Oct rows of 'CRS - NOMC' (which also has Jan-Mar)
"""
import datetime as dt
import re
import openpyxl

TABS = {'CPM': 'CPM - NOMC-E2E-REGIONS', 'CRR': 'CRR - E2E & REGIONS', 'CRS': 'CRS - NOMC', 'TAT': 'L-3 TAT'}

# model field -> column header in each tab (headers are compared after strip())
_COMMON = {'accept': 'ACCEPTTIME', 'city': 'City', 'sub': 'Sub Region', 'big': 'Big Region',
           'site': 'Site ID', 'klass': 'Site Classification'}
COLS = {
    'CPM': {**_COMMON, 'sn': 'SN', 'service': 'ServiceTitle', 'tagging': 'Main Tagging', 'hvc': 'HVC (Yes/No)',
            'channel': 'Channel Final', 'team': 'Routing Team', 'resolution': 'Resolution Status',
            'closure': 'Closure State', 'fix': 'Last Type'},
    'CRR': {**_COMMON, 'sn': 'SN', 'service': 'ServiceTitle', 'tagging': 'Main Tagging', 'hvc': 'HVC (Yes/No)',
            'channel': 'Channel Final', 'team': 'Routing Team', 'resolution': 'Resolution Status',
            'closure': 'Closure State', 'fix': 'Last Type', 'flag': 'CRR Indicator (-/1/0)'},
    'CRS': {**_COMMON, 'sn': 'SN', 'service': 'ServiceTitle', 'tagging': 'Main Tagging', 'hvc': 'HVC (Yes/No)',
            'channel': 'Channel Final', 'team': 'Routing Team', 'resolution': 'Resolution Status',
            'closure': 'Closure State', 'sat': 'Satisfaction'},
    'TAT': {**_COMMON, 'sn': 'SerialNO', 'service': 'Service Title', 'tagging': 'Main_Tagging', 'hvc': 'is HVC',
            'channel': 'Channel', 'team': 'Team', 'tat': 'TAT Status', 'hand': 'HANDLINGID',
            'state': 'COMPLAINTSTATE', 'arpu': 'ARPU Level'},
}
REQUIRED = {'CPM': ['sn', 'accept', 'team', 'tagging'], 'CRR': ['sn', 'accept', 'team', 'tagging', 'flag'],
            'CRS': ['sn', 'accept', 'team', 'tagging', 'sat'], 'TAT': ['sn', 'accept', 'team', 'tagging', 'tat']}


def _s(v):
    return '' if v is None else str(v).strip()


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _when(v):
    if isinstance(v, dt.datetime):
        return v
    s = _s(v)
    for f in ('%Y/%m/%d %H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y/%m/%d %H:%M', '%Y-%m-%d %H:%M'):
        try:
            return dt.datetime.strptime(s, f)
        except ValueError:
            pass
    raise ValueError(f'unreadable ACCEPTTIME: {s!r}')


def _team(v):
    m = re.search(r'C\s*(\d)', _s(v))
    return int(m.group(1)) if m else None


def _flag(v):
    s = _s(v)
    return 1 if s in ('1', '1.0') else 0 if s in ('0', '0.0') else None


def parse_sheet(ws, ds):
    """Yield one dict of CentralCase fields per complaint row of the tab."""
    it = ws.iter_rows(values_only=True)
    header = next(it)
    h = {}
    for i, x in enumerate(header):
        h.setdefault(_s(x), i)
    cols = COLS[ds]
    missing = [cols[k] for k in REQUIRED[ds] if cols[k] not in h]
    if missing:
        raise ValueError(f'tab {TABS[ds]!r} is missing columns: {missing}')
    ix = {k: h.get(c) for k, c in cols.items()}

    def get(row, k):
        i = ix.get(k)
        return row[i] if i is not None and i < len(row) else None

    blanks = 0
    for row in it:
        sn = _s(get(row, 'sn'))
        if not sn:
            blanks += 1
            if blanks > 2000:            # the tabs carry long runs of empty trailing rows
                break
            continue
        blanks = 0
        ts = _when(get(row, 'accept'))
        site = _num(get(row, 'site'))
        hand = _s(get(row, 'hand'))
        yield dict(
            sn=sn, accept_time=ts, month=ts.month, service_title=_s(get(row, 'service')),
            main_tagging=_s(get(row, 'tagging')), city=_s(get(row, 'city')), sub_region=_s(get(row, 'sub')),
            big_region=_s(get(row, 'big')), site_id=int(site) if site is not None else None,
            site_class=_s(get(row, 'klass')), team=_team(get(row, 'team')),
            hvc=_s(get(row, 'hvc')).lower() == 'yes', channel=_s(get(row, 'channel')),
            resolution=_s(get(row, 'resolution')), closure=_s(get(row, 'closure')), fix_type=_s(get(row, 'fix')),
            crr_flag=_flag(get(row, 'flag')) if ds == 'CRR' else None,
            satisfaction=_s(get(row, 'sat')), tat_status=_s(get(row, 'tat')),
            handovers=hand.count('->') if hand else None,
            reopened='Re-Opened' in _s(get(row, 'state')), arpu=_s(get(row, 'arpu')))


def load_central(path, log=None):
    """Replace the stored rows of all four datasets with the contents of the workbook. Returns {dataset: rows}."""
    from django.db import transaction
    from .models import CentralCase
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    gone = [t for t in TABS.values() if t not in wb.sheetnames]
    if gone:
        raise ValueError(f'tabs not found in the workbook: {gone}')
    out = {}
    with transaction.atomic():
        for ds, tab in TABS.items():
            CentralCase.objects.filter(dataset=ds).delete()
            batch, n = [], 0
            for r in parse_sheet(wb[tab], ds):
                batch.append(CentralCase(dataset=ds, **r))
                if len(batch) >= 2000:
                    CentralCase.objects.bulk_create(batch); n += len(batch); batch = []
            CentralCase.objects.bulk_create(batch); n += len(batch)
            out[ds] = n
            if log:
                log(f'{ds:<4} {tab}: {n} rows')
    return out
