from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from grid_report.tools.build_lte_data import build

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "data" / "lte.json"


class Command(BaseCommand):
    help = "Load the 'LTE Traffic Migration Analysis' workbook (.xlsx) into the LTE page."

    def add_arguments(self, parser):
        parser.add_argument("workbook", help="Path to the .xlsx file")
        parser.add_argument("--out", default=str(DEFAULT_OUT))

    def handle(self, *args, **opts):
        src = Path(opts["workbook"])
        if not src.exists():
            raise CommandError(f"File not found: {src}")
        try:
            p = build(src, opts["out"])
        except SystemExit as e:  # the builder stops with a message when the workbook does not add up
            raise CommandError(str(e))
        m = p["meta"]
        self.stdout.write(self.style.SUCCESS(
            f"Loaded {src.name}: {m['sites']} impacted sites, loss {m['loss']:,.0f} GB/day -> {opts['out']}"))
