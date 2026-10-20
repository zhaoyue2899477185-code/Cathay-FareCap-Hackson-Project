# Fare Cap Model: Core Formal Definition

## 1. Scope and Assumptions

- One passenger, one itinerary, one protection purchase, one settlement.
- $t_0$: protection purchase time. The fee is paid, but no ticket is issued and
  no seat is held.
- $T_s$: fixed settlement time. Early exercise is not allowed.
- $P_T$ is always observable at $T_s$; sold-out states are excluded.
- $P_t$ is the eligible price for the same itinerary, fare family, passenger mix,
  direct channel, and currency. Taxes, fees, and optional services are excluded.
- $P_0$ is an integer HKD amount. It is a contract strike, not $E[P_T]$.
- The passenger must complete the ticket purchase at $T_s$ to receive miles.
- The baseline assumes purchase is completed with probability 1; non-purchase is
  an operational exception and is not priced in this version.
- This document models a neutral contract without legal, regulatory, tax, or
  accounting constraints.

## 2. Symbols

| Symbol | Meaning |
|---|---|
| $P_1$ | Eligible price at $t_0$, per passenger |
| $P_T$ | Eligible price at $T_s$, per passenger |
| $P_0$ | Passenger-selected protection price, $P_0 \in \mathbb{Z}$ |
| $K(P_0)$ | Protection fee in HKD, per passenger |
| $C$ | Maximum compensable price difference, per passenger |
| $\rho$ | Miles coverage ratio, $0 \le \rho \le 1$ |
| $v_m$ | Passenger-perceived value per mile, HKD per mile |
| $c_m$ | Cathay expected fulfillment cost per mile, HKD per mile |
| $M$ | Miles paid, per passenger |
| $M_{\max}$ | Maximum miles paid, per passenger |
| $\kappa$ | Upper bound on $K(P_0)/P_1$ |
| $P_{\max}$ | Maximum selectable protection price |
| $P_{\min}$ | Minimum feasible protection price |
| $c_a$ | Claim and operating cost |
| $c_f$ | Fixed system cost |
| $\lambda$ | Risk loading parameter |
| $\pi$ | Target profit per policy |

## 3. Contract and Payoff

The protection price must satisfy
$$
P_0 \ge \lceil P_1 \rceil .
$$
For a completed purchase, define the compensable difference and miles payout as
$$
D(P_0,P_T)=\min\left(\max(P_T-P_0,0),C\right),
$$
$$
M(P_0,P_T)=
\begin{cases}
\min\left(\left\lfloor \dfrac{\rho D(P_0,P_T)}{v_m}\right\rfloor,M_{\max}\right),
& \text{if the ticket purchase is completed},\\[6pt]
0, & \text{otherwise}.
\end{cases}
$$
The passenger's effective price is
$$
P_{\mathrm{eff}}=P_T-v_mM.
$$
If $\rho=1$ and $D<C$, then $P_{\mathrm{eff}}\approx P_0$. If $\rho<1$,
the product is a partial subsidy rather than a full price cap.

If $P_T \le P_0$, no miles are paid and $K(P_0)$ is retained. If the passenger
does not complete the purchase, no miles are paid and $K(P_0)$ is retained.

When $P_0>P_1$, the amount $P_0-P_1$ is the passenger's deductible. When
$P_1$ is an integer and $P_0=P_1$, there is no deductible; otherwise the
rounding from $P_1$ to $\lceil P_1\rceil$ is the effective deductible.

## 4. Passenger Choice

The passenger selects an integer protection price from the feasible menu:
$$
\mathcal{P}=
\left\{
P_0\in\mathbb{Z}:
\lceil P_1\rceil\le P_0\le P_{\max},
\ K(P_0)\le \kappa P_1
\right\}.
$$
Under the risk-neutral baseline, the selected protection price is
$$
P_0^*=
\arg\max_{P_0\in\mathcal{P}}
\left\{
E\left[v_mM(P_0,P_T)\right]-K(P_0)
\right\}.
$$
Because a lower $P_0$ provides stronger protection, $K(P_0)$ must be
non-increasing in $P_0$. Otherwise, a lower protection price can dominate a
higher one and the menu is not valid.

The baseline assumes that all passengers share the same distribution of $P_T$.
If passengers have heterogeneous beliefs, $K(P_0)$ must be conditioned on the
observable passenger type or the model will underprice adverse selection.

## 5. Fee Function

The protection fee is
$$
K(P_0)=
c_mE\left[M(P_0,P_T)\right]
+c_a+c_f
+\lambda\sigma\left(M(P_0,P_T)\right)
+\pi,
$$
subject to
$$
K(P_0)\le \kappa P_1.
$$
Since $E[M]$ decreases as $P_0$ increases, $K(P_0)$ is non-increasing.
The feasible menu is therefore an upper integer interval:
$$
\mathcal{P}=\{P_0\in\mathbb{Z}:P_{\min}\le P_0\le P_{\max}\},
$$
where $P_{\min}$ is the smallest integer satisfying
$K(P_{\min})\le \kappa P_1$. If no such integer exists, no protection is
offered.

Expected accounting profit is
$$
E[\Pi(P_0)]
=
K(P_0)
-c_mE[M(P_0,P_T)]
-c_a
-c_f.
$$
The expression "one part of $K$ covers payouts and another part is profit" is
an aggregate accounting statement, not a per-policy split.

## 6. Price Distribution

The pricing model only needs the terminal distribution
$$
F_{t_0,T}(p)=\Pr(P_T\le p\mid \mathcal{I}_{t_0}),
$$
where $\mathcal{I}_{t_0}$ is the information available at $t_0$.

Under the baseline purchase assumption, the expected miles payout is
$$
E[M]=
\int_{P_0}^{P_0+C}
\frac{\rho(p-P_0)}{v_m}f_{t_0,T}(p)\,dp
+
\frac{\rho C}{v_m}
\Pr(P_T>P_0+C).
$$
The model must estimate $F_{t_0,T}$ from historical fare quotes and booking
data. Under the stated assumptions, the price path between $t_0$ and $T_s$
does not enter the payoff.

## 7. Operation Sequence

1. Read $P_1$ and verify itinerary eligibility.
2. Estimate the terminal price distribution $F_{t_0,T}$.
3. Compute $K(P_0)$ for every integer $P_0$ in the candidate range.
4. Determine the feasible interval $[P_{\min},P_{\max}]$.
5. Display $P_1$, the selectable $P_0$ values, $K(P_0)$, $C$, $\rho$,
   and $T_s$.
6. The passenger selects an integer $P_0$ and pays $K(P_0)$.
7. At $T_s$, observe $P_T$.
8. Verify that the same passenger and itinerary are purchased.
9. If $P_T>P_0$, compute $M(P_0,P_T)$ and issue miles; otherwise issue zero
   miles.
10. Record realized payout, conversion, and model error for recalibration.

## 8. Open Parameters

The following values are intentionally left unspecified:
$$
T_s,\ C,\ \rho,\ \kappa,\ \pi,\ c_m,\ v_m,\ M_{\max},\ P_{\max}.
$$
Once these values are fixed, $K(P_0)$ and the selectable interval are fully
determined by the distribution $F_{t_0,T}$.
