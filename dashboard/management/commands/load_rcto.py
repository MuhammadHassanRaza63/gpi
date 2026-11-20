from django.conf import settings
from django.core.management.base import BaseCommand
from dashboard import ingest, metrics, quality, snapshot
from dashboard.models import Snapshot


class Command(BaseCommand):
    help = 'Load Central-RCTO.xlsx (CPM, CRR, CRS, L-3 TAT) and recompute every RCTO Central dashboard.'

    def add_arguments(self, p):
        p.add_argument('path', nargs='?', default='chat_agent/data/Central-RCTO.xlsx', help='Central-RCTO.xlsx (6 tabs)')

    def handle(self, *a, **o):
        path = o['path']
        n = ingest.load_complaints(path)                       # tab 'CPM - NOMC-E2E-REGIONS' -> Complaint table
        self.stdout.write(f'CPM complaints : {n} rows')
        try:
            snapshot.refresh()                                  # Complaints & Fiber, FOPs, Network, Scorecard (CPM data)
            self.stdout.write('classic dashboards recomputed (CPM data)')
        except Exception as e:                                  # OFC / availability tables not loaded yet
            self.stdout.write(self.style.WARNING(f'classic dashboards not recomputed: {e}'))
        sheets = quality.read(path)
        Q = quality.build(path, sheets)                         # CRR + CRS + L-3 TAT tabs + critical analysis
        Snapshot.objects.update_or_create(key=quality.KEY, defaults={'payload': Q})
        self.stdout.write(f"CRR {Q['crr']['rate']}% · CRS {Q['crs']['rate']}% · TAT {Q['tat']['rate']}% · checks {Q['check']}")
        # the same 'Complaints & Fiber' dashboard, once per data set (CRR / CRS / TAT tickets instead of CPM complaints)
        try:
            sites, o26, o25 = snapshot._sites(), snapshot._ofc(2026), snapshot._ofc(2025)
            for name, c in quality.complaint_sets(sheets).items():
                P = metrics.compute(c, sites, o26, o25, settings.CUTS_TARGET, settings.CUTS_TARGET_SOURCE)
                P['dataset'] = quality.set_meta(name, c)
                Snapshot.objects.update_or_create(key=f'dashboard_{name}', defaults={'payload': P})
                self.stdout.write(f"Complaints & Fiber on {name.upper()} data : {len(c)} tickets")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'CRR / CRS / TAT versions of Complaints & Fiber not built: {e}'))
        self.stdout.write(self.style.SUCCESS('RCTO dashboards + Critical Analysis ready'))