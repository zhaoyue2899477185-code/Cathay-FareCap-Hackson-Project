import json
import math
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(r"C:\Users\28994\Documents\ChatGPT\Hackson1")
WORK = ROOT / "work"
current_fare = {"TYO": 3890, "TPE": 1895, "BKK": 2646, "SIN": 3134}
daily = pd.read_csv(WORK / "cathay_daily_fares_jan2027.csv")

# Final calibrated policy parameters.
TS_HOURS = 72
RHO = 1.00
KAPPA = 0.03
LAMBDA = 0.10
V_M = 0.11
C_M = 0.08
ADMIN_RATIO = 0.005
PROFIT_RATIO = 0.005
MAX_C_RATIO = 0.60

rng = np.random.default_rng(20261020)
z = rng.standard_normal(100_000)

rows = []
for code, p1 in current_fare.items():
    fares = daily.loc[daily["route"] == code, "fare_hkd"].to_numpy(float)
    sigma_day = float(np.std(np.diff(np.log(fares)), ddof=1))
    sigma_72 = sigma_day * math.sqrt(TS_HOURS / 24.0)
    price_mult = np.exp(-0.5 * sigma_72**2 + sigma_72 * z)
    p_t = p1 * price_mult
    q95_increase = float(np.percentile(np.maximum(p_t - p1, 0), 95))
    c_cap = min(q95_increase, MAX_C_RATIO * p1)
    c_cap = float(np.ceil(c_cap / 10.0) * 10.0)
    p_max_ratio = min(float(np.percentile(price_mult, 99)), 2.0)
    p_max = int(math.ceil(p1 * p_max_ratio))

    def fee_for(p0):
        difference = np.minimum(np.maximum(p_t - p0, 0.0), c_cap)
        miles = np.minimum(np.floor(RHO * difference / V_M), c_cap / V_M)
        loss = C_M * miles
        expected_loss = float(np.mean(loss))
        sigma_loss = float(np.std(loss, ddof=1))
        fee = (
            expected_loss
            + ADMIN_RATIO * p1
            + LAMBDA * sigma_loss
            + PROFIT_RATIO * p1
        )
        return fee, expected_loss, sigma_loss, miles, difference

    base_fee, _, _, _, _ = fee_for(p1)
    candidates = np.arange(int(math.ceil(p1)), p_max + 1, 5)
    p_min = None
    for candidate in candidates:
        fee, _, _, _, _ = fee_for(float(candidate))
        if fee <= KAPPA * p1:
            p_min = int(candidate)
            break
    if p_min is not None:
        for candidate in range(max(int(math.ceil(p1)), p_min - 5), p_min + 1):
            fee, _, _, _, _ = fee_for(float(candidate))
            if fee <= KAPPA * p1:
                p_min = candidate
                break

    fee, expected_loss, sigma_loss, miles, difference = fee_for(float(p_min))
    rows.append({
        "route": code,
        "p1": p1,
        "sigma_day": sigma_day,
        "sigma_72": sigma_72,
        "p0_min": p_min,
        "p0_min_ratio": p_min / p1,
        "p0_max": p_max,
        "p0_max_ratio": p_max / p1,
        "c_cap": c_cap,
        "c_cap_ratio": c_cap / p1,
        "base_fee_ratio": base_fee / p1,
        "chosen_fee": fee,
        "chosen_fee_ratio": fee / p1,
        "expected_loss": expected_loss,
        "expected_loss_ratio": expected_loss / p1,
        "loss_ratio": expected_loss / fee,
        "risk_margin": LAMBDA * sigma_loss,
        "payout_prob": float(np.mean(difference > 0)),
        "expected_miles": float(np.mean(miles)),
        "effective_price": float(np.mean(p_t - V_M * miles)),
    })

df = pd.DataFrame(rows)
df.to_csv(WORK / "final_parameter_table.csv", index=False)
summary = {
    "timestamp": "2026-10-20",
    "ts_hours": TS_HOURS,
    "rho": RHO,
    "kappa": KAPPA,
    "lambda": LAMBDA,
    "v_m": V_M,
    "c_m": C_M,
    "admin_ratio": ADMIN_RATIO,
    "profit_ratio": PROFIT_RATIO,
    "rows": df.to_dict(orient="records"),
}
(WORK / "final_calibration.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(json.dumps(summary, ensure_ascii=False, indent=2))
