from django.core.management.base import BaseCommand
from dashboard import ingest_central, central_snapshot


class Command(BaseCommand):
    help = 'Load Central-RCTO.xlsx (CPM, CRR, CRS and L-3 TAT tabs) and recompute the Central complaint dashboards.'

    def add_arguments(self, p):
        p.add_argument('--file', help='Central-RCTO.xlsx')
        p.add_argument('--recompute', action='store_true', help='skip loading; only recompute the numbers from the database')

    def handle(self, *a, **o):
        if not o['recompute']:
            if not o['file']:
                self.stderr.write('give --file Central-RCTO.xlsx (or use --recompute)'); return
            ingest_central.load_central(o['file'], log=self.stdout.write)
        central_snapshot.refresh()
        self.stdout.write(self.style.SUCCESS('Central complaint dashboards recomputed'))
