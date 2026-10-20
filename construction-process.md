# Model Construction Process

## 1. Objectives and Scope

The objective is to obtain a directly computable set of parameters such that the model satisfies three conditions:

1. The protection fee $K$ does not exceed 3% of the fare.
2. The protection price $P_0$ can be selected continuously by the passenger at 1 HKD granularity.
3. Within the 72-hour window, payouts, risk loading, operating costs, and target profit can all be explained together.

The pilot scope is limited to Hong Kong origin, Cathay-operated, round-trip Economy, one adult, and at least 168 hours before departure.

## 2. Data Collection

### 2.1 Fares

On 2026-10-20, the following Cathay official route pages were read:

- HKG–TYO;
- HKG–TPE;
- HKG–BKK;
- HKG–SIN.

The daily lowest fares from 2027-01-01 through 2027-01-17 were extracted from each page's Economy fare chart, for a total of 68 observations. Monthly lowest fares for six routes were also extracted for cross-sectional validation.

Fare basis:

- Round trip;
- One adult;
- Economy;
- Cathay official Fare Finder;
- Including taxes and carrier-imposed surcharges;
- Excluding optional services such as seat selection and baggage.

### 2.2 Time Window

The official Cathay Hold Your Fare terms provide a 72-hour holding period and an at-least-168-hours-before-departure restriction. The model uses

$$
T_s=t_0+72\text{ hours}.
$$

### 2.3 Miles Value

One-way award miles for five routes were read from the Asia Miles award page, and the corresponding cash round-trip fares were read from the Cathay route pages:

| Route | Cash round-trip HKD | One-way award miles |
|---|---:|---:|
| HKG–TPE | 1,895 | 7,000 |
| HKG–ALA | 4,089 | 13,000 |
| HKG–SYD | 4,886 | 20,000 |
| HKG–SFO | 7,064 | 27,000 |
| HKG–YVR | 7,925 | 27,000 |

Because award miles exclude taxes, the calculation first obtains gross value and then applies a 20% tax/surcharge haircut:

$$
v_{m,r}^{\text{gross}}=
\frac{P_{\text{cash,return},r}}{2M_{\text{award,one-way},r}},
$$

$$
v_{m,r}^{\text{net}}=0.80v_{m,r}^{\text{gross}}.
$$

The result is

$$
\bar v_m^{\text{net}}=0.1108\ \text{HKD/mile}.
$$

The final value is

$$
v_m=0.11\ \text{HKD/mile}.
$$

### 2.4 Loyalty-Programme Cost

The Cathay 2025 Annual Report discloses:

$$
\text{deferral}=4,768\text{ HK\$m},
$$

$$
\text{recognition}=3,529\text{ HK\$m}.
$$

Define the accounting proxy factor

$$
\eta=\frac{3,529}{4,768}=0.7401.
$$

Then

$$
c_m=\eta v_m=0.7401\times0.11=0.0814\approx0.08\ \text{HKD/mile}.
$$

This is a proxy, not Cathay's true internal marginal cost.

## 3. Price Volatility Estimation

For each route, the official daily fares are sorted by departure date:

$$
P_{r,1},P_{r,2},\ldots,P_{r,17}.
$$

Calculate adjacent log differences:

$$
\Delta_{r,d}=\ln P_{r,d+1}-\ln P_{r,d}.
$$

Estimate daily volatility:

$$
\sigma_{d,r}=\operatorname{sd}(\Delta_{r,d}).
$$

Then apply square-root-of-time scaling to obtain 72-hour volatility:

$$
\sigma_{72,r}=\sigma_{d,r}\sqrt{3}.
$$

Results:

| Route | $\sigma_d$ | $\sigma_{72}$ |
|---|---:|---:|
| HKG–TYO | 0.1431 | 0.2478 |
| HKG–TPE | 0.0379 | 0.0656 |
| HKG–BKK | 0.0795 | 0.1376 |
| HKG–SIN | 0.1194 | 0.2068 |

## 4. Terminal Price Model

Use a mean-preserving lognormal model:

$$
Z\sim N(0,1),
$$

$$
R=\exp\left(-\frac{1}{2}\sigma_{72}^2+\sigma_{72}Z\right),
$$

$$
P_T=P_1R.
$$

Use 100,000 simulated paths to compute expected payouts, risk loading, $P_{\min}$, $P_{\max}$, and $K(P_0)$.

## 5. Payout Cap and Selectable Interval

Maximum compensable difference per passenger:

$$
C=\min\left(
\left\lceil\frac{Q_{0.95}\left((P_T-P_1)^+\right)}{10}\right\rceil 10,
0.60P_1
\right).
$$

Maximum selectable protection price:

$$
P_{\max}=\left\lceil P_1\min\left(
\exp\left(-\frac{1}{2}\sigma_{72}^2+2.326\sigma_{72}\right),
2.0
\right)\right\rceil.
$$

Final parameters:

