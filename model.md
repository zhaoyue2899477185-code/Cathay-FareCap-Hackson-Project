# Fare Cap Miles Protection Model V1.0

**Snapshot date:** 2026-10-20  
**Pilot scope:** Hong Kong origin, Cathay-operated, round-trip Economy, one adult, at least 168 hours before departure  
**Protection window:** $T_s=t_0+72$ hours  
**Model nature:** Neutral mathematical contract; this document does not introduce legal, regulatory, tax, or accounting constraints

---

## 1. Model Object

A passenger pays a protection fee $K(P_0)$ at $t_0$ and chooses an integer HKD protection price $P_0$. At $T_s$, the official available price $P_T$ for the same ticket is observed. If the passenger completes the ticket purchase and $P_T>P_0$, Cathay pays Asia Miles based on the difference. If $P_T\le P_0$ or the passenger does not complete the purchase, no miles are paid and $K(P_0)$ is retained.

$P_0$ is the contract strike price, not the predicted mean. The predicted mean is denoted $E[P_T]$, and the two must not be confused.

## 2. Price Definition

$P_t$ is the lowest publicly available price on Cathay's official channel for the same route, cabin, Fare Family, passenger mix, and round-trip conditions for one adult. The price includes taxes and carrier-imposed surcharges and excludes optional services such as seat selection, baggage, and meals.

This version uses the lowest round-trip Economy fare on Cathay's official fare pages as $P_1$. Daily prices use the same round-trip basis shown in the official fare chart; the specific return-stay duration must be fixed in the production system.

## 3. Terminal Price Distribution

Let

$$
Z\sim N(0,1),
$$

$$
R=\exp\left(-\frac{1}{2}\sigma_{72}^2+\sigma_{72}Z\right),
$$

$$
P_T=P_1R.
$$

This specification ensures $E[R]=1$, so the model does not introduce an additional price drift; $\sigma_{72}$ represents 72-hour price uncertainty.

$\sigma_{72}$ is estimated from adjacent log differences in the official daily fare cross-section:

$$
\Delta_{r,d}=\ln P_{r,d+1}-\ln P_{r,d},
$$

$$
\sigma_{d,r}=\operatorname{sd}(\Delta_{r,d}),
$$

$$
\sigma_{72,r}=\sigma_{d,r}\sqrt{3}.
$$

This is a short-window volatility proxy under public-data constraints, not a complete Cathay historical quote panel.

## 4. Payoff Function

Define the compensable difference as

$$
D(P_0,P_T)=\min\left(\max(P_T-P_0,0),C\right).
$$

Define the miles payout as

$$
M(P_0,P_T)=
\begin{cases}
\min\left(\left\lfloor\dfrac{\rho D(P_0,P_T)}{v_m}\right\rfloor,M_{\max}\right),
& \text{if the ticket purchase is completed},\\[6pt]
0,& \text{otherwise}.
\end{cases}
$$

This version uses

$$
\rho=1.0,
$$

$$
M_{\max}=\frac{C}{v_m}.
$$

Therefore, the payout covers the fare difference up to $C$. The passenger's effective price is

$$
P_{\mathrm{eff}}=P_T-v_mM.
$$

When $P_0<P_T\le P_0+C$, $P_{\mathrm{eff}}\approx P_0$.

## 5. Protection Fee Function

The protection fee is defined as

$$
K(P_0)=c_mE[M(P_0,P_T)]+0.005P_1+0.10\,\sigma(M(P_0,P_T))+0.005P_1.
$$

Where:

- $c_mE[M]$ is the expected miles fulfilment cost;
- $0.005P_1$ is the claims and fixed operating cost;
- $0.10\,\sigma(M)$ is the risk loading;
- $0.005P_1$ is the target profit.

The constraint is

$$
K(P_0)\le \kappa P_1=0.03P_1.
$$

