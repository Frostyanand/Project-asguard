import os
import sys
import pandas as pd
import numpy as np

# Absolute paths setup
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INPUT_PATH = os.path.join(BASE_DIR, "raw", "energy_usage.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, "processed", "energy_usage_clean.csv")

VALID_ROOM_IDS = {"ROOM001", "ROOM002", "ROOM003", "ROOM004", "ROOM005", "ROOM006"}
VALID_APPLIANCE_PREFIXES = ("LR_", "BR1_", "BR2_", "KIT_", "BATH_", "TOILET_")

def run_cleaning_pipeline():
    print("=========================================================")
    print("      SMARTTHINGS DATA CLEANING PIPELINE RUNNING         ")
    print("=========================================================")
    print(f"Reading Input File: {INPUT_PATH}")

    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Input file not found at {INPUT_PATH}")
        sys.exit(1)

    df_raw = pd.read_csv(INPUT_PATH)
    initial_rows = len(df_raw)
    initial_cols = len(df_raw.columns)
    print(f"Initial Dataset Dimensions: {initial_rows:,} rows x {initial_cols} columns\n")

    df = df_raw.copy()

    # Track metrics for cleaning summary
    metrics = {
        "initial_rows": initial_rows,
        "duplicates_removed": 0,
        "invalid_timestamps_removed": 0,
        "negative_energy_removed": 0,
        "negative_cost_removed": 0,
        "invalid_runtime_removed": 0,
        "invalid_appliance_ids_removed": 0,
        "invalid_room_ids_removed": 0,
    }

    # 1. Remove duplicate rows
    dups_count = df.duplicated().sum()
    if dups_count > 0:
        df = df.drop_duplicates()
    metrics["duplicates_removed"] = dups_count

    # 2. Timestamp validation and conversion to datetime
    parsed_timestamps = pd.to_datetime(df['timestamp'], errors='coerce', utc=True)
    invalid_ts_mask = parsed_timestamps.isna()
    invalid_ts_count = invalid_ts_mask.sum()
    if invalid_ts_count > 0:
        df = df[~invalid_ts_mask]
        parsed_timestamps = parsed_timestamps[~invalid_ts_mask]
    metrics["invalid_timestamps_removed"] = invalid_ts_count
    
    # Format timestamp to ISO 8601 string
    df['timestamp'] = parsed_timestamps.dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    df['date'] = pd.to_datetime(df['date'], errors='coerce').dt.strftime('%Y-%m-%d')

    # 3. Numeric conversions & non-negative filtering
    df['runtime_minutes'] = pd.to_numeric(df['runtime_minutes'], errors='coerce')
    df['power_consumption_wh'] = pd.to_numeric(df['power_consumption_wh'], errors='coerce')
    df['energy_kwh'] = pd.to_numeric(df['energy_kwh'], errors='coerce')
    df['electricity_cost'] = pd.to_numeric(df['electricity_cost'], errors='coerce')

    # Filter negative energy values
    neg_energy_mask = (df['power_consumption_wh'] < 0) | (df['energy_kwh'] < 0)
    neg_energy_count = neg_energy_mask.sum()
    if neg_energy_count > 0:
        df = df[~neg_energy_mask]
    metrics["negative_energy_removed"] = neg_energy_count

    # Filter negative electricity cost
    neg_cost_mask = df['electricity_cost'] < 0
    neg_cost_count = neg_cost_mask.sum()
    if neg_cost_count > 0:
        df = df[~neg_cost_mask]
    metrics["negative_cost_removed"] = neg_cost_count

    # 4. Verify runtime between 0 and 60 minutes
    invalid_runtime_mask = (df['runtime_minutes'] < 0) | (df['runtime_minutes'] > 60) | df['runtime_minutes'].isna()
    invalid_runtime_count = invalid_runtime_mask.sum()
    if invalid_runtime_count > 0:
        df = df[~invalid_runtime_mask]
    metrics["invalid_runtime_removed"] = invalid_runtime_count

    # 5. Standardize status values (ON/OFF)
    df['status'] = df['status'].astype(str).str.upper().str.strip()
    df['status'] = df['status'].apply(lambda s: s if s in ['ON', 'OFF'] else ('OFF' if s == '0' else 'ON'))

    # If runtime is 0, status must be OFF and energy draw must be 0
    zero_runtime_mask = df['runtime_minutes'] == 0
    df.loc[zero_runtime_mask, 'status'] = 'OFF'
    df.loc[zero_runtime_mask, 'power_consumption_wh'] = 0.0
    df.loc[zero_runtime_mask, 'energy_kwh'] = 0.0
    df.loc[zero_runtime_mask, 'electricity_cost'] = 0.0

    # 6. Standardize room names & appliance types
    df['room_name'] = df['room_name'].astype(str).str.strip()
    df['room_type'] = df['room_type'].astype(str).str.lower().str.strip()
    df['appliance_name'] = df['appliance_name'].astype(str).str.strip()
    df['appliance_type'] = df['appliance_type'].astype(str).str.lower().str.strip()
    df['manufacturer'] = df['manufacturer'].astype(str).str.strip()
    df['weather'] = df['weather'].astype(str).str.strip().str.capitalize()
    df['ai_flag'] = df['ai_flag'].astype(str).str.strip()

    # Clean appliance names (e.g. escaping quotes)
    df['appliance_name'] = df['appliance_name'].str.replace('55"', '55 Inch').str.replace('43"', '43 Inch')
    df['appliance_name'] = df['appliance_name'].str.replace('""', '"').str.strip('"')

    # 7. Verify Room IDs
    invalid_room_id_mask = ~df['room_id'].isin(VALID_ROOM_IDS)
    invalid_room_id_count = invalid_room_id_mask.sum()
    if invalid_room_id_count > 0:
        df = df[~invalid_room_id_mask]
    metrics["invalid_room_ids_removed"] = invalid_room_id_count

    # 8. Verify Appliance IDs
    valid_appliance_id_mask = df['appliance_id'].astype(str).str.startswith(VALID_APPLIANCE_PREFIXES)
    invalid_appliance_id_count = (~valid_appliance_id_mask).sum()
    if invalid_appliance_id_count > 0:
        df = df[valid_appliance_id_mask]
    metrics["invalid_appliance_ids_removed"] = invalid_appliance_id_count

    # Precision formatting
    df['power_consumption_wh'] = df['power_consumption_wh'].round(2)
    df['energy_kwh'] = df['energy_kwh'].round(4)
    df['electricity_cost'] = df['electricity_cost'].round(2)
    df['ambient_temperature'] = df['ambient_temperature'].round(1)
    df['daily_limit_kwh'] = df['daily_limit_kwh'].round(2)

    # Export cleaned dataset
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    final_rows = len(df)

    # Print Summary Report
    print("=========================================================")
    print("                DATA CLEANING SUMMARY REPORT             ")
    print("=========================================================")
    print(f"Total Initial Rows Read             : {metrics['initial_rows']:,}")
    print(f"Duplicate Rows Removed             : {metrics['duplicates_removed']:,}")
    print(f"Invalid Timestamps Dropped         : {metrics['invalid_timestamps_removed']:,}")
    print(f"Negative Energy Values Dropped      : {metrics['negative_energy_removed']:,}")
    print(f"Negative Cost Values Dropped        : {metrics['negative_cost_removed']:,}")
    print(f"Invalid Runtime Values Dropped      : {metrics['invalid_runtime_removed']:,}")
    print(f"Invalid Room IDs Dropped            : {metrics['invalid_room_ids_removed']:,}")
    print(f"Invalid Appliance IDs Dropped       : {metrics['invalid_appliance_ids_removed']:,}")
    print("---------------------------------------------------------")
    print(f"Final Cleaned Dataset Rows Exported: {final_rows:,}")
    print(f"Output Saved To                    : {OUTPUT_PATH}")
    print("=========================================================\n")

if __name__ == "__main__":
    run_cleaning_pipeline()
