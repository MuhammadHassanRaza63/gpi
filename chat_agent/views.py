import json
import re
import time
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

SCHEMA_AND_VALUES_CACHE = {}

LAST_CONVERSATION_CONTEXT = {
    "last_user_query": "",
    "last_sql_query": "",
    "last_tables": [],
    "last_cols": [],
    "last_rows": []
}

# Exact Official Telecom & RCTO Acronym Definitions (Instant 0-token & 100% accurate!)
TELECOM_ACRONYMS = {
    "ofc": ("OFC", "Optical Fiber Cut / Optical Fiber Cable", "Physical fiber break or backhaul link cut tracked in `chat_agent_ofcbreak`."),
    "cpm": ("CPM", "Customer Perception Management", "Main customer complaint log (`CPM - NOMC-E2E-REGIONS`, 6,953 records)."),
    "crm": ("CRM", "Customer Resolution Maintenance", "Main customer complaint & resolution maintenance tracking across Central FOPs C1–C6 (`chat_agent_rctocomplaint`)."),
    "crr": ("CRR", "Customer Resolution Rate", "Measures First-Time Resolution (`1`) vs Repeat Complaints (`0`) across `rcto_crr_e2e_regions` & `rcto_crr_nomc`."),
    "crs": ("CRS", "Customer Resolution Satisfaction", "Measures post-resolution IVR customer satisfaction (`Satisfied` vs `Not Satisfied`) across `rcto_crs_e2e_regions` & `rcto_crs_nomc`."),
    "tat": ("TAT", "Turn Around Time", "Measures Level-3 SLA resolution turnaround time compliance (`Within TAT`, `Pending Within TAT`, `TAT Over`) in `rcto_l3_tat`."),
    "l3": ("L-3 TAT", "Level-3 Turn Around Time", "Measures Level-3 escalation Turn Around Time SLA compliance in `rcto_l3_tat`."),
    "ls": ("LS", "Load Shedding", "Commercial grid power outage hours/percentage affecting telecom sites (tracked in `grid_tracker` & `chat_agent_networkavailability`)."),
    "rca": ("RCA", "Root Cause Analysis", "Underlying technical/physical cause of an OFC break, RSL deviation, or network fault."),
    "rcto": ("RCTO", "Regional Chief Technical Officer (Central)", "Central region telecom operations & customer complaint governance suite (FOPs C1–C6)."),
    "vswr": ("VSWR", "Voltage Standing Wave Ratio", "RF antenna/feeder line reflection alarm indicating hardware or jumper degradation (`grid_vswr`)."),
    "rsl": ("RSL", "Received Signal Level", "Microwave transmission link signal strength deviation (`grid_rsl_deviation_link`)."),
    "dg": ("DG", "Diesel Generator", "Backup power generator status (`Operational DG` vs `Not Operational`) and fuel consumption (`grid_not_operational_dgs`, `grid_fuel_summary`)."),
}

CHAT_TABLES = [
    ('grid_tracker', 'grid_tracker', 'a'),
    ('chat_agent_networkavailability', 'networkavailability', 'a'),
    ('chat_agent_rctocomplaint', 'rcto_cpm_main', 'b'),
    ('rcto_crr_e2e_regions', 'rcto_crr_e2e', 'b'),
    ('rcto_crr_nomc', 'rcto_crr_nomc', 'b'),
    ('rcto_crs_e2e_regions', 'rcto_crs_e2e', 'b'),
    ('rcto_crs_nomc', 'rcto_crs_nomc', 'b'),
    ('rcto_l3_tat', 'rcto_l3_tat', 'b'),
    ('chat_agent_ofcbreak', 'ofcbreak', 'b'),
    ('grid_down_cells', 'down_cells', 'c'),
    ('grid_t_prime', 't_prime', 'c'),
    ('grid_vswr', 'vswr', 'd'),
    ('grid_zero_traffic', 'zero_traffic', 'd'),
    ('grid_high_temp_alm', 'high_temp_alm', 'd'),
    ('grid_two_phase_missing', '2_phase_missing', 'd'),
    ('grid_fluctuated_sites', 'fluctuated_sites', 'd'),
    ('grid_not_operational_dgs', 'not_op_dgs', 'd'),
    ('grid_eband_availability', 'eband_avail', 'd'),
    ('grid_rsl_deviation_link', 'rsl_deviation', 'd'),
    ('grid_txn_critical_alarms', 'txn_alarms', 'd'),
    ('grid_fuel_summary', 'fuel_summary', 'd'),
]

