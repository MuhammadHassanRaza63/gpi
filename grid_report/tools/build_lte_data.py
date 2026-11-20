"""Build data/lte.json from the "LTE Traffic Migration Analysis" workbook (sheets: Summary, Terrain_Summary, Neighbor_Detail, Assumptions).

Every number on the LTE page comes from this workbook. The script re-computes the totals and stops with a clear
message if the workbook does not add up (so the page can never show numbers that disagree with the file).

Usage (folder that holds manage.py):
    python manage.py import_lte "LTE_Traffic_Migration_Analysis.xlsx"
"""
import json
import sys
from pathlib import Path

import openpyxl

SUMMARY_COLS = ["site", "region", "grid", "terrain", "r_init", "r_ext", "q1", "now", "loss", "n_init", "up_init", "abs_init",
                "n_ext", "up_ext", "abs_ext", "assess", "loss_m", "up_m"]
TERRAINS = ["Dense urban", "Urban", "Sub urban", "Rural", "Highway", "Rural (blank terrain)"]


def num(v):
    return float(v) if isinstance(v, (int, float)) else 0.0


def build(src, out):
    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    for n in ("Summary", "Terrain_Summary", "Neighbor_Detail", "Assumptions"):
        if n not in wb.sheetnames:
            sys.exit(f"Sheet '{n}' not found. Sheets: {wb.sheetnames}")
    S = list(wb["Summary"].iter_rows(values_only=True))
    head = [str(h) for h in S[0]]
    want = ["Impacted Site", "Sub-Region", "Grid", "Terrain", "Initial Radius (km)", "Extended Radius (km)", "Q1 Baseline (GB/day)"]
    if head[:7] != want or "Assessment" not in head[15]:
        sys.exit(f"Summary layout changed: {head}")
    sites, total = [], None
    for r in S[1:]:
        if r[0] == "TOTAL":
            total = r
        elif r[0] is not None:
            sites.append(dict(zip(SUMMARY_COLS, [int(r[0])] + list(r[1:18]))))
    if total is None:
        sys.exit("Summary has no TOTAL row")

    # ---- accuracy checks against the workbook's own TOTAL row and Terrain_Summary sheet
    def chk(label, a, b, tol=0.05):
        if abs(a - b) > tol:
            sys.exit(f"CHECK FAILED - {label}: rows add up to {a:,.2f} but the workbook says {b:,.2f}")
    chk("Q1 baseline", sum(s["q1"] for s in sites), num(total[6]))
    chk("Oct-26 traffic", sum(s["now"] for s in sites), num(total[7]))
    chk("Traffic loss", sum(s["loss"] for s in sites), num(total[8]))
    chk("Initial uplift", sum(s["up_init"] for s in sites), num(total[10]))
    chk("Extended uplift", sum(s["up_ext"] for s in sites), num(total[13]))
    chk("Monthly loss", sum(s["loss_m"] for s in sites), num(total[16]), 1)
    T = list(wb["Terrain_Summary"].iter_rows(values_only=True))
    terrain = []
    for r in T[1:]:
        if r[0] in (None, "TOTAL"):
            continue
        mine = [s for s in sites if s["terrain"] == r[0]]
        chk(f"{r[0]} site count", len(mine), num(r[1]), 0)
        chk(f"{r[0]} loss", sum(s["loss"] for s in mine), num(r[2]))
        chk(f"{r[0]} extended uplift", sum(s["up_ext"] for s in mine), num(r[4]))
        loss = sum(s["loss"] for s in mine)
        terrain.append(dict(terrain=r[0], sites=len(mine), loss=loss, up_init=sum(s["up_init"] for s in mine),
                            up_ext=sum(s["up_ext"] for s in mine)))
    chk("Total impacted sites", len(sites), num(T[-1][1]), 0)

    # assessment must follow the workbook's thresholds (Assumptions sheet)
    A = {str(r[0]): r for r in wb["Assumptions"].iter_rows(values_only=True) if r and r[0]}
    days = int(A["Days in Oct-26 (for monthly equivalent)"][1])
    hi = float(A["High Observed Uplift threshold (>=)"][1])
    mod = float(A["Moderate Observed Uplift threshold (>=)"][1])
    for s in sites:
        exp = "High Observed Uplift" if s["abs_ext"] >= hi else "Moderate Observed Uplift" if s["abs_ext"] >= mod else \
              "Low Observed Uplift" if s["up_ext"] > 0 else "No Observed Uplift"
        if exp != s["assess"]:
            sys.exit(f"CHECK FAILED - site {s['site']} assessment is '{s['assess']}' but thresholds give '{exp}'")
        chk(f"site {s['site']} monthly loss", s["loss"] * days, s["loss_m"], 0.5)

    # neighbour detail: allocated uplift must add back to each impacted site's uplift (Initial and Extended)
    N = list(wb["Neighbor_Detail"].iter_rows(values_only=True))
    nd = [r for r in N[1:] if r[0] is not None]
    by = {}
    for r in nd:
        by.setdefault(int(r[0]), []).append(r)
    for s in sites:
        rows = by.get(s["site"], [])
        ini = sum(num(r[11]) for r in rows if r[6] == "Initial")
        ext = sum(num(r[11]) for r in rows)
        chk(f"site {s['site']} initial uplift", ini, s["up_init"], 0.1)
        chk(f"site {s['site']} extended uplift", ext, s["up_ext"], 0.1)
    neighbours = {str(k): [[int(r[2]), r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[11]] for r in sorted(v, key=lambda x: -num(x[11]))[:12]]
                  for k, v in by.items()}

    # tallies
    assess = {}
    for s in sites:
        assess[s["assess"]] = assess.get(s["assess"], 0) + 1
    grids = {}
    for s in sites:
        g = grids.setdefault(s["grid"], dict(grid=s["grid"], region=s["region"], sites=0, loss=0.0, up_ext=0.0))
        g["sites"] += 1; g["loss"] += s["loss"]; g["up_ext"] += s["up_ext"]
    payload = dict(
        meta=dict(source=Path(str(src)).name, days=days, hi=hi, mod=mod, sites=len(sites),
                  loss=sum(s["loss"] for s in sites), q1=sum(s["q1"] for s in sites), now=sum(s["now"] for s in sites),
                  up_init=sum(s["up_init"] for s in sites), up_ext=sum(s["up_ext"] for s in sites),
                  loss_m=sum(s["loss_m"] for s in sites), up_m=sum(s["up_m"] for s in sites)),
        sites=sites, terrain=terrain, assess=assess, grids=sorted(grids.values(), key=lambda g: g["grid"]), neighbours=neighbours,
        notes=[str(r[0]) for r in wb["Assumptions"].iter_rows(values_only=True) if r and r[0] and str(r[0])[:2] in ("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.")])
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, default=str, separators=(",", ":"))
    return payload


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    p = build(sys.argv[1], sys.argv[2])
    print(f"OK: {p['meta']['sites']} impacted sites, loss {p['meta']['loss']:,.0f} GB/day, extended uplift {p['meta']['up_ext']:,.0f} GB/day")
