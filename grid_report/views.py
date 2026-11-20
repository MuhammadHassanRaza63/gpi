import json
from pathlib import Path

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_sameorigin

DATA_FILE = Path(__file__).resolve().parent / "data" / "report.json"
_cache = {"mtime": None, "data": None}


def _load():
    """Read report.json, reloading only when the file changes."""
    mtime = DATA_FILE.stat().st_mtime
    if _cache["mtime"] != mtime:
        with DATA_FILE.open(encoding="utf-8") as fh:
            _cache["data"] = json.load(fh)
        _cache["mtime"] = mtime
    return _cache["data"]


@xframe_options_sameorigin
def dashboard(request):
    """One-page dashboard: report + analysis combined."""
    return render(request, "grid_report/dashboard.html", {"report_data": _load()})


@xframe_options_sameorigin
def report(request):
    return render(request, "grid_report/report.html", {"report_data": _load()})


LTE_FILE = Path(__file__).resolve().parent / "data" / "lte.json"
_lte_cache = {"mtime": None, "data": None}


def _load_lte():
    mtime = LTE_FILE.stat().st_mtime
    if _lte_cache["mtime"] != mtime:
        with LTE_FILE.open(encoding="utf-8") as fh:
            _lte_cache["data"] = json.load(fh)
        _lte_cache["mtime"] = mtime
    return _lte_cache["data"]


@xframe_options_sameorigin
def lte(request):
    """LTE traffic migration: data-loss sites and how much traffic neighbouring sites absorbed."""
    return render(request, "grid_report/lte.html", {"lte_data": _load_lte(), "report_data": _load()})


@xframe_options_sameorigin
def production_dashboard(request):
    """Executive production telemetry dashboard bound to live report.json and lte.json."""
    return render(
        request,
        "grid_report/production_dashboard.html",
        {"report_data": _load(), "lte_data": _load_lte()},
    )


def lte_json(request):
    return JsonResponse(_load_lte())


def report_json(request):
    return JsonResponse(_load())


@xframe_options_sameorigin
def analysis(request):
    """Cross-metric analysis dashboard (correlations, pair analysis, site classes, 3D)."""
    return render(request, "grid_report/analysis.html", {"report_data": _load()})