Because $E[M]$ decreases as $P_0$ increases, $K(P_0)$ is non-increasing. The feasible protection prices are

$$
P_0\in\{P_{\min},P_{\min}+1,\ldots,P_{\max}\},
$$

where

$$
P_{\min}=\min\left\{p\in\mathbb{Z}:K(p)\le0.03P_1\right\}.
$$

If no integer satisfies the condition, protection is not offered.

## 6. Price Cap and Payout Cap

The maximum compensable difference per passenger is

$$
C=\min\left(
\left\lceil\frac{Q_{0.95}\left((P_T-P_1)^+\right)}{10}\right\rceil 10,
0.60P_1
\right).
$$

The maximum selectable protection price is

$$
P_{\max}=\left\lceil P_1\min\left(
\exp\left(-\frac{1}{2}\sigma_{72}^2+2.326\sigma_{72}\right),
2.0
\right)\right\rceil.
$$

## 7. Passenger Choice

Under the risk-neutral baseline, the passenger chooses

$$
P_0^*=\arg\max_{P_0\in\{P_{\min},\ldots,P_{\max}\}}
\left\{
E\left[v_mM(P_0,P_T)\right]-K(P_0)
\right\}.
$$

Because $K(P_0)$ is non-increasing, the passenger trades a higher $P_0$ for a lower protection fee while accepting a higher deductible.

## 8. Global Calibrated Parameters

| Parameter | Calibrated value | Unit | Basis |
|---|---:|---|---|
| $T_s$ | 72 | hours | Official Cathay Hold Your Fare terms |
| $\rho$ | 1.00 | dimensionless | Full miles coverage up to $C$ |
| $\kappa$ | 0.03 | $K/P_1$ | Fare-ratio cap |
| $\lambda$ | 0.10 | dimensionless | Sets risk loading at approximately $0.5\%P_1$, in the same order as target profit |
| $v_m$ | 0.11 | HKD/mile | Mean net award value across five official routes |
| $c_m$ | 0.08 | HKD/mile | Cathay loyalty-programme recognition/deferral ratio $0.740$ multiplied by $v_m$ |
| $c_a+c_f$ | $0.005P_1$ | HKD | Modelling assumption for claims and fixed operating cost |
| $\pi$ | $0.005P_1$ | HKD | Target profit |
| Price distribution | Lognormal | Model | Mean-preserving terminal price model |

## 9. Route-Level Calibration Results

| Route | $P_1$ | $\sigma_d$ | $\sigma_{72}$ | $C$ | $C/P_1$ | $P_{\min}$ | $P_{\min}/P_1$ | $P_{\max}$ | $P_{\max}/P_1$ | $M_{\max}$ | $K(P_{\min})$ | $K/P_1$ | Payout probability | Expected payout / protection fee |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HKG–TYO | 3,890 | 14.31% | 24.78% | 1,770 | 45.50% | 5,025 | 1.2918 | 6,694 | 1.7208 | 16,090 | 116.67 | 3.00% | 12.26% | 49.17% |
| HKG–TPE | 1,895 | 3.79% | 6.56% | 220 | 11.61% | 1,898 | 1.0016 | 2,201 | 1.1615 | 2,000 | 56.82 | 3.00% | 47.55% | 58.15% |
| HKG–BKK | 2,646 | 7.95% | 13.76% | 640 | 24.19% | 2,881 | 1.0888 | 3,605 | 1.3624 | 5,818 | 79.21 | 2.99% | 24.48% | 53.86% |
| HKG–SIN | 3,134 | 11.94% | 20.68% | 1,170 | 37.33% | 3,781 | 1.2064 | 4,951 | 1.5798 | 10,636 | 93.99 | 3.00% | 15.47% | 50.81% |

$K(P_{\min})$ is the protection fee at the left edge of the feasible interval; $K(P_0)$ decreases as $P_0$ increases.

## 10. $K(P_0)$ Examples