SAMPLE_PROMPTS = {
    'grid_tracker': 'Compare sub-regions by Oct 2026 availability, load shedding, and revenue in a chart',
    'chat_agent_networkavailability': 'Compare 2025 vs 2026 monthly Availability and Load Shedding with a line chart',
    'chat_agent_rctocomplaint': 'Which 10 sites have the highest number of complaints?',
    'rcto_crr_e2e_regions': 'Give me a Sub Region wise summary of CRR complaints from rcto_crr_e2e_regions',
    'rcto_crr_nomc': 'Give me a summary of CRR NOMC complaints by Main Tagging and Desk For CRR',
    'rcto_crs_e2e_regions': 'Give me a summary of Customer Satisfaction and IVR Status from rcto_crs_e2e_regions',
    'rcto_crs_nomc': 'Give me a Sub Region wise summary of CRS NOMC complaints by Satisfaction',
    'rcto_l3_tat': 'Give me a summary of L-3 TAT complaints by TAT Status and Sub Region',
    'chat_agent_ofcbreak': 'Give me a summary of OFC breaks by RCA',
    'grid_down_cells': 'Give me a summary of Down Cells by Region and Down Technology',
    'grid_t_prime': 'Give me a summary of pending T-Prime issues by T-Prime Category',
    'grid_vswr': 'Show all pending VSWR alarms by SubRegion',
    'grid_zero_traffic': 'Show Zero Traffic cells summary by Sub region and Technology',
    'grid_high_temp_alm': 'Show High TempAlm summary by SubRegion and Alarm title',
    'grid_two_phase_missing': 'Give me a Table of Phase missing sum from ph 1 to ph 3',
    'grid_fluctuated_sites': 'Show Fluctuated Sites summary by SubRegion and Power Source',
    'grid_not_operational_dgs': 'Show all Not Operational DGs table',
    'grid_eband_availability': 'Give me a summary of E-Band Availability by SubRegion',
    'grid_rsl_deviation_link': 'Show RSL Deviation Link summary by Sub region and Status',
    'grid_txn_critical_alarms': 'Give me a summary of TXN Critical Alarms by Region and Severity',
    'grid_fuel_summary': 'Give me Fuel Summary by Region for Station and Mobile DGs',
}

_CUD_INTENT_RE = re.compile(
    r'\b(insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table|drop\s+database|alter\s+table|'
    r'truncate\s+table|create\s+table|create\s+database|replace\s+into|upsert|merge\s+into|'
    r'add\s+record|insert\s+record|insert\s+row|delete\s+record|delete\s+row|remove\s+record|'
    r'update\s+record|modify\s+record|change\s+value\s+in\s+db|write\s+to\s+database)\b',
    re.IGNORECASE
)

_FORBIDDEN_SQL = re.compile(
    r'\b(insert|update|delete|drop|alter|create|attach|detach|pragma|truncate|grant|revoke|vacuum|replace|merge|call|exec)\b',
    re.IGNORECASE
)

_VISUAL_INTENT_RE = re.compile(
    r'\b(chart|plot|graph|visual|visualize|visualise|dashboard|bar\s*chart|line\s*chart|pie\s*chart|scatter|histogram|trend\s*chart)\b',
    re.IGNORECASE
)


def _check_acronym_definition_query(query: str):
    """
    Detects pure definition questions like 'OFC stand for ?', 'CRR, CRS, CRM and TAT stand for ?',
    or 'What does CRS mean?' and returns an exact, verified acronym table + summary without running bad SQL.
    """
    q = query.lower().strip()
    is_def_intent = any(p in q for p in ['stand for', 'stands for', 'full form', 'fullform', 'meaning of', 'what is ', 'what are '])
    # Do not intercept data-comparison questions like "What is the Avg Avail" or "What is the Fiber Cut and Power Cut"
    has_data_words = any(w in q for w in ['avg', 'average', 'total', 'count', 'sum', 'how many', 'compare', 'difference', 'diffrence', 'trend', '2025', '2026', 'central', 'fops', 'site', 'cut', 'cuts', 'break'])
    if not is_def_intent or has_data_words:
        return None

    matched_keys = []
    tokens = re.findall(r'[a-z0-9]+', q)
    for tok in tokens:
        if tok in TELECOM_ACRONYMS and tok not in matched_keys:
            matched_keys.append(tok)

    if not matched_keys:
        return None

    rows = [[TELECOM_ACRONYMS[k][0], TELECOM_ACRONYMS[k][1], TELECOM_ACRONYMS[k][2]] for k in matched_keys]
    table_md = build_markdown_table(["Acronym", "Official Full Form", "Operational Scope in Database"], rows)
    bullets = "\n".join([f"- **{TELECOM_ACRONYMS[k][0]} ({TELECOM_ACRONYMS[k][1]}):** {TELECOM_ACRONYMS[k][2]}" for k in matched_keys])
    return f"{table_md}\n\n### 📊 Telecom Terminology Reference\n{bullets}"


