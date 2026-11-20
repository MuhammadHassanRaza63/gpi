from django.db import models


class Complaint(models.Model):
    """One row of tab 'CPM - NOMC-E2E-REGIONS' (Central region, owner RCTO Central)."""
    sn = models.CharField(max_length=32, unique=True)
    month = models.PositiveSmallIntegerField(db_index=True)          # 'Month#' column
    accept_time = models.DateTimeField()                              # 'ACCEPTTIME'
    service_title = models.CharField(max_length=120, blank=True)
    city = models.CharField(max_length=80, blank=True)
    sub_region = models.CharField(max_length=20, blank=True)         # 'Central I' ... 'Central VI'
    site_id = models.IntegerField(null=True, blank=True, db_index=True)
    site_classification = models.CharField(max_length=40, blank=True)
    main_tagging = models.CharField(max_length=80, blank=True)       # Coverage / Data speed / Call quality
    routing_team = models.CharField(max_length=20, blank=True)       # 'FOPs C1' ... 'FOPs C6'


class OfcBreak(models.Model):
    """One row of the yearly OFC Breaks Detail files (2025 and 2026)."""
    year = models.PositiveSmallIntegerField(db_index=True)
    event_id = models.CharField(max_length=40, blank=True)
    vendor = models.CharField(max_length=60, blank=True)
    date = models.DateField(db_index=True)
    sub_region = models.CharField(max_length=20, blank=True)         # 'Central-1' ...
    network_type = models.CharField(max_length=20, blank=True)       # LH / Metro / FTTS
    sections = models.CharField(max_length=200, blank=True)          # 'OFC Sections' / 'Fiber Sections'
    duration_min = models.FloatField(null=True, blank=True)          # 'Duration': fiber break time to restoration, minutes
    ofc_flag = models.CharField(max_length=40, blank=True)           # OFC / Non OFC ... (as in the file)


class SiteAvailability(models.Model):
    """One row per site of 'Network Availability with LS' (Jan 2025 - Oct 2026)."""
    site_id = models.IntegerField(unique=True)
    sub_region = models.CharField(max_length=20)                     # 'Central-1' ...
    grid = models.CharField(max_length=20, blank=True)
    group = models.CharField(max_length=30, blank=True)              # 'Group': Platinum+ / PGS / SB
    bb_type = models.CharField(max_length=40, blank=True)            # 'BB Type': power backup
    dg_operational = models.CharField(max_length=40, blank=True)     # 'DG Operational' (blank = not filled)
    chronic = models.BooleanField(default=False)                     # 'Chronic Below Target' filled
    avail = models.JSONField()                                       # 22 monthly cell availability values, Jan 2025 .. Oct 2026 (null = none)
    ls = models.JSONField()                                          # 22 monthly load-shedding hours, same months


class Snapshot(models.Model):
    """Computed dashboard numbers, refreshed every time data is loaded."""
    key = models.CharField(max_length=40, unique=True)
    payload = models.JSONField()
    computed_at = models.DateTimeField(auto_now=True)


class CentralCase(models.Model):
    """One complaint row of Central-RCTO.xlsx. `dataset` says which tab it came from:
    CPM = 'CPM - NOMC-E2E-REGIONS', CRR = 'CRR - E2E & REGIONS', CRS = 'CRS - NOMC', TAT = 'L-3 TAT'."""
    dataset = models.CharField(max_length=4)
    sn = models.CharField(max_length=32)                              # 'SN' (TAT tab: 'SerialNO')
    accept_time = models.DateTimeField()                              # 'ACCEPTTIME'
    month = models.PositiveSmallIntegerField()                        # month of ACCEPTTIME (1..12)
    service_title = models.CharField(max_length=120, blank=True)
    main_tagging = models.CharField(max_length=60, blank=True)        # Coverage / Data speed / Call quality (raw file text)
    city = models.CharField(max_length=80, blank=True)
    sub_region = models.CharField(max_length=20, blank=True)         # 'Central I' ... 'Central VI' (blank = not mapped)
    big_region = models.CharField(max_length=20, blank=True)
    site_id = models.IntegerField(null=True, blank=True)
    site_class = models.CharField(max_length=40, blank=True)
    team = models.PositiveSmallIntegerField(null=True, blank=True)    # FOPs C1..C6 -> 1..6
    hvc = models.BooleanField(default=False)
    channel = models.CharField(max_length=80, blank=True)
    resolution = models.CharField(max_length=40, blank=True)         # 'Resolution Status' (CPM, CRR, CRS tabs)
    closure = models.CharField(max_length=80, blank=True)            # 'Closure State'
    fix_type = models.CharField(max_length=120, blank=True)          # 'Last Type' (CPM, CRR tabs)
    crr_flag = models.SmallIntegerField(null=True, blank=True)       # 'CRR Indicator (-/1/0)': 1 / 0, null = '-'
    satisfaction = models.CharField(max_length=20, blank=True)       # CRS tab: Satisfied / Not Satisfied / No Response / '-'
    tat_status = models.CharField(max_length=24, blank=True)         # TAT tab: Within TAT / Pending Within TAT / TAT Over
    handovers = models.PositiveSmallIntegerField(null=True, blank=True)   # TAT tab: number of '->' in HANDLINGID
    reopened = models.BooleanField(default=False)                    # TAT tab: COMPLAINTSTATE contains 'Re-Opened'
    arpu = models.CharField(max_length=30, blank=True)               # TAT tab: 'ARPU Level'

    class Meta:
        indexes = [models.Index(fields=['dataset', 'month'], name='dash_cc_ds_month_idx')]