| Route | $P_0$ | $P_0/P_1$ | $K(P_0)$ | $K/P_1$ | Payout probability |
|---|---:|---:|---:|---:|---:|
| HKG–TYO | 5,025 | 1.2918 | 116.67 | 3.00% | 12.26% |
| HKG–TYO | 5,442 | 1.3990 | 85.07 | 2.19% | 6.86% |
| HKG–TYO | 5,860 | 1.5064 | 66.38 | 1.71% | 3.73% |
| HKG–TYO | 6,277 | 1.6136 | 55.43 | 1.43% | 2.00% |
| HKG–TYO | 6,694 | 1.7208 | 49.14 | 1.26% | 1.00% |
| HKG–TPE | 1,898 | 1.0016 | 56.82 | 3.00% | 47.55% |
| HKG–TPE | 1,974 | 1.0417 | 36.71 | 1.94% | 25.48% |
| HKG–TPE | 2,050 | 1.0818 | 26.07 | 1.38% | 10.82% |
| HKG–TPE | 2,125 | 1.1214 | 21.56 | 1.14% | 3.72% |
| HKG–TPE | 2,201 | 1.1615 | 19.84 | 1.05% | 1.00% |

The full 20-row $K(P_0)$ menu is in `data/k_schedule.csv`.

## 11. Operating Algorithm

1. Read the current official eligible fare $P_1$.
2. Read or update the route-level $\sigma_{72}$.
3. Compute $C$, $P_{\max}$, and $M_{\max}$.
4. Compute $K(P_0)$ for every integer $P_0\in[P_{\min},P_{\max}]$.
5. Display $P_1$, $P_0$, $K(P_0)$, $C$, $\rho$, $T_s$, and the payout rules.
6. The passenger selects $P_0$ and pays $K(P_0)$.
7. Observe $P_T$ at $t_0+72$ hours and verify that the same passenger and itinerary completed the purchase.
8. If $P_T>P_0$, pay $M(P_0,P_T)$ miles; otherwise pay zero miles.
9. Record realised payouts, trigger rates, loss ratios, and model errors.

## 12. Model Boundaries

- Sold-out states are not considered; an eligible price is assumed to be available at $T_s$.
- Early exercise is not allowed; only $P_1$ and $P_T$ are used.
- $P_0$ is an integer HKD amount and $P_0\ge\lceil P_1\rceil$.
- Payout requires a completed ticket purchase; no purchase means no payout and no refund of the protection fee.
- Prices are standardised to Hong Kong origin, Cathay-operated, round-trip Economy, one adult.
- Cathay's official Hold Your Fare terms confirm the 72-hour window and the at-least-168-hours-before-departure restriction. This project uses a "price cap plus miles compensation" contract, not the official fixed-fare hold product.

## 13. Main Limitations

1. Public data do not include a Cathay hourly historical quote panel; $\sigma_{72}$ is a proxy derived from the official daily fare cross-section and should be replaced with an internal quote panel before production.
2. Daily prices are a cross-section across different departure dates, not a historical time series for one departure date.
3. Public data can only provide an accounting proxy for $c_m$; the true marginal fulfilment cost must be replaced with Cathay internal data.
4. $c_a+c_f$, $\pi$, and $\kappa$ are policy parameters, not public market observations.
5. This version does not model demand elasticity, cancellations, fraud, tax changes, or sold-out states.
6. The model does not make legal, regulatory, tax, or accounting determinations.

## 14. Delivery Data

- `data/cathay_daily_fares_jan2027.csv`: 68 official daily fare observations across four routes.
- `data/cathay_monthly_fares.csv`: 27 official monthly lowest fares across six routes.
- `data/miles_value_cases.csv`: Five official route samples for award value.
- `data/final_parameter_table.csv`: Final parameters for four routes.
- `data/k_schedule.csv`: 20 $K(P_0)$ menu samples.
- `data/calibrated_parameters.csv`: Global parameter table.