@ensure_csrf_cookie
@xframe_options_sameorigin
def chat_ui(request):
    tables, loaded = [], 0
    try:
        from sqlalchemy import inspect, text
        from . import db
        eng = db.get_engine()
        existing = set(inspect(eng).get_table_names())
        with eng.connect() as conn:
            for name, label, grp in CHAT_TABLES:
                rows = None
                if name in existing:
                    loaded += 1
                    rows = conn.execute(text(f'SELECT COUNT(*) FROM "{name}"')).scalar()
                tables.append({'label': label, 'group': grp, 'rows': rows, 'prompt': SAMPLE_PROMPTS[name]})
    except Exception:
        tables = [{'label': l, 'group': g, 'rows': None, 'prompt': SAMPLE_PROMPTS[n]} for n, l, g in CHAT_TABLES]
    tracker = next((t['rows'] for t in tables if t['label'] == 'grid_tracker'), None)
    return render(request, 'chat_agent/chat.html', {
        'tables': tables, 'n_tables': len(CHAT_TABLES), 'n_loaded': loaded, 'tracker_rows': tracker,
        'model': getattr(settings, 'CHAT_MODEL', ''),
        'elevenlabs_agent_id': getattr(settings, 'ELEVENLABS_AGENT_ID', ''),
    })


def _dialect():
    from . import db
    return db.dialect()


def telecom_domain_rules(dialect: str) -> str:
    like = 'ILIKE' if dialect == 'postgresql' else 'LIKE'
    return f"""
1. OFFICIAL TELECOM ACRONYMS & TERMINOLOGY:
  - "OFC" -> Optical Fiber Cut (`chat_agent_ofcbreak`)
  - "NON-OFC" -> Non-Fiber / Power / Hardware Faults logged in `chat_agent_ofcbreak`
  - "CRM" -> Customer Resolution Maintenance (`chat_agent_rctocomplaint`, 6,953 rows)
  - "CPM" -> Customer Perception Management (`chat_agent_rctocomplaint`, 6,953 rows)
  - "CRR" -> Customer Resolution Rate (`rcto_crr_e2e_regions` & `rcto_crr_nomc`, 6,952 rows)
  - "CRS" -> Customer Resolution Satisfaction (`rcto_crs_e2e_regions` & `rcto_crs_nomc`)
  - "TAT" / "L-3 TAT" -> Turn Around Time (`rcto_l3_tat`, 4,663 rows)
  - "LS" -> ALWAYS means "Load Shedding" (commercial power outage hours/%)
  - "RCA" -> Root Cause Analysis (`rca` in `chat_agent_ofcbreak`)

2. CASE-NORMALIZATION & AGGREGATION RULES (CRITICAL):
  - When grouping by text status/category columns like `"ofc_non_ofc"` in `chat_agent_ofcbreak`, ALWAYS normalize case (`UPPER(TRIM("ofc_non_ofc"))`) so `'OFC'` and `'ofc'` or `'NON-OFC'`, `'Non OFC'`, and `'NoN OFC'` do NOT split into duplicate rows!
  - When the user asks "What is the Fiber Cut and Power Cut?" or "Difference between X and Y?", NEVER dump 100+ raw rows! Write a `GROUP BY` summary query counting incidents, total duration, and average duration for Fiber Cut (`rca {like} '%fiber%' OR rca {like} '%ofc%'`) vs Power Cut (`rca {like} '%power%' OR rca {like} '%wapda%' OR rca {like} '%electric%'`).
  - MULTI-TABLE RCTO COMPARISON RULE:
    When comparing counts across CPM, CRR, CRS, TAT, use `UNION ALL`:
    SELECT 'CPM (Main Complaints)' AS "Category", COUNT(*) AS "Total_Complaints" FROM "chat_agent_rctocomplaint"
    UNION ALL SELECT 'CRR (E2E & Regions)', COUNT(*) FROM "rcto_crr_e2e_regions"
    UNION ALL SELECT 'CRR (NOMC)', COUNT(*) FROM "rcto_crr_nomc"
    UNION ALL SELECT 'CRS (E2E & Regions)', COUNT(*) FROM "rcto_crs_e2e_regions"
    UNION ALL SELECT 'CRS (NOMC)', COUNT(*) FROM "rcto_crs_nomc"
    UNION ALL SELECT 'L-3 TAT', COUNT(*) FROM "rcto_l3_tat";

3. ANALYTICAL, COMPARISON & ENTITY RULES:
  - Comparisons ("compare", "vs", "difference", "MoM", "YoY"): Compute BOTH metrics AND their difference (`Delta`) in the `SELECT` clause.
  - Charts / Plots / Dashboards: ALWAYS return an aggregated query (`GROUP BY` or `LIMIT 15`), Column 1 = Label, Columns 2..N = Numeric KPIs.
  - Sub-Regions ("Central 1".."Central 6", "Central I".."Central VI", "FOPs C1".."FOPs C6"):
    - `grid_tracker` uses `"sub_region"`, while RCTO tables use `"Sub Region"`.
    - Match flexibly: `("Sub Region" {like} '%Central-1%' OR "Sub Region" {like} '%Central I%' OR "Sub Region" {like} '%Central 1%')`.
  - NEVER write `SELECT * FROM "grid_tracker"` or `SELECT * FROM "chat_agent_ofcbreak"`.
  - `"revenue_norm30_oct_2026"` DOES NOT EXIST in `"grid_tracker"` (`"revenue_norm30_sep_2026"` is the latest revenue month).
"""


