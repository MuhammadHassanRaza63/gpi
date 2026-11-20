import json
from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_sameorigin
from . import landing, quality
from .models import Snapshot
from .snapshot import KEY


def _json(key):
    snap = Snapshot.objects.filter(key=key).first()
    # '</' is escaped so the JSON can never close the <script> tag it is placed in
    return None if snap is None else json.dumps(snap.payload, ensure_ascii=False).replace('</', '<\\/')


def _sets():
    """Complaints & Fiber computed on CRR / CRS / L-3 TAT tickets: {"crr": {...}, "crs": {...}, "tat": {...}}"""
    parts = [f'"{k}":{j}' for k in ('crr', 'crs', 'tat') for j in [_json(f'{KEY}_{k}')] if j]
    return '{' + ','.join(parts) + '}' if parts else 'null'


@xframe_options_sameorigin   # fullscreen mode opens pages inside the fullscreen page (see _fs.html)
def home(request):
    """The one landing page: RCTO Central and Grid Excellence shown as modules."""
    return render(request, 'site/portal.html', landing.portal())


@xframe_options_sameorigin
def dashboards(request):
    data = _json(KEY)
    if data is None:
        return render(request, 'site/empty.html', status=503)
    return render(request, 'site/dashboards.html', {'data_json': data, 'quality_json': _json(quality.KEY) or 'null', 'sets_json': _sets()})


@xframe_options_sameorigin
def analysis(request):
    """Critical Analysis: separate section, same idea as the Grid 'Analysis lab'."""
    q = _json(quality.KEY)
    if q is None:
        return render(request, 'site/empty.html', status=503)
    return render(request, 'site/analysis.html', {'quality_json': q})


central = dashboards   