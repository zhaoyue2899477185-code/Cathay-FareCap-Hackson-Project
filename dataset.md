# Dataset Inventory

**Snapshot date:** 2026-10-20  
**Data scope:** Cathay-operated round-trip Economy from Hong Kong, one adult  
**Data tiers:** A = official primary disclosure; B = direct calculation from official data; C = proxy based on official data; D = policy assumption

## 1. Main Datasets

| ID | File | Rows | Fields | Source | Purpose | Tier |
|---|---|---:|---|---|---|---|
| D1 | `data/cathay_daily_fares_jan2027.csv` | 68 | `route,date,fare_hkd` | Cathay official route fare pages | Estimate $\sigma_d$ and $\sigma_{72}$ | A |
| D2 | `data/cathay_monthly_fares.csv` | 27 | `route,month,fare_hkd` | Cathay official route fare pages | Monthly cross-section validation and long-haul reference | A |
| D3 | `data/miles_value_cases.csv` | 5 | `route,cash_return_hkd,award_one_way_miles,award_return_miles,gross_hkd_per_mile,tax_haircut,net_hkd_per_mile` | Cathay route fare pages + Asia Miles award pages | Calibrate $v_m$ | A/B |
| D4 | `data/final_parameter_table.csv` | 4 | Route, $P_1$, $\sigma_d$, $\sigma_{72}$, $C$, $P_{\min}$, $P_{\max}$, $K$, payout probability, and related fields | D1, D3, and policy parameters | Final route-level parameters | B/C |
| D5 | `data/k_schedule.csv` | 20 | `route,p1,p0,p0_ratio,fee,fee_ratio,payout_prob,expected_miles` | D4 and simulation | $K(P_0)$ menu samples | B/C |
| D6 | `data/calibrated_parameters.csv` | 13 | Parameter, value, unit, status, method | Model summary | Global parameter index | B/C/D |

## 2. Primary Observation Subsets

### D1 Daily Fares

- Routes: HKG–TYO, HKG–TPE, HKG–BKK, and HKG–SIN.
- Observation window: 2027-01-01 through 2027-01-17.
- Each route has 17 departure dates, for a total of $4\times17=68$ rows.
- Basis: lowest round-trip Economy fare from the Cathay official Fare Finder for one adult, including taxes and carrier-imposed surcharges.
- Use: calculate adjacent-date log price differences as a public-data proxy for 72-hour price volatility.

### D2 Monthly Fares

- Routes: HKG–TYO, HKG–TPE, HKG–BKK, HKG–SIN, HKG–SYD, and HKG–LON.
- Months: 2026-10 through 2027-04; the available months depend on the official page.
- Rows: 27.
- Use: check long-run cross-sectional differences, especially the seasonal/monthly jumps on SYD and LON.

### D3 Miles Value Sample

Five routes used to estimate $v_m$:

| Route | Cash round-trip fare HKD | One-way award miles | Return award miles | Gross value HKD/mile | After 20% tax/surcharge haircut |
|---|---:|---:|---:|---:|---:|
| HKG–TPE | 1,895 | 7,000 | 14,000 | 0.1354 | 0.1083 |
| HKG–ALA | 4,089 | 13,000 | 26,000 | 0.1573 | 0.1258 |
| HKG–SYD | 4,886 | 20,000 | 40,000 | 0.1222 | 0.0977 |
| HKG–SFO | 7,064 | 27,000 | 54,000 | 0.1308 | 0.1047 |
| HKG–YVR | 7,925 | 27,000 | 54,000 | 0.1468 | 0.1174 |

The mean net value is $v_m=0.1108$ HKD/mile, rounded to **0.11 HKD/mile**.

## 3. Calibration and Scenario Data

| ID | File | Rows | Purpose |
|---|---|---:|---|
| D7 | `data/pooled_calibration_table.csv` | 4 | Baseline calibration using pooled volatility |
| D8 | `data/scenario_table.csv` | 48 | Scenarios for $\rho\in\{0.25,0.50,0.75,1.00\}$ and $\kappa\in\{2\%,3\%,5\%\}$ |
| D9 | `data/lambda_scenario_table.csv` | 24 | Sensitivity to risk-loading parameter $\lambda$ |
| D10 | `data/coverage_scenario_table.csv` | 16 | Sensitivity to coverage ratio $\rho$ |
| D11 | `data/final_calibration.json` | 1 | Machine-readable version of the final parameters |

## 4. Official Source Files

| ID | File/Page | Purpose |
|---|---|---|
| S1 | `sources/cx_2025_annual_report_en.pdf` | Cathay annual financial and loyalty-programme disclosures |
| S2 | Cathay Hold Your Fare page and terms | $T_s=72$ hours and the at-least-168-hours-before-departure restriction |
| S3 | Cathay route fare pages | $P_1$, D1, D2 |
| S4 | Cathay Asia Miles award pages | Award-mile samples |

## 5. Data Quality Notes

- **Tier A:** Cathay official live fares, Cathay annual report, and official Asia Miles award pages.
- **Tier B:** Direct calculations from official data, such as $v_m$ and $\sigma_d$.
- **Tier C:** Proxies used because public data are missing, such as $c_m$ and the short-window mapping for $\sigma_{72}$.
- **Tier D:** Policy assumptions, such as $\kappa$, $\pi$, and $c_a+c_f$.

The most important limitation is that no Cathay internal hourly historical quote panel was available. D1 is an official price cross-section across departure dates, not a time series for the same departure date. The model is therefore reproducible and suitable for a Hackathon prototype and directional decisions, but $\sigma_{72}$ must be re-estimated from an internal quote panel before production.