def sql_rules(dialect: str) -> str:
    if dialect == 'postgresql':
        return """4. Always cast expressions inside `ROUND((...)::numeric, 2)`."""
    return """4. This is SQLite: use `LIKE` (already case-insensitive), never `ILIKE`; never use `::` casts (use `CAST(x AS REAL)`);
   `ROUND(expr, 2)` works directly; integer division truncates, so multiply by 1.0 when computing ratios or percentages."""


def is_followup_query(query: str) -> bool:
    q = query.lower().strip()
    followup_phrases = [
        'this data', 'that data', 'above data', 'same data', 'previous',
        'month on month', 'month by month', 'mom', 'sub region wise', 'grid wise',
        'create a table', 'make a table', 'show in table', 'plot', 'chart', 'graph',
        'dashboard', 'visualize', 'visualise', 'compare this', 'analyze this'
    ]
    return len(q.split()) <= 7 or any(p in q for p in followup_phrases)


def select_relevant_tables(query: str) -> list:
    q = query.lower()
    q_compact = re.sub(r'[^a-z0-9]', '', q)
    selected = []

    if 'vswr' in q_compact:
        selected.append('grid_vswr')
    if any(k in q_compact for k in ['downcell', 'downncell', 'downcells', 'tch', 'utran', 'eutran']):
        selected.append('grid_down_cells')
    if 'zerotraffic' in q_compact:
        selected.append('grid_zero_traffic')
    if any(k in q_compact for k in ['hightemp', 'tempalm', 'temperature']):
        selected.append('grid_high_temp_alm')
    if any(k in q_compact for k in ['tprime', 'slabreach', 'disconnection', '11kv', 'transformer', 'energymeter']):
        selected.append('grid_t_prime')
    if any(k in q_compact for k in ['eband', 'linkavailability']):
        selected.append('grid_eband_availability')
    if any(k in q_compact for k in ['rsl', 'deviationlink', 'losissue']):
        selected.append('grid_rsl_deviation_link')
    if any(k in q_compact for k in ['txn', 'criticalalarm', 'alarmsource', 'fibercable', 'severity']):
        selected.append('grid_txn_critical_alarms')
    if any(k in q_compact for k in ['notoperational', 'dgengine', 'dgbrand', 'dgrating', 'moh']):
        selected.append('grid_not_operational_dgs')
    if any(k in q_compact for k in ['2phase', 'twophase', 'phasemissing', 'ph1', 'ph2', 'ph3']):
        selected.append('grid_two_phase_missing')
    if any(k in q_compact for k in ['fluctuat', 'wk41', 'wk42', 'powersource']):
        selected.append('grid_fluctuated_sites')
    if any(k in q_compact for k in ['fuelsummary', 'mdg', 'stationdg', 'onlymdvs']):
        selected.append('grid_fuel_summary')

    has_tat = any(k in q_compact for k in ['l3tat', 'tatstatus', 'withintat', 'tatdept', 'tatsubdept', 'arpulevel', 'msisdnrevenue', 'serialno', 'ccinvalid']) or bool(re.search(r'\b(tat|l-?3)\b', q))
    has_crs = any(k in q_compact for k in ['crse2e', 'crsnomc', 'satisfaction', 'ivrstatus', 'consideredforcrs', 'crsreversion']) or bool(re.search(r'\bcrs\b', q))
    has_crr = any(k in q_compact for k in ['crre2e', 'crrnomc', 'crrindicator', 'consideredforcrr', 'deskforcrr', 'leveldescription']) or (bool(re.search(r'\bcrr\b', q)) and 'tracker' not in q_compact)

    if (has_tat and has_crs) or (has_tat and has_crr) or (has_crs and has_crr):
        return [
            'chat_agent_rctocomplaint',
            'rcto_crr_e2e_regions',
            'rcto_crr_nomc',
            'rcto_crs_e2e_regions',
            'rcto_crs_nomc',
            'rcto_l3_tat',
        ]

    if has_tat:
        selected.append('rcto_l3_tat')
    if has_crs:
        if 'nomc' in q_compact and 'e2e' not in q_compact:
            selected.append('rcto_crs_nomc')
        elif 'e2e' in q_compact and 'nomc' not in q_compact:
            selected.append('rcto_crs_e2e_regions')
        else:
            selected.extend(['rcto_crs_e2e_regions', 'rcto_crs_nomc'])
    if has_crr:
        if 'nomc' in q_compact and 'e2e' not in q_compact:
            selected.append('rcto_crr_nomc')
        elif 'e2e' in q_compact and 'nomc' not in q_compact:
            selected.append('rcto_crr_e2e_regions')
        else:
            selected.extend(['rcto_crr_e2e_regions', 'rcto_crr_nomc'])

    if any(k in q_compact for k in ['complaint', 'rcto', 'msisdn', 'customer', 'ticket', 'resolution', 'cpm', 'crm', 'hvc', 'coverage', 'speed', 'servicetitle', 'handlenotes', 'smr', 'fops', 'maintagging', 'tagging', 'subtagging', 'routingteam', 'closurestate', 'retailer']):
        if not any(t.startswith('rcto_') for t in selected) or 'cpm' in q_compact or 'chat_agent_rctocomplaint' in q:
            if 'chat_agent_rctocomplaint' not in selected:
                selected.append('chat_agent_rctocomplaint')

    if any(k in q for k in ['ofc', 'opc', 'optical', 'break', 'fiber', 'power cut', 'outage', 'rca', 'route cause', 'root cause', 'rms', 'vendor', 'ring', 'spur', 'cmpak']):
        if 'chat_agent_ofcbreak' not in selected:
            selected.append('chat_agent_ofcbreak')

    has_tracker_kpis = any(k in q_compact for k in [
        'tracker', 'gridexcellence', 'voice', 'erl', 'data', 'gb', 'revenue', 'rev', 'fuel',
        'kwh', 'units', 'billing', 'underutilized', 'bbtype', 'liion', 'agm', 'licapacity',
        'chronic', 'platinum', 'gold', 'silver', 'bronze', 'lrs', 'hub', 'single', 'ftts',
        'ptn', 'sharing', 'btsa'
    ])

    if has_tracker_kpis and not any(t.startswith('rcto_') or t == 'chat_agent_rctocomplaint' for t in selected):
        selected.append('grid_tracker')
    elif any(k in q for k in ['avail', 'vaial', 'avial', 'ls', 'load', 'shedding', '2025', '2026', 'mom', 'month']) and not selected:
        if is_followup_query(query) and LAST_CONVERSATION_CONTEXT["last_tables"]:
            selected.extend(LAST_CONVERSATION_CONTEXT["last_tables"])
        else:
            selected.append('chat_agent_networkavailability')

    if any(k in q for k in ['pending', 'current status', 'missing']) and not selected:
        selected = ['grid_tracker', 'grid_down_cells']

    if not selected:
        if is_followup_query(query) and LAST_CONVERSATION_CONTEXT["last_tables"]:
            selected = list(LAST_CONVERSATION_CONTEXT["last_tables"])
        else:
            selected = ['grid_tracker']

    unique_selected = []
    for t in selected:
        if t not in unique_selected:
            unique_selected.append(t)
    return unique_selected[:6]


