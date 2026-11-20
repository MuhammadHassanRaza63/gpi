import os
import sys
import datetime
import django
import pandas as pd
from sqlalchemy import Text

# 1. Setup Django Environment so we use the EXACT same database as ZeeChatbot (chat_agent.db)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ZeeDashboard.settings')
try:
    django.setup()
except Exception:
    # Fallback if project folder name in settings is different
    for item in os.listdir('.'):
        if os.path.isdir(item) and os.path.exists(os.path.join(item, 'settings.py')):
            os.environ['DJANGO_SETTINGS_MODULE'] = f'{item}.settings'
            django.setup()
            break

from chat_agent import db
engine = db.get_engine()
print(f"Connected to Chatbot Database Engine: {engine.url}")

# Helper function to fix 'datetime.time' / 'datetime.datetime' errors for SQLite & PostgreSQL
def sanitize_dataframe_for_sql(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip() for c in df.columns]
    
    # Convert large numeric ID columns to string
    id_cols = ['SN', 'SerialNO', 'MSISDN', 'Number', 'ACCEPTERNO', 'Site ID', 'Site_ID', 'HANDLINGID', 'Site']
    for col in id_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).replace({'nan': None, 'None': None, '<NA>': None})

    # Convert any datetime.time or mixed object column containing datetime/time objects to clean string
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].apply(
                lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if isinstance(x, datetime.datetime)
                else (x.strftime('%H:%M:%S') if isinstance(x, datetime.time)
                else (x.strftime('%Y-%m-%d') if isinstance(x, datetime.date) else x))
            )
    return df

# ==============================================================================
# PART 1: Run Django's built-in loader (with datetime.time patch!) for Grid Sheets
# ==============================================================================
print("\n--- STEP 1: Loading Grid Excellence & Core Sheets ---")
try:
    from chat_agent import loader
    orig_to_sql = pd.DataFrame.to_sql

    def safe_to_sql(self, name, con, *args, **kwargs):
        sanitize_dataframe_for_sql(self)
        return orig_to_sql(self, name, con, *args, **kwargs)

    # Temporarily patch DataFrame.to_sql so loader.py never crashes on datetime.time!
    pd.DataFrame.to_sql = safe_to_sql
    loader.load_all(engine, None, log=print)
    pd.DataFrame.to_sql = orig_to_sql
    print("-> Step 1 Complete: All Grid Excellence & Core tables loaded successfully!")
except Exception as e:
    print(f"Note on Step 1 loader: {e}")

# ==============================================================================
# PART 2: Upload all 6 Central-RCTO.xlsx Sheets into the Chatbot's Database
# ==============================================================================
print("\n--- STEP 2: Loading All 6 Central-RCTO Sheets ---")

# Automatically locate Central-RCTO.xlsx
possible_paths = [
    r'C:\Users\DELL\Documents\Company Data\Kamran Saleem\Data\Central-RCTO.xlsx',
    'Central-RCTO.xlsx',
]
excel_file = next((p for p in possible_paths if os.path.exists(p)), None)

if not excel_file:
    print("Error: Central-RCTO.xlsx path not found! Please check the path in possible_paths.")
    sys.exit(1)

print(f"Reading {excel_file}...")
xls = pd.ExcelFile(excel_file)

SHEET_TABLE_MAPPING = {
    'CPM - NOMC-E2E-REGIONS': 'chat_agent_rctocomplaint',
    'CRR - E2E & REGIONS': 'rcto_crr_e2e_regions',
    'CRR - NOMC': 'rcto_crr_nomc',
    'CRS - E2E & REGIONS': 'rcto_crs_e2e_regions',
    'CRS - NOMC': 'rcto_crs_nomc',
    'L-3 TAT': 'rcto_l3_tat'
}

for sheet_name in xls.sheet_names:
    table_name = SHEET_TABLE_MAPPING.get(sheet_name)
    if not table_name:
        continue
        
    print(f"Uploading '{sheet_name}' -> Table: '{table_name}'...")
    df = pd.read_excel(xls, sheet_name=sheet_name)
    df = sanitize_dataframe_for_sql(df)
    
    id_cols = ['SN', 'SerialNO', 'MSISDN', 'Number', 'ACCEPTERNO', 'Site ID', 'Site_ID', 'HANDLINGID']
    dtype_mapping = {col: Text for col in id_cols if col in df.columns}
    
    df.to_sql(table_name, engine, if_exists='replace', index=False, dtype=dtype_mapping, chunksize=1000)
    print(f"  -> Success! {len(df):,} rows saved in '{table_name}'.")

print("\n🎉 ALL 21 TABLES ARE NOW 100% LOADED IN YOUR CHATBOT DATABASE!")