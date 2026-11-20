"""Build data/report.json from the monthly "Network KPI Report - Grid Excellence" workbook.

Every number on the dashboard comes from this workbook - nothing is hard coded or generated.

Usage (from the folder that holds manage.py):
    python grid_report/tools/build_report_data.py "Network_KPI_Report.xlsb" grid_report/data/report.json
    python grid_report/tools/build_report_data.py "Network_KPI_Report.xlsx" grid_report/data/report.json

or simply:
    python manage.py import_workbook "Network_KPI_Report.xlsb"

.xlsb is read directly (pyxlsb); .xlsx is read with openpyxl. Needs: pandas, openpyxl, pyxlsb.

The script checks the header of every column it reads. If the workbook layout changes in a future
month it stops with a clear message instead of silently showing wrong numbers.
"""
import datetime as dt
import json
import math
import sys
from pathlib import Path

import pandas as pd
from openpyxl.utils import column_index_from_string as ci
from openpyxl.utils import get_column_letter as L


# --------------------------------------------------------------------------- reading
class Book:
    """Uniform access to .xlsx / .xlsb sheets as lists of row tuples (cached cell values)."""

    def __init__(self, path):
        self.path = str(path)
        self.cache = {}
        self.xlsb = self.path.lower().endswith(".xlsb")
        if self.xlsb:
            from pyxlsb import open_workbook
            self.wb = open_workbook(self.path)
        else:
            import openpyxl
            self.wb = openpyxl.load_workbook(self.path, read_only=True, data_only=True)

    def resolve(self, *names):
        """Find a sheet by any of the given names (case/space-insensitive, prefix match as fallback)."""
        have = list(self.wb.sheets) if self.xlsb else list(self.wb.sheetnames)
        norm = lambda s: "".join(str(s).lower().split())
        for n in names:
            for h in have:
                if norm(h) == norm(n):
                    return h
        for n in names:
            for h in have:
                if norm(h).startswith(norm(n)):
                    return h
        sys.exit(f"Sheet not found: {names}. Sheets in this workbook: {have}")

    def rows(self, name):
        if name not in self.cache:
            if self.xlsb:
                with self.wb.get_sheet(name) as sh:
                    out = []
                    for r in sh.rows():
                        out.append(tuple(c.v for c in r))
            else:
                out = list(self.wb[name].iter_rows(values_only=True))
            self.cache[name] = out
        return self.cache[name]

    def frame(self, name):
        r = self.rows(name)
        hdr = [str(h).strip() if h is not None else "" for h in r[0]]
        return pd.DataFrame([list(x) + [None] * (len(hdr) - len(x)) for x in r[1:]], columns=hdr)


def clean(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, str) and v.startswith("#"):  # Excel error such as #NAME?
        return None
    return v


def to_date(v):
    """Header cell -> date (handles real dates and Excel serial numbers from .xlsb)."""
    if isinstance(v, dt.datetime):
        return v
    if isinstance(v, (int, float)) and 30000 < v < 80000:
        return dt.datetime(1899, 12, 30) + dt.timedelta(days=float(v))
    return None


def to_month(v):
    d = to_date(v)
    return d.month if d else None


MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def build(src, out):
    bk = Book(src)
    rows = bk.rows(bk.resolve("Grid Performance Dash", "Grid Performance"))

    def g(r, c):
        i = ci(c) - 1
        return clean(r[i]) if i < len(r) else None

    def hdr(c):
        i = ci(c) - 1
        return " ".join(str(rows[k][i]) for k in (1, 2) if i < len(rows[k]) and rows[k][i] is not None).lower()

    # field -> (column letter, text that must appear in the header above that column)
    F = {
        "name": ("B", ""), "rank": ("C", "ranking"), "score": ("D", "score"), "sites": ("E", "total sites"),
        "plat": ("F", "platinum"), "pgs": ("G", "pgs"), "sb": ("H", "sb"), "rollout": ("L", "rollout"),
        "liion": ("M", "li-ion"), "dgops": ("N", "dg ops"),
        "avl": ("O", "avl"), "avl_p": ("P", "platinum"), "avl_g": ("Q", "pgs"), "avl_s": ("R", "sb"), "avl_dg": ("S", "dg"),
        "chronic": ("T", "chronic"), "avl_ytd": ("U", "ytd"),
        "ls": ("AA", "ls mtd"), "ls_ytd": ("AB", "ls ytd-26"), "ls_py": ("AC", "ls ytd-25"), "ls_yoy": ("AD", "yoy ls"),
        "voice": ("AF", "voice mtd"), "voice_ytd": ("AG", "voice ytd-26"), "voice_py": ("AH", "voice ytd-25"), "voice_yoy": ("AI", "yoy voice"),
        "voice_loss": ("AK", "voice loss"),
        "data": ("AL", "data mtd"), "data_ytd": ("AM", "data ytd-26"), "data_py": ("AN", "data ytd-25"), "data_yoy": ("AO", "yoy data"),
        "data_loss": ("AQ", "data loss"),
        "rev": ("AR", "rev"), "rev_ytd": ("AS", "rev ytd-26"), "rev_py": ("AT", "ytd-25"), "yoy": ("AU", "yoy rev"), "rev_loss": ("AW", "revenue loss"),
        "fuel": ("AX", "fuel mtd"), "fuel_ytd": ("AY", "fuel ytd"), "underu": ("AZ", "underutil"),
        "highfuel": ("BA", "high fuel"), "notop": ("BB", "not operational"),
        "units": ("BC", "units mtd"), "units_ytd": ("BD", "units ytd"), "units_py": ("BE", "units ytd-25"), "units_yoy": ("BF", "yoy units"),
        "chron_exc": ("BG", "chronic excessive"),
        "k_phase": ("BH", "2 phase"), "k_fluct": ("BI", "fluctuation"), "k_down": ("BJ", "down cells"),
        "k_zero": ("BK", "zero traffic"), "k_compl": ("BL", "complaints"), "k_vswr": ("BM", "vswr"),
        "k_temp": ("BN", "temp"), "k_tprime": ("BO", "t prime"), "k_link": ("BP", "hi cap link"),
        "k_rsl": ("BQ", "rsl"), "k_crit": ("BR", "critical alarm"),
        "s_plat": ("CB", "plat"), "s_pgs": ("CE", "pgs"), "s_sb": ("CH", "sb"), "s_dg": ("CK", "dg"),
        "s_avl": ("CN", "avl score"), "s_fuel": ("CO", "fuel score"), "s_underu": ("CP", "underu"),
        "s_units": ("CQ", "units score"), "s_phase": ("CR", "phase missing"), "s_fluct": ("CS", "fluctuation"),
        "s_down": ("CT", "down cells"), "s_zero": ("CU", "zero traffic"), "s_compl": ("CV", "complaints"),
        "s_vswr": ("CW", "vswr"), "s_temp": ("CX", "high temp"), "s_link": ("CY", "hi cap link"),
        "s_rsl": ("CZ", "rsl"), "s_crit": ("DA", "critical alarm"), "s_basics": ("DB", "3 basics"),
    }
    bad = [f"{k}: column {c} reads '{hdr(c).strip()}' (expected '{want}')" for k, (c, want) in F.items() if want and want not in hdr(c)]
    if bad:
        sys.exit("The 'Grid Performance Dash' layout differs from what this script expects:\n  " + "\n  ".join(bad)
                 + "\nUpdate the column letters in build_report_data.py (dict F) and run again.")

    # trend blocks are located by their title in row 2 and the month dates in row 3
    def trend(title):
        start = next((i for i, v in enumerate(rows[1]) if isinstance(v, str) and v.strip().lower() == title), None)
        if start is None:
            sys.exit(f"Trend block '{title}' not found in Grid Performance row 2")
        end = start
        while end + 1 < len(rows[2]) and to_month(rows[2][end + 1]) is not None and to_month(rows[2][end + 1]) > to_month(rows[2][end]):
            end += 1
        return start, end

    blocks = {"t_avl": "avail% trend", "t_ls": "ls trend", "t_voice": "voice trend", "t_data": "data trend", "t_rev": "revenue trend"}
    pos = {}
    for k, title in blocks.items():
        s, e = trend(title)
        pos[k] = (s, e)
    n_months = max(e - s + 1 for s, e in pos.values())
    first_cell = rows[2][min(s for s, _ in pos.values())]
    first_month, year = to_month(first_cell), to_date(first_cell).year
    months = MON[first_month - 1:first_month - 1 + n_months]

    def rec(r):
        d = {k: g(r, c) for k, (c, _) in F.items()}
        for k, (s, e) in pos.items():
            vals = [clean(r[i]) if i < len(r) else None for i in range(s, e + 1)]
            vals += [None] * (n_months - len(vals))
            d[k] = vals
        return d

    region_rows = [rec(rows[i]) for i in range(5, 12)]
    gstart = next(i for i, r in enumerate(rows) if i > 11 and r[1] and str(r[1]).startswith("C") and str(r[1])[1:].isdigit())
    gend = gstart
    while gend < len(rows) and rows[gend][1] and str(rows[gend][1])[1:].isdigit():
        gend += 1
    grids = [rec(rows[i]) for i in range(gstart, gend)]
    for d in grids:
        d["region"] = "Central-" + d["name"][1]
    dstart = gend + 1
    districts = []
    for i in range(dstart, len(rows)):
        if rows[i][1] and rows[i][4] is not None:
            districts.append({"name": rows[i][1], "sites": rows[i][4]})

    # targets / thresholds printed in row 5 of the sheet (fuel, underutilised DGs, units) - the dashboards draw their target lines from these
    targets = dict(fuel=g(rows[4], "AX"), underu=g(rows[4], "AZ"), units=g(rows[4], "BD"),
                   avl_p=g(rows[4], "P"), avl_g=g(rows[4], "Q"), avl_s=g(rows[4], "R"), avl_dg=g(rows[4], "S"))

    # Executive summary (period labels come from the sheet itself)
    ex = bk.rows(bk.resolve("Executive Summ", "Ex Summ"))
    title = str(ex[0][0] or "")
    hdr_ex = [str(x or "") for x in ex[2]]
    assert "score" in hdr_ex[3].lower() and "score" in hdr_ex[5].lower() and hdr_ex[6].strip().lower() == "rank", hdr_ex
    last_lbl = hdr_ex[3].split()[0]   # e.g. "Sep"
    now_lbl = hdr_ex[5].split()[0]    # e.g. "Oct"
    summ = []
    for r in ex[3:]:
        if not (isinstance(r[0], str) and r[0].strip().startswith("Central")):
            continue
        summ.append(dict(region=r[0], last=r[3], now=r[5], rank=r[6], grids=r[7], improved=r[8] or 0,
                         sustained=r[9] or 0, declined=r[10] or 0, low=r[11] or 0, remark=r[12],
                         m1=r[1], m2=r[2], q=r[4]))
    summ_hdr = dict(m1=hdr_ex[1].split()[0], m2=hdr_ex[2].split()[0], q=hdr_ex[4].split()[0])

    gs = bk.rows(bk.resolve("Grid Scoring pre vs post", "Grid Scoring"))
    gsh = [str(x or "") for x in gs[2]]
    assert gsh[3].strip() == "Grid" and "now score bins" in gsh[1].lower() and gsh[8].lower().startswith(now_lbl.lower()), gsh
    status = {}
    for r in gs[3:]:
        if r[3] and str(r[3])[0] == "C" and str(r[3])[1:].isdigit():
            status[r[3]] = dict(last=r[6], now=r[8], move=r[9], bin=r[1])
    for d in grids:
        s = status[d["name"]]
        d["last"], d["move"], d["bin"] = s["last"], s["move"], s["bin"]
        assert abs(s["now"] - d["score"]) < 1e-6, (d["name"], s["now"], d["score"])

    # Tracker (one row per site) -> classification mix, cities, worst sites per grid
    tr_rows = bk.rows(bk.resolve("Tracker"))
    th = [str(h).strip() if h is not None else "" for h in tr_rows[3]]
    ncol = len(th)
    tr = pd.DataFrame([list(x) + [None] * (ncol - len(x)) for x in tr_rows[4:] if x and x[0] is not None and x[1] is not None], columns=th)
    chronic_i = next(i for i, h in enumerate(th) if h.startswith("Chronic Below Base"))
    now_avl_col = tr.iloc[:, chronic_i - 1]  # current-month site availability sits just before this column
    tr["now_avl"] = pd.to_numeric(now_avl_col, errors="coerce")
    tr["Chronic"] = tr.iloc[:, chronic_i]
    cls_order = ["Platinum +", "Platinum", "Gold", "Silver", "Bronze", "Strategic", "LRS"]
    tr["Classification"] = tr["Classification"].replace({"P+": "Platinum +", "Platinum+": "Platinum +"})  # workbook writes "P+"; dashboards use "Platinum +"
    unknown = set(tr["Classification"].dropna().unique()) - set(cls_order)
    if unknown:
        sys.exit(f"Tracker has site classes this script does not know: {unknown}")
    tg = {}
    for gname, df in tr.groupby("Grid"):
        mix = {c: int((df["Classification"] == c).sum()) for c in cls_order}
        low = df.nsmallest(5, "now_avl")[["Site", "Classification", "City", "now_avl"]]
        tg[gname] = dict(
            mix=mix, cities=df["City"].value_counts().head(3).to_dict(),
            worst=[dict(site=int(a), cls=b, city=c, avl=round(float(v), 2)) for a, b, c, v in low.itertuples(index=False) if pd.notna(v)],
            below98=int((df["now_avl"] < 98).sum()), chronic=int(df["Chronic"].notna().sum()))
    for d in grids:
        d["trk"] = tg.get(d["name"], {})

    # Issue lists behind the "3 basics + MW" KPIs
    items = {}

    def isna(x):
        return x is None or (isinstance(x, float) and pd.isna(x))

    def add(grid, kind, site, status_, note):
        if isna(grid):
            return
        s = "" if isna(status_) else str(status_).strip()
        n = None if isna(note) else str(note).strip()[:110]
        if isinstance(site, float) and not pd.isna(site) and site == int(site):
            site = int(site)  # .xlsb returns whole numbers as floats
        items.setdefault(grid, []).append(dict(kind=kind, site=None if isna(site) else str(site), status=s or "Pending", note=n or None))

    def col(df, *names):
        for n in names:
            if n in df.columns:
                return n
        sys.exit(f"None of the columns {names} found; sheet columns: {list(df.columns)[:30]}")

    def feed(sheet, kind, site, stat, note, extra=None):
        df = bk.frame(bk.resolve(sheet))
        site_c, stat_c = col(df, *site), col(df, *stat)
        note_c = col(df, *note) if note else None
        for _, r in df.iterrows():
            if isna(r["Grid"]) or isna(r[site_c]):
                continue
            n = extra(r) if extra else r[note_c]
            add(r["Grid"], kind, r[site_c], r[stat_c], n)

    feed("Not Operational DGs", "Not operational DG", ["DG CURRENT SITE"], ["Current Status"], ["Remarks Category"])
    feed("2 Phase Missing", "2-phase missing", ["Site Name"], ["Status"], ["Action Plan"])
    feed("Fluctuated Sites", "High fluctuation", ["Site"], ["Current Status", "Status"], None,
         extra=lambda r: f"{r.get('Wk44 Sum of Fluct (25x)')} fluctuations (25x) in latest week, {r.get('>10 Days')} days >10" if not isna(r.get("Wk44 Sum of Fluct (25x)")) else None)
    feed("Down Cells", "Down cell", ["Site ID"], ["Status"], ["Fault Type"])
    feed("Zero Traffic", "Zero traffic", ["SID"], ["Status"], None,
         extra=lambda r: f"{r.get('Zero Traffic cell')} ({r.get('Technology')})" if not isna(r.get("Zero Traffic cell")) else None)
    feed("VSWR", "VSWR", ["Site"], ["Status"], ["Alarm title"])
    feed("High TempAlm", "High temperature", ["Site"], ["Status"], ["Alarm title"])
    feed("T Prime", "T-Prime", ["Site ID"], ["Status", "Current Status"], ["T-Prime Category"])
    feed("RSL Deviation Link", "RSL deviation", ["Site IDs"], ["Status"], ["RCA Detail"])
    feed("TXN Critical Alarms", "Critical alarm", ["Sites"], ["Resolved Status"], ["Name"])
    eb = bk.frame(bk.resolve("E-Band Availability"))
    for _, r in eb.iterrows():
        v = pd.to_numeric(r["Link Availability"], errors="coerce")
        if pd.notna(v) and v < 0.99:
            add(r["Grid"], "Hi-cap link <99%", r["Sites"], "Pending", r["Link Name"])
    for d in grids:
        d["items"] = items.get(d["name"], [])

    assert [x["region"] for x in summ] == [x["name"] for x in region_rows], "Executive Summ regions do not match Grid Performance regions"
    meta = dict(title=title, last=last_lbl, now=now_lbl, period=f"{now_lbl}-{year % 100:02d}",
                source=Path(str(src)).name, generated=dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
                months_n=n_months, rev_months=pos["t_rev"][1] - pos["t_rev"][0] + 1, targets=targets, summary_cols=summ_hdr)
    payload = dict(regions=region_rows, grids=grids, summary=summ, districts=districts, months=months, meta=meta)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, default=str, separators=(",", ":"))
    return payload


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    p = build(sys.argv[1], sys.argv[2])
    print(f"OK: {len(p['grids'])} grids, {len(p['districts'])} districts, months {p['months']}, period {p['meta']['now']}")