def get_table_metadata_with_categories(table_names: list) -> str:
    from sqlalchemy import inspect, text
    from . import db
    engine = db.get_engine()
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    output_blocks = []

    category_keywords = [
        'sub_region', 'subregion', 'sub region', 'sub-region', 'region',
        'technology', 'classification', 'rca', 'status', 'category', 'dg_status',
        'sharing_status', 'bb_type', 'hub_single', 'main_tagging', 'main tagging',
        'month', 'unnamed: 0', 'satisfaction', 'ivr status', 'tat status',
        'routing team', 'team', 'crr indicator', 'desk for crr', 'ofc'
    ]

    with engine.connect() as conn:
        for table in table_names:
            if table not in existing_tables:
                continue
            if table in SCHEMA_AND_VALUES_CACHE:
                output_blocks.append(SCHEMA_AND_VALUES_CACHE[table])
                continue

            cols = [col['name'] for col in inspector.get_columns(table)]
            cat_samples = []

            for col in cols:
                if any(ck in col.lower() for ck in category_keywords):
                    try:
                        res = conn.execute(text(f'SELECT DISTINCT "{col}" FROM "{table}" WHERE "{col}" IS NOT NULL LIMIT 8'))
                        vals = [str(r[0]).strip() for r in res if r[0] is not None and str(r[0]).strip() != '']
                        if vals:
                            cat_samples.append(f'  * "{col}" values: {vals}')
                    except Exception:
                        pass

            cols_list = ', '.join('"%s"' % c for c in cols)
            block = f'Table: "{table}"\nExact Columns: {cols_list}'
            if cat_samples:
                block += "\nSample Values:\n" + "\n".join(cat_samples)

            SCHEMA_AND_VALUES_CACHE[table] = block
            output_blocks.append(block)

    return "\n\n".join(output_blocks)


_ROUND_RE = re.compile(r'ROUND\s*\(\s*((?:[^(),]|\([^()]*\))+?)\s*,\s*(\d+)\s*\)', re.IGNORECASE)


def fix_postgres_sql(sql: str) -> str:
    def repl(match):
        expr = match.group(1).strip()
        digits = match.group(2)
        if not expr.lower().endswith('::numeric'):
            return f"ROUND(({expr})::numeric, {digits})"
        return match.group(0)

    fixed = _ROUND_RE.sub(repl, sql)
    return _ROUND_RE.sub(repl, fixed)


