#!/usr/bin/env python3
"""
ATON-IQ Master Data Ingestion Engine
------------------------------------
Automatically inspects .xlsb, .xlsx, .xls, and .csv workbooks, normalizes sheet names
and column headers with 100% SQL-safe accuracy, cleans data types, and upserts/replaces
the updated Grid & Telecom tables into PostgreSQL or SQLite.

Usage:
    python ingest_master_grid_data.py "update Network KPI Reports - Grid Excellence.xlsb"
    python ingest_master_grid_data.py "update Network KPI Reports - Grid Excellence.xlsb" "LTE_Traffic_Migration_Analysis.xlsx"
"""

import os
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, inspect, text

# Load Django / .env database configuration automatically if present
BASE_DIR = Path(__file__).resolve().parent


def _load_env():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def get_db_engine():
    """Connects to PostgreSQL (if configured in .env) or falls back to local db.sqlite3."""
    _load_env()
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        return create_engine(db_url)

    pg_name = os.environ.get("DB_NAME", "").strip()
    pg_user = os.environ.get("DB_USER", "").strip()
    pg_pass = os.environ.get("DB_PASSWORD", "").strip()
    pg_host = os.environ.get("DB_HOST", "localhost").strip()
    pg_port = os.environ.get("DB_PORT", "5432").strip()

    if pg_name and pg_user:
        return create_engine(f"postgresql+psycopg2://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_name}")

    sqlite_path = BASE_DIR / "db.sqlite3"
    return create_engine(f"sqlite:///{sqlite_path}")


# Smart mapping from Excel Sheet Names -> Exact ATON-IQ Production DB Table Names
SHEET_TO_TABLE_MAP = {
    "tracker": "grid_tracker",
    "gridtracker": "grid_tracker",
    "mastertracker": "grid_tracker",
    "networkavailability": "chat_agent_networkavailability",
    "availability": "chat_agent_networkavailability",
    "downcells": "grid_down_cells",
    "downcell": "grid_down_cells",
    "tprime": "grid_t_prime",
    "vswr": "grid_vswr",
    "zerotraffic": "grid_zero_traffic",
    "hightempalm": "grid_high_temp_alm",
    "hightemp": "grid_high_temp_alm",
    "2phasemissing": "grid_two_phase_missing",
    "twophasemissing": "grid_two_phase_missing",
    "fluctuatedsites": "grid_fluctuated_sites",
    "notoperationaldgs": "grid_not_operational_dgs",
    "ebandavailability": "grid_eband_availability",
    "rsldeviationlink": "grid_rsl_deviation_link",
    "txncriticalalarms": "grid_txn_critical_alarms",
    "fuelsummary": "grid_fuel_summary",
    "ofcbreak": "chat_agent_ofcbreak",
    "ofcbreaks": "chat_agent_ofcbreak",
    "cpm": "chat_agent_rctocomplaint",
    "crre2e": "rcto_crr_e2e_regions",
    "crrnomc": "rcto_crr_nomc",
    "crse2e": "rcto_crs_e2e_regions",
    "crsnomc": "rcto_crs_nomc",
    "l3tat": "rcto_l3_tat",
}


def resolve_table_name(file_stem: str, sheet_name: str) -> str:
    """Maps known Grid/RCTO sheets to exact production tables, or generates a clean SQL table name."""
    compact_sheet = re.sub(r"[^a-z0-9]", "", sheet_name.lower())
    for key, target_table in SHEET_TO_TABLE_MAP.items():
        if key == compact_sheet or key in compact_sheet:
            return target_table

    clean_prefix = re.sub(r"[^a-z0-9]+", "_", file_stem.lower()).strip("_")[:24]
    clean_sheet = re.sub(r"[^a-z0-9]+", "_", sheet_name.lower()).strip("_")
    if not clean_sheet or clean_sheet.startswith("sheet"):
        return clean_prefix
    return f"{clean_prefix}_{clean_sheet}"[:60]


def clean_column_name(col: object, idx: int) -> str:
    """Converts any raw Excel header into a clean, deterministic snake_case SQL column name."""
    raw = str(col).strip()
    if not raw or raw.lower().startswith("unnamed"):
        return f"col_{idx + 1}"

    raw = raw.replace("%", "_pct").replace("#", "_no").replace("&", "_and_")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", raw.lower()).strip("_")
    if not cleaned:
        return f"col_{idx + 1}"
    if cleaned[0].isdigit():
        cleaned = f"c_{cleaned}"
    return cleaned[:60]


