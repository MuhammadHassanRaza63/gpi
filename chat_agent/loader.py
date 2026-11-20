"""Loads the chatbot's Excel sources into plain SQL tables (the tables the Text-to-SQL engine queries).

Pure pandas, no Django imports, so it works from the management command and from a bare script.
`target` is either a sqlite3 connection or a SQLAlchemy engine (anything pandas.DataFrame.to_sql accepts).
Table names are the same ones the chatbot prompts refer to.
"""
import os

import pandas as pd

OFC_FILE = "OFC_Breaks_Detail_2025_2026_Merged.xlsx"
AVAIL_FILE = "Network_Availability_with_LS_Jan25_-_Oct26_LABELED.xlsx"
RCTO_FILE = "Central-RCTO.xlsx"
GRID_FILE = "Network_KPI_Reports_-_Grid_Excellence_UPDATED.xlsx"

# Excel sheet -> SQL table for the 13 Grid Excellence KPI sheets
GRID_SHEETS = {
    'Fuel Summary': 'grid_fuel_summary',
    'Tracker': 'grid_tracker',
    'Not Operational DGs': 'grid_not_operational_dgs',
    '2 Phase Missing': 'grid_two_phase_missing',
    'Fluctuated Sites': 'grid_fluctuated_sites',
    'Down Cells': 'grid_down_cells',
    'Zero Traffic': 'grid_zero_traffic',
    'VSWR': 'grid_vswr',
    'High TempAlm': 'grid_high_temp_alm',
    'T Prime': 'grid_t_prime',
    'E-Band Availability': 'grid_eband_availability',
    'RSL Deviation Link': 'grid_rsl_deviation_link',
    'TXN Critical Alarms': 'grid_txn_critical_alarms',
}


def _clean_columns(df):
    df.columns = [str(c).strip().lower().replace(' ', '_').replace('/', '_').replace('-', '_')
                  .replace('(', '').replace(')', '').replace('.', '') for c in df.columns]
    return df


def load_all(target, data_dir, log=print):
    """Replace every chatbot table from the Excel files in data_dir. Returns {table: row_count}."""
    counts = {}

    def put(df, table):
        df.to_sql(table, target, if_exists='replace', index=False)
        counts[table] = len(df)
        log(f'  {table}: {len(df):,} rows')

    log('OFC breaks')
    d = _clean_columns(pd.read_excel(os.path.join(data_dir, OFC_FILE), sheet_name='Data'))
    d.rename(columns={'cmpak_event#___s#': 'cmpak_event_id',
                      'single_dual_power_detail_2026_only': 'single_dual_power_detail'}, inplace=True)
    put(d, 'chat_agent_ofcbreak')

    log('Network availability')
    d = _clean_columns(pd.read_excel(os.path.join(data_dir, AVAIL_FILE), sheet_name='data'))
    put(d, 'chat_agent_networkavailability')

    log('RCTO complaints')
    d = _clean_columns(pd.read_excel(os.path.join(data_dir, RCTO_FILE), sheet_name='Sheet1',
                                     dtype={'SN': str, 'MSISDN': str}))
    put(d, 'chat_agent_rctocomplaint')

    log('Grid Excellence KPI sheets')
    xls = pd.ExcelFile(os.path.join(data_dir, GRID_FILE))
    for sheet, table in GRID_SHEETS.items():
        if sheet in xls.sheet_names:
            d = pd.read_excel(xls, sheet_name=sheet)
            d.columns = [str(c).strip() for c in d.columns]
            put(d, table)
    return counts