def adjust_sql_limit(sql: str, user_query: str) -> str:
    q_lower = user_query.lower()

    explicit_limit_match = re.search(r'\b(?:top|limit|first|show|give\s+me)\s+(\d+)\b|\b(\d+)\s+(?:rows|sites|records|complaints|cells|dgs|links|alarms)\b', q_lower)
    requested_limit = None
    if explicit_limit_match:
        val = explicit_limit_match.group(1) or explicit_limit_match.group(2)
        if val and int(val) not in (2025, 2026, 2027, 1, 2, 3):
            requested_limit = int(val)

    if ('GROUP BY' in sql.upper() or 'UNION ALL' in sql.upper()) and not requested_limit:
        sql = re.sub(r'\s+LIMIT\s+\d+\s*;?$', ';', sql, flags=re.IGNORECASE)
        return sql

    if requested_limit:
        if re.search(r'\bLIMIT\s+\d+\b', sql, flags=re.IGNORECASE):
            sql = re.sub(r'\bLIMIT\s+\d+\b', f'LIMIT {requested_limit}', sql, flags=re.IGNORECASE)
        else:
            sql = sql.rstrip(';') + f' LIMIT {requested_limit};'
        return sql

    limit_match = re.search(r'\bLIMIT\s+(\d+)\b', sql, flags=re.IGNORECASE)
    if limit_match:
        current_limit = int(limit_match.group(1))
        if current_limit < 100 and str(current_limit) not in q_lower:
            sql = re.sub(r'\bLIMIT\s+\d+\b', 'LIMIT 100', sql, flags=re.IGNORECASE)

    return sql


