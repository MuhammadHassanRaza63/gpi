from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from grid_report.tools.build_report_data import build


class Command(BaseCommand):
    help = "Import monthly Network KPI Report (.xlsb/.xlsx) into grid_report/data/report.json"

    def add_arguments(self, parser):
        parser.add_argument("workbook", type=str, help="Path to .xlsb or .xlsx workbook")

    def handle(self, *args, **options):
        src = Path(options["workbook"])
        if not src.exists():
            raise CommandError(f"File not found: {src}")

        out = Path(settings.BASE_DIR) / "grid_report" / "data" / "report.json"
        payload = build(src, out)
        self.stdout.write(
            self.style.SUCCESS(
                f"OK: {len(payload['grids'])} grids, {len(payload['districts'])} districts, "
                f"period {payload['meta']['now']} -> {out}"
            )
        )