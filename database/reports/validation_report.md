# 🛡️ SmartThings IoT Dataset Validation Report

- **File Inspected**: `database/processed/energy_usage_clean.csv`
- **Validation Execution Time**: `2026-07-15 23:32:00 UTC`
- **Overall Dataset Status**: ✅ PASSED
- **Firebase Deployment Readiness**: **READY FOR FIREBASE UPLOAD**

---

## 1. Summary Metrics & Dimensions

| Inspection Metric | Validated Result | Operational Threshold | Status |
|---|---|---|:---:|
| **Total Row Count** | **21,600** | Exactly 21,600 | ✅ PASSED |
| **Total Column Count** | **26** | Exactly 26 | ✅ PASSED |
| **Monitored Appliances** | **30** | Exactly 30 devices | ✅ PASSED |
| **Monitored Rooms** | **6** | Exactly 6 rooms | ✅ PASSED |
| **30-Day Total Energy Draw** | **1,348.7466 kWh** | Expected ~1348 kWh | ✅ PASSED |
| **30-Day Household Expenditure** | **₹9,435.56** | TNEB Rate (₹7.00/kWh) | ✅ PASSED |
| **Average Daily Cost** | **₹314.52 / day** | ~₹314.50/day | ✅ PASSED |

---

## 2. Comprehensive 10-Point Integrity Audit

### Check 1: Missing Values
- **Null / NaN Count**: `0`
- **Evaluation**: 0 Missing values detected across all 26 feature columns.
- **Status**: ✅ **PASSED**

### Check 2: Duplicate Rows
- **Duplicate Rows**: `0`
- **Timestamp-Appliance Collisions**: `0`
- **Status**: ✅ **PASSED**

### Check 3: Timestamp Validity
- **Invalid Datetime Strings**: `0`
- **ISO 8601 Compliance**: 100% `YYYY-MM-DDTHH:MM:SSZ` compliant.
- **Status**: ✅ **PASSED**

### Check 4: Appliance ID Validity
- **Invalid Appliance IDs**: `0`
- **Prefix Standard**: All IDs start with valid room prefixes (`LR_`, `BR1_`, `BR2_`, `KIT_`, `BATH_`, `TOILET_`).
- **Status**: ✅ **PASSED**

### Check 5: Room ID Validity
- **Invalid Room IDs**: `0`
- **Allowed Room IDs**: Verified strict match against `ROOM001` through `ROOM006`.
- **Status**: ✅ **PASSED**

### Check 6: Runtime Validity
- **Runtime Discrepancies**: `0`
- **Bounded Interval**: All runtime values are strictly integer bounded within `[0, 60]` minutes.
- **Status**: ✅ **PASSED**

### Check 7: Status Validity
- **Invalid Status Tokens**: `0`
- **State Validation**: Every status token is strictly categorized as `"ON"` or `"OFF"`. When `runtime_minutes == 0`, status is 100% guaranteed as `"OFF"`.
- **Status**: ✅ **PASSED**

### Check 8: Threshold Validity
- **Threshold Exceeded Hours**: `3,634 hourly log flags`
- **Logic Validation**: Quota breaches correctly flag `threshold_exceeded = TRUE` whenever cumulative daily appliance consumption exceeds `daily_limit_kwh`.
- **Status**: ✅ **PASSED**

### Check 9: Energy Values & Formula Consistency
- **Negative Watt-Hours (`Wh`)**: `0`
- **Negative Kilowatt-Hours (`kWh`)**: `0`
- **Formula Discrepancies**: `0` (`Wh = Rated_Power * (Runtime / 60)`).
- **Status**: ✅ **PASSED**

### Check 10: Electricity Cost Calculations
- **Negative Cost Anomalies**: `0`
- **Tariff Application**: Cost mathematically matches `kWh * ₹7.00` across all records.
- **Status**: ✅ **PASSED**

---

## 3. Deployment Conclusion

The dataset `database/processed/energy_usage_clean.csv` has successfully satisfied all 10 mathematical and structural validation checks. It is **100% clean, structurally coherent, and fully prepared for Firebase Firestore batch import**.
