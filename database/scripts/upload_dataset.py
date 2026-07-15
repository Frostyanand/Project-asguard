import os
import sys
import time
import datetime
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore

# Setup absolute paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV_PATH = os.path.join(BASE_DIR, "processed", "energy_usage_clean.csv")
KEY_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")
LOG_PATH = os.path.join(BASE_DIR, "reports", "upload_log.txt")

BATCH_SIZE = 500
MAX_RETRIES = 3
COLLECTION_NAME = "energy_logs"

def initialize_firebase():
    print(f"Initializing Firebase Admin SDK with credentials: {KEY_PATH}")
    if not os.path.exists(KEY_PATH):
        print(f"ERROR: Service account key not found at {KEY_PATH}")
        sys.exit(1)

    if not firebase_admin._apps:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

def parse_row_to_firestore_doc(row):
    # Convert timestamp string to Python datetime object for Firestore Timestamp conversion
    raw_ts = str(row['timestamp']).rstrip('Z')
    dt_obj = datetime.datetime.fromisoformat(raw_ts)

    # Boolean parsing helper
    to_bool = lambda val: str(val).strip().upper() == 'TRUE'

    return {
        "timestamp": dt_obj,
        "date": str(row['date']),
        "hour": int(row['hour']),
        "day_of_week": str(row['day_of_week']),
        "is_weekend": to_bool(row['is_weekend']),
        "house_id": str(row['house_id']),
        "room_id": str(row['room_id']),
        "room_name": str(row['room_name']),
        "room_type": str(row['room_type']),
        "appliance_id": str(row['appliance_id']),
        "appliance_name": str(row['appliance_name']),
        "appliance_type": str(row['appliance_type']),
        "manufacturer": str(row['manufacturer']),
        "rated_power_watts": int(row['rated_power_watts']),
        "status": str(row['status']),
        "runtime_minutes": int(row['runtime_minutes']),
        "power_consumption_wh": float(row['power_consumption_wh']),
        "energy_kwh": float(row['energy_kwh']),
        "electricity_cost": float(row['electricity_cost']),
        "occupancy": to_bool(row['occupancy']),
        "ambient_temperature": float(row['ambient_temperature']),
        "weather": str(row['weather']),
        "tariff_type": str(row['tariff_type']),
        "daily_limit_kwh": float(row['daily_limit_kwh']),
        "threshold_exceeded": to_bool(row['threshold_exceeded']),
        "ai_flag": str(row['ai_flag'])
    }

def commit_batch_with_retry(db, batch_items, batch_index, total_batches):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            batch = db.batch()
            col_ref = db.collection(COLLECTION_NAME)

            for doc_id, data in batch_items:
                doc_ref = col_ref.document(doc_id)
                batch.set(doc_ref, data)

            batch.commit()
            return True, len(batch_items)
        except Exception as e:
            print(f"⚠️ [BATCH {batch_index}/{total_batches}] Attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt) # Exponential backoff
            else:
                return False, 0

def upload_dataset():
    start_time = time.time()
    
    print("=========================================================")
    print("      SMARTTHINGS FIRESTORE UPLOADER PIPELINE            ")
    print("=========================================================")
    print(f"Input Dataset: {CSV_PATH}")

    if not os.path.exists(CSV_PATH):
        print(f"ERROR: Processed CSV not found at {CSV_PATH}")
        sys.exit(1)

    db = initialize_firebase()
    df = pd.read_csv(CSV_PATH)
    total_records = len(df)
    total_batches = (total_records + BATCH_SIZE - 1) // BATCH_SIZE

    print(f"Total Rows to Upload: {total_records:,}")
    print(f"Batch Size: {BATCH_SIZE} operations per batch")
    print(f"Total Batches Planned: {total_batches}\n")

    total_uploaded = 0
    total_failed = 0
    batch_logs = []

    for batch_idx in range(1, total_batches + 1):
        start_idx = (batch_idx - 1) * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, total_records)
        chunk = df.iloc[start_idx:end_idx]

        batch_items = []
        for idx, row in chunk.iterrows():
            doc_id = f"{row['appliance_id']}_{row['timestamp']}".replace(":", "-")
            doc_data = parse_row_to_firestore_doc(row)
            batch_items.append((doc_id, doc_data))

        success, uploaded_count = commit_batch_with_retry(db, batch_items, batch_idx, total_batches)

        if success:
            total_uploaded += uploaded_count
            log_msg = f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Batch {batch_idx:02d}/{total_batches:02d} - SUCCESS: Uploaded {uploaded_count} rows ({total_uploaded}/{total_records})"
            print(log_msg)
            batch_logs.append(log_msg)
        else:
            failed_count = len(batch_items)
            total_failed += failed_count
            log_msg = f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Batch {batch_idx:02d}/{total_batches:02d} - FAILED: Failed to upload {failed_count} rows"
            print(log_msg)
            batch_logs.append(log_msg)

    duration = time.time() - start_time
    duration_str = f"{duration:.2f} seconds" if duration < 60 else f"{duration / 60.0:.2f} minutes"

    # Save upload log report
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        f.write("=== FIRESTORE DATASET UPLOAD REPORT ===\n")
        f.write(f"Execution Date   : {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"Source File      : {CSV_PATH}\n")
        f.write(f"Target Collection: {COLLECTION_NAME}\n")
        f.write(f"Total Rows       : {total_records:,}\n")
        f.write(f"Uploaded Rows    : {total_uploaded:,}\n")
        f.write(f"Failed Rows      : {total_failed:,}\n")
        f.write(f"Duration         : {duration_str}\n")
        f.write("----------------------------------------\n")
        f.write("Batch Execution Log:\n")
        for entry in batch_logs:
            f.write(entry + "\n")

    # Final Execution Metrics Output
    print("\n=========================================================")
    print("              FIRESTORE UPLOAD SUMMARY                   ")
    print("=========================================================")
    print(f"Total Uploaded Rows : {total_uploaded:,}")
    print(f"Failed Rows         : {total_failed:,}")
    print(f"Upload Duration     : {duration_str}")
    print(f"Upload Log Written  : {LOG_PATH}")
    print("=========================================================\n")

if __name__ == "__main__":
    upload_dataset()