def extract_sql(raw_text: str, user_query: str = "") -> str:
    cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
    match = re.search(r"```(?:sql)?\s*(.*?)\s*```", cleaned, flags=re.DOTALL | re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()
    sql = cleaned.rstrip(';') + ';'
    if _dialect() == 'postgresql':
        sql = fix_postgres_sql(sql)
    if user_query:
        sql = adjust_sql_limit(sql, user_query)
    return sql


def is_safe_select(sql: str) -> bool:
    body = sql.strip().rstrip(';').strip()
    return body.upper().startswith(('SELECT', 'WITH')) and ';' not in body and not _FORBIDDEN_SQL.search(body)


def invoke_llm_with_retry(llm, prompt: str) -> str:
    for attempt in range(2):
        try:
            return llm.invoke(prompt).content.strip()
        except Exception as e:
            err_str = str(e)
            if ('429' in err_str or 'rate_limit' in err_str.lower()) and attempt == 0:
                print("[Groq TPM Rate Limit hit - waiting 6 seconds...]")
                time.sleep(6)
                continue
            raise


def build_markdown_table(col_names: list, rows: list) -> str:
    if not rows:
        return ""
    clean_headers = [str(c).replace('_', ' ').title() for c in col_names]
    header = "| " + " | ".join(clean_headers) + " |"
    sep = "| " + " | ".join(["---"] * len(col_names)) + " |"
    body_lines = []
    for r in rows:
        formatted_cells = []
        for val in r:
            if isinstance(val, float):
                if val.is_integer():
                    formatted_cells.append(f"{int(val):,}")
                else:
                    formatted_cells.append(f"{val:,.2f}")
            elif isinstance(val, int):
                formatted_cells.append(f"{val:,}")
            elif val is None:
                formatted_cells.append("–")
            else:
                formatted_cells.append(str(val).replace('|', '/'))
        body_lines.append("| " + " | ".join(formatted_cells) + " |")
    return "\n".join([header, sep] + body_lines)


def build_visual_payload(user_query: str, col_names: list, rows: list):
    if not rows or len(col_names) < 2 or len(rows) < 2:
        return None

    vis_rows = rows[:25]
    x_labels = [str(r[0]) if r[0] is not None else "N/A" for r in vis_rows]

    series_list = []
    for col_idx in range(1, len(col_names)):
        s_name = str(col_names[col_idx]).replace('_', ' ').title()
        s_vals = []
        has_numeric = False
        for r in vis_rows:
            v = r[col_idx]
            if isinstance(v, (int, float)):
                s_vals.append(round(float(v), 2))
                has_numeric = True
            else:
                try:
                    s_vals.append(round(float(str(v).replace(',', '')), 2))
                    has_numeric = True
                except Exception:
                    s_vals.append(0)
        if has_numeric:
            series_list.append({"name": s_name, "data": s_vals})

    if not series_list:
        return None

    q_lower = user_query.lower()
    chart_type = "bar"
    if any(k in q_lower for k in ['line', 'trend', 'mom', 'month', 'over time', 'trajectory']):
        chart_type = "line"
    elif "dashboard" in q_lower:
        chart_type = "dashboard"
    elif len(series_list) >= 2 and any(k in q_lower for k in ['combo', 'vs', 'compare']):
        chart_type = "combo"

    kpis = []
    for s in series_list[:3]:
        vals = [v for v in s["data"] if v is not None]
        if vals:
            kpis.append({
                "label": s["name"],
                "avg": round(sum(vals) / len(vals), 2),
                "max": round(max(vals), 2),
                "latest": vals[-1]
            })

    return {
        "mode": chart_type,
        "title": user_query[:80],
        "categories": x_labels,
        "series": series_list,
        "kpis": kpis
    }


def _run_query(sql: str):
    from . import db
    from sqlalchemy import text
    with db.read_only_connection() as conn:
        result = conn.execute(text(sql))
        return list(result.keys()), result.fetchmany(200)


# ----------------------------------------------------------------------------------------------- API
@require_POST
def chat_with_data(request):
    try:
        payload = json.loads(request.body or b'{}')
    except ValueError:
        payload = {}
    user_query = str(payload.get('query', '')).strip()

    if not user_query:
        return JsonResponse({"error": "Please enter a question."}, status=400)

    q_lower = user_query.lower()

    # 1. Instant greeting (0 tokens)
    if q_lower in ['hi', 'hello', 'hey', 'salam', 'assalam o alaikum', 'aoa']:
        return JsonResponse({
            "answer": (
                "Hello! I am your **ZeeChatbot Telecom Intelligence Assistant**. Ask me about Network Availability, "
                "Load Shedding, Revenue, Voice/Data Traffic, OFC Breaks, all 6 RCTO Complaint tables (CPM, CRR, CRS, L-3 TAT), "
                "or request **Charts, Plots, Mini-Dashboards, and Comparative Analytics** across all 21 tables!"
            )
        })

    # 2. Instant Official Acronym Dictionary (0 tokens — prevents hallucinated SQL definitions!)
    acronym_answer = _check_acronym_definition_query(user_query)
    if acronym_answer:
        return JsonResponse({"answer": acronym_answer})

    # 3. Strict Zero-CUD & Security Guardrail (0 tokens)
    if any(w in q_lower for w in ['password', 'secret_key', 'api_key', 'credential']) or _CUD_INTENT_RE.search(user_query):
        return JsonResponse({
            "answer": (
                "🔒 **Read-Only Policy Restriction:** I am strictly configured for **Read-Only Analytics, Comparisons, and Visualizations**. "
                "I cannot perform **Create, Update, Delete (CUD)**, or destructive database operations."
            )
        })

    api_key = getattr(settings, 'GROQ_API_KEY', None)
    if not api_key:
        return JsonResponse({"error": "GROQ_API_KEY is not set."}, status=503)

    try:
        from langchain_groq import ChatGroq
        from . import db
        dialect = db.dialect()
        dialect_label = 'PostgreSQL' if dialect == 'postgresql' else 'SQLite'

        llm = ChatGroq(
            temperature=0,
            model_name=settings.CHAT_MODEL,
            api_key=api_key,
            max_tokens=2048,
            reasoning_effort="low",
        )

        wants_visual = bool(_VISUAL_INTENT_RE.search(user_query))
        is_pure_visual_followup = (
            wants_visual
            and is_followup_query(user_query)
            and len(LAST_CONVERSATION_CONTEXT["last_rows"]) > 0
            and not any(k in q_lower for k in ['site', 'ofc', 'tat', 'crr', 'crs', 'vswr', 'down', 'fuel', '2025', '2026'])
        )

        if is_pure_visual_followup and len(LAST_CONVERSATION_CONTEXT["last_rows"]) <= 50:
            col_names = LAST_CONVERSATION_CONTEXT["last_cols"]
            compact_rows = LAST_CONVERSATION_CONTEXT["last_rows"]
            sql_query = LAST_CONVERSATION_CONTEXT["last_sql_query"]
        else:
            relevant_tables = select_relevant_tables(user_query)
            schema_with_categories = get_table_metadata_with_categories(relevant_tables)
            if not schema_with_categories:
                return JsonResponse({
                    "answer": "⚠️ **Chat data is not loaded yet.** Run `python upload_rcto_data.py` once, then ask again."
                })

            followup_context_block = ""
            if LAST_CONVERSATION_CONTEXT["last_user_query"]:
                followup_context_block = f"""
PREVIOUS CONVERSATION TURN (Use ONLY if the current User Question is a follow-up):
- Previous User Question: {LAST_CONVERSATION_CONTEXT["last_user_query"]}
- Previous SQL Executed: {LAST_CONVERSATION_CONTEXT["last_sql_query"]}
"""

            visual_sql_hint = ""
            if wants_visual:
                visual_sql_hint = """
- VISUAL / CHART REQUIREMENT:
  - Column 1 MUST be the category label, Columns 2..N MUST be numeric KPIs.
  - Aggregate (`GROUP BY`) or use `LIMIT 15` so the chart has 3 to 20 clean data points.
"""

            sql_prompt = f"""You are the Lead {dialect_label} Architect for Telecom Network Intelligence.
Write ONLY a valid read-only {dialect_label} `SELECT` query to answer the user's question.

{telecom_domain_rules(dialect)}
{followup_context_block}

SCHEMA:
{schema_with_categories}

STRICT SQL RULES:
1. Return ONLY raw read-only SQL (`SELECT ...`). Never generate INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.
2. Wrap all table and column names in double quotes.
  - CRITICAL: NEVER write `SELECT *`! Select only aggregated or specific columns needed.
  - Always normalize case with `UPPER(TRIM(...))` when grouping by text status columns (like `"ofc_non_ofc"`) so `'OFC'` and `'ofc'` or `'NON-OFC'` and `'Non OFC'` are combined cleanly!
  - `"revenue_norm30_oct_2026"` DOES NOT EXIST in `"grid_tracker"`.
{visual_sql_hint}
{sql_rules(dialect)}

User Question: {user_query}
SQL:"""

            sql_response = invoke_llm_with_retry(llm, sql_prompt)
            sql_query = extract_sql(sql_response, user_query)

            if not sql_query.upper().lstrip().startswith(("SELECT", "WITH")):
                return JsonResponse({
                    "answer": "I specialize in **Telecom Data Analytics**. Please ask a question about Network Availability, Load Shedding, Revenue, Voice/Data Traffic, OFC Breaks, RCTO Complaints (CPM, CRR, CRS, L-3 TAT), or Grid KPIs."
                })
            if not is_safe_select(sql_query):
                return JsonResponse({"answer": "🔒 **Security Policy Restriction:** Only read-only `SELECT` queries are supported. CUD operations are blocked."})

            print(f"\n[Selected Tables]: {relevant_tables}")
            print(f"[Generated SQL]:\n{sql_query}\n")

            try:
                col_names, rows = _run_query(sql_query)
            except Exception as db_err:
                print(f"[SQL Error - Triggering Self-Healing Retry]: {db_err}")
                fix_prompt = f"""Your {dialect_label} query failed with this error:
{str(db_err)}

Fix the read-only SELECT query using ONLY the exact column names from the schema below (double-quoted):
{sql_rules(dialect)}

{schema_with_categories}

User Question: {user_query}
Corrected SQL:"""
                retry_response = invoke_llm_with_retry(llm, fix_prompt)
                sql_query = extract_sql(retry_response, user_query)
                if not is_safe_select(sql_query):
                    return JsonResponse({"answer": "🔒 **Security Policy Restriction:** Only read-only queries are supported."})
                col_names, rows = _run_query(sql_query)

            compact_rows = []
            for r in rows:
                compact_rows.append(tuple(round(float(v), 2) if isinstance(v, float) or type(v).__name__ == 'Decimal' else v for v in r))

            LAST_CONVERSATION_CONTEXT["last_user_query"] = user_query
            LAST_CONVERSATION_CONTEXT["last_sql_query"] = sql_query
            LAST_CONVERSATION_CONTEXT["last_tables"] = relevant_tables
            LAST_CONVERSATION_CONTEXT["last_cols"] = col_names
            LAST_CONVERSATION_CONTEXT["last_rows"] = compact_rows

        visual_payload = None
        if wants_visual or any(k in q_lower for k in ['compare', 'comparison', 'trend', 'vs', 'versus', 'diffrence', 'difference']):
            visual_payload = build_visual_payload(user_query, col_names, compact_rows)

        full_markdown_table = build_markdown_table(col_names, compact_rows)

        sample_for_summary = compact_rows[:6] + compact_rows[-6:] if len(compact_rows) > 12 else compact_rows
        summary_only_prompt = f"""You are a Senior Telecom Intelligence Analyst.
User Question: {user_query}
SQL Executed: {sql_query}
Exact Total Rows Rendered in Table Above: {len(compact_rows)} rows
Columns: {col_names}
Data Sample: {sample_for_summary}

STRICT GROUNDING & ANTI-HALLUCINATION INSTRUCTIONS:
1. The complete {len(compact_rows)}-row Markdown Table has ALREADY been displayed above your text. Do NOT repeat any Markdown table!
2. Write ONLY the **### 📊 Analytical & Comparative Insights** section (3 to 4 sharp bullet points).
3. ZERO HALLUCINATION RULE: Every single number, percentage, or count you write MUST come directly from `Data Sample` or `Exact Total Rows Rendered ({len(compact_rows)})` above! NEVER invent external benchmarks, hypothetical percentages, or unverified claims.
4. ALWAYS call "LS" **Load Shedding** (never Lost-Signal or traffic throttling).
5. If a complaint query for 2025 returned `0`, note that the RCTO Complaint tables in the database cover **2026 (Jan–Oct 2026)**."""

        try:
            exec_summary = invoke_llm_with_retry(llm, summary_only_prompt)
            exec_summary = re.sub(r"<think>.*?</think>", "", exec_summary, flags=re.DOTALL).strip()
        except Exception:
            exec_summary = (
                "### 📊 Analytical & Comparative Insights\n"
                f"- **Complete Dataset Rendered:** Displaying all **{len(compact_rows)}** matching records across **{len(col_names)}** columns.\n"
                "- **Operational Insight:** Use the live table filter or CSV export above to inspect specific thresholds."
            )

        answer_text = f"{full_markdown_table}\n\n{exec_summary}" if full_markdown_table else exec_summary
        return JsonResponse({"answer": answer_text, "visual": visual_payload})

    except ImportError as e:
        return JsonResponse({"error": f"Chatbot package missing ({e.name})."}, status=503)
    except Exception as e:
        print(f"[Unhandled Error]: {e}")
        return JsonResponse({
            "answer": "⚠️ **Query Could Not Be Completed:** Please refine your filter. Try asking: *'Compare Sub-Region availability and load shedding in a bar chart'* or *'Show all 91 Not Operational DGs'*."
        })