| Route | $C$ | $C/P_1$ | $P_{\max}$ |
|---|---:|---:|---:|
| HKG–TYO | 1,770 | 45.50% | 6,694 |
| HKG–TPE | 220 | 11.61% | 2,201 |
| HKG–BKK | 640 | 24.19% | 3,605 |
| HKG–SIN | 1,170 | 37.33% | 4,951 |

## 6. Protection Fee and Feasible Lower Bound

Protection fee:

$$
K(P_0)=c_mE[M]+0.005P_1+0.10\sigma(M)+0.005P_1.
$$

Constraint:

$$
K(P_0)\le0.03P_1.
$$

Compute $K(P_0)$ for every integer $P_0$ and take the smallest feasible integer:

$$
P_{\min}=\min\{p\in\mathbb{Z}:K(p)\le0.03P_1\}.
$$

Final results:

| Route | $P_{\min}$ | $P_{\min}/P_1$ | $K(P_{\min})$ | $K/P_1$ | Payout probability | Expected loss / protection fee |
|---|---:|---:|---:|---:|---:|---:|
| HKG–TYO | 5,025 | 1.2918 | 116.67 | 3.00% | 12.26% | 49.17% |
| HKG–TPE | 1,898 | 1.0016 | 56.82 | 3.00% | 47.55% | 58.15% |
| HKG–BKK | 2,881 | 1.0888 | 79.21 | 2.99% | 24.48% | 53.86% |
| HKG–SIN | 3,781 | 1.2064 | 93.99 | 3.00% | 15.47% | 50.81% |

## 7. Risk-Loading Parameter

The final value is

$$
\lambda=0.10.
$$

At $P_0=P_{\min}$, this makes the risk loading approximately $0.5\%P_1$, in the same order as target profit.

Sensitivity:

- $\lambda=0$: zero risk loading, lower $P_{\min}$, and a higher payout probability;
- $\lambda=0.25$: higher risk loading, higher $P_{\min}$, and a lower payout probability;
- $\lambda=0.50$: more conservative protection; some high-volatility routes are only viable with a very high deductible.

The full results are in `data/lambda_scenario_table.csv`.

## 8. Parameter Audit

At $P_0=P_{\min}$, the protection fee can be decomposed as

$$
K=
\underbrace{c_mE[M]}_{\text{expected payout}}
+\underbrace{0.005P_1}_{\text{operations}}
+\underbrace{0.10\sigma(M)}_{\text{risk}}
+\underbrace{0.005P_1}_{\text{profit}}.
$$

Actual decomposition for the four routes:

| Route | Expected payout/$P_1$ | Risk/$P_1$ | Operations/$P_1$ | Profit/$P_1$ | Total/$P_1$ |
|---|---:|---:|---:|---:|---:|
| HKG–TYO | 1.47% | 0.52% | 0.50% | 0.50% | 3.00% |
| HKG–TPE | 1.74% | 0.25% | 0.50% | 0.50% | 3.00% |
| HKG–BKK | 1.61% | 0.38% | 0.50% | 0.50% | 2.99% |
| HKG–SIN | 1.52% | 0.48% | 0.50% | 0.50% | 3.00% |

## 9. Validation

### 9.1 Consistency

- $K(P_0)$ decreases as $P_0$ increases;
- $P_{\min}\ge P_1$;
- $P_{\max}>P_{\min}$;
- $M_{\max}=C/v_m$;
- all $P_0$ values are integer HKD amounts;
- for all four routes, $K(P_{\min})/P_1$ is approximately 3.00%.

### 9.2 Price Distribution

- HKG–TPE has the lowest daily volatility, so $P_{\min}$ is almost equal to the current fare and the payout probability is highest;
- HKG–TYO has the highest daily volatility, so it requires a higher deductible and has the lowest payout probability;
- HKG–BKK and HKG–SIN lie between the two, consistent with the official fare cross-section.

### 9.3 Economic Interpretation

- The protection fee is not a fixed "profit margin"; it is the sum of expected payout, risk, operations, and profit;
- high-volatility routes cannot offer full coverage with the same low deductible;
- if the business requires $P_{\min}$ to be closer to $P_1$, it must raise $\kappa$, lower $\rho$, or lower $\lambda$.

## 10. Reproduction

Run from the project root:

```powershell
python work/final_calibration.py
python work/k_schedule.py
python work/scenarios.py
python work/lambda_scenarios.py
python work/coverage_scenarios.py
```

Output files:

- `final_parameter_table.csv`
- `k_schedule.csv`
- `scenario_table.csv`
- `lambda_scenario_table.csv`
- `coverage_scenario_table.csv`

## 11. Inputs to Replace Before Production

1. Replace the daily cross-section with Cathay's internal hourly quote panel and re-estimate $\sigma_{72}$.
2. Replace $c_m$ with internal Asia Miles fulfilment cost, breakage, and redemption-mix data.
3. Replace the $0.005P_1$ operating cost with actual claims and customer-service costs.
4. Calibrate $\kappa$ and $\pi$ using demand elasticity and conversion tests.
5. Add sold-out states, refunds, chargebacks, tax changes, and abnormal-quote handling.
6. Have Legal, Finance, and the loyalty team complete the product characterisation; this is not treated as a mathematical constraint in this version.