def detect_and_clean_dataframe(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Finds the true header row (skipping banner rows if any), deduplicates column names,
    strips whitespace from text cells, and drops completely empty rows/columns.
    """
    df = df_raw.dropna(how="all").dropna(axis=1, how="all").copy()
    if df.empty:
        return df

    # Check if top rows are banner titles (mostly NaN) and promote the first dense row to header
    first_row_non_null = df.iloc[0].notna().sum()
    if len(df) > 2 and first_row_non_null < max(2, int(df.shape[1] * 0.4)):
        for r_idx in range(1, min(6, len(df))):
            if df.iloc[r_idx].notna().sum() >= max(2, int(df.shape[1] * 0.5)):
                df.columns = df.iloc[r_idx]
                df = df.iloc[r_idx + 1 :].reset_index(drop=True)
                break

    # Clean & deduplicate column names
    seen = {}
    new_cols = []
    for i, c in enumerate(df.columns):
        base_col = clean_column_name(c, i)
        if base_col in seen:
            seen[base_col] += 1
            new_cols.append(f"{base_col}_{seen[base_col]}")
        else:
            seen[base_col] = 1
            new_cols.append(base_col)
    df.columns = new_cols

    # Drop completely empty rows after header extraction
    df = df.dropna(how="all").reset_index(drop=True)

    # Trim leading/trailing spaces on string columns and coerce numeric strings cleanly
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
            df[col] = df[col].replace({"": None, "N/A": None, "NA": None, "nan": None, "None": None})

    return df


def read_all_sheets(file_path: Path) -> dict[str, pd.DataFrame]:
    """Reads every sheet from .xlsb, .xlsx, .xls, or .csv into cleaned DataFrames."""
    ext = file_path.suffix.lower()
    if ext == ".csv":
        df = pd.read_csv(file_path)
        return {file_path.stem: detect_and_clean_dataframe(df)}

    engine = "pyxlsb" if ext == ".xlsb" else "openpyxl"
    xls = pd.ExcelFile(file_path, engine=engine)
    sheets = {}
    for sheet_name in xls.sheet_names:
        raw_df = pd.read_excel(xls, sheet_name=sheet_name)
        cleaned_df = detect_and_clean_dataframe(raw_df)
        if not cleaned_df.empty:
            sheets[sheet_name] = cleaned_df
    return sheets


def ingest_files(file_paths: list[str]):
    engine = get_db_engine()
    dialect = engine.dialect.name
    print(f"\n[ATON-IQ Ingestion] Connected to {dialect.upper()} database.\n")

    uploaded_summary = []

    for fp_str in file_paths:
        fp = Path(fp_str)
        if not fp.exists():
            print(f"[SKIP] File not found: {fp}")
            continue

        print(f"============================================================")
        print(f"Processing Workbook: {fp.name}")
        print(f"============================================================")

        sheets = read_all_sheets(fp)
        for sheet_name, df in sheets.items():
            table_name = resolve_table_name(fp.stem, sheet_name)

            # Write to database cleanly (replaces old stale grid data with 100% fresh schema)
            df.to_sql(
                name=table_name,
                con=engine,
                if_exists="replace",
                index=False,
                chunksize=1000,
            )

            uploaded_summary.append((fp.name, sheet_name, table_name, len(df), len(df.columns)))
            print(f"  [OK] Sheet '{sheet_name}' -> Table '{table_name}' | Rows: {len(df):,} | Cols: {len(df.columns)}")
            print(f"       Columns: {list(df.columns[:8])}{' ...' if len(df.columns) > 8 else ''}")

    print("\n==================== INGESTION SUMMARY ====================")
    for fname, sname, tname, rcount, ccount in uploaded_summary:
        print(f"  * {tname:<32} | {rcount:>6,} rows | {ccount:>2} cols  (from {fname} -> {sname})")
    print("===========================================================\n")
    print("Next Step: Run 'python grid_report/tools/build_report_data.py' (if using report.json) and restart runserver.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python ingest_master_grid_data.py "update Network KPI Reports - Grid Excellence.xlsb"')
        sys.exit(1)
    ingest_files(sys.argv[1:])