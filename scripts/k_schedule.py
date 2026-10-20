import math
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(r"C:\Users\28994\Documents\ChatGPT\Hackson1")
WORK = ROOT / "work"
final = pd.read_csv(WORK / "final_parameter_table.csv")
daily = pd.read_csv(WORK / "cathay_daily_fares_jan2027.csv")

v_m = 0.11
c_m = 0.08
rho = 1.0
admin_ratio = 0.005
profit_ratio = 0.005
lam = 0.10
rng = np.random.default_rng(20261020)
z = rng.standard_normal(100_000)

rows = []
for _, rec in final.iterrows():
    code = rec["route"]
    p1 = float(rec["p1"])
    sigma_day = float(rec["sigma_day"])
    sigma_72 = sigma_day * math.sqrt(3.0)
    c_cap = float(rec["c_cap"])
    p_min = int(rec["p0_min"])
    p_max = int(rec["p0_max"])
    price_mult = np.exp(-0.5 * sigma_72**2 + sigma_72 * z)
    p_t = p1 * price_mult
    points = sorted(set([
        p_min,
        int(round(p_min + 0.25 * (p_max - p_min))),
        int(round(p_min + 0.50 * (p_max - p_min))),
        int(round(p_min + 0.75 * (p_max - p_min))),
        p_max,
    ]))
    for p0 in points:
        difference = np.minimum(np.maximum(p_t - p0, 0.0), c_cap)
        miles = np.minimum(np.floor(rho * difference / v_m), c_cap / v_m)
        loss = c_m * miles
        expected_loss = float(np.mean(loss))
        sigma_loss = float(np.std(loss, ddof=1))
        fee = expected_loss + admin_ratio * p1 + lam * sigma_loss + profit_ratio * p1
        rows.append({
            "route": code,
            "p1": p1,
            "p0": p0,
            "p0_ratio": p0 / p1,
            "fee": fee,
            "fee_ratio": fee / p1,
            "payout_prob": float(np.mean(difference > 0)),
            "expected_miles": float(np.mean(miles)),
        })

df = pd.DataFrame(rows)
df.to_csv(WORK / "k_schedule.csv", index=False)
print(df.to_string(index=False))
