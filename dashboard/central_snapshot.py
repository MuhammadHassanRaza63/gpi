"""Build the Central complaint numbers from the database and store them as a Snapshot (key 'central')."""
import pandas as pd
from . import central_metrics
from .models import CentralCase, Snapshot

KEY = 'central'
FIELDS = ['dataset', 'sn', 'accept_time', 'month', 'service_title', 'main_tagging', 'city', 'sub_region', 'big_region',
          'site_class', 'team', 'hvc', 'channel', 'resolution', 'closure', 'fix_type', 'crr_flag', 'satisfaction',
          'tat_status', 'handovers', 'reopened', 'arpu']


def compute_payload():
    df = pd.DataFrame.from_records(CentralCase.objects.values(*FIELDS))
    if df.empty:
        raise ValueError('no rows loaded - run: python manage.py load_central --file Central-RCTO.xlsx')
    return central_metrics.compute(df)


def refresh():
    payload = compute_payload()
    Snapshot.objects.update_or_create(key=KEY, defaults={'payload': payload})
    return payload
