from pathlib import Path

from django.core.management.base import BaseCommand

from chat_agent import loader
from chat_agent.db import get_engine


class Command(BaseCommand):
    help = "Load the chatbot's Excel files (chat_agent/data/*.xlsx) into the project database."

    def add_arguments(self, parser):
        parser.add_argument('--data-dir', default=str(Path(__file__).resolve().parents[2] / 'data'),
                            help='folder holding the four .xlsx files (default: chat_agent/data)')

    def handle(self, *args, **opts):
        counts = loader.load_all(get_engine(), opts['data_dir'], log=self.stdout.write)
        get_engine.cache_clear()          # fresh engine; schema cache in views is rebuilt on next question
        from chat_agent import views
        views.SCHEMA_AND_VALUES_CACHE.clear()
        self.stdout.write(self.style.SUCCESS(f'Done: {len(counts)} tables loaded.'))
