# Data Source Mapping

**Source priority:** Cathay official live fares > Cathay annual report and official terms > proxies calculated from official data > explicitly labelled policy assumptions.

## 1. Source Summary

| ID | Authoritative source | URL | Extracted facts | Used for |
|---|---|---|---|---|
| S1 | Cathay 2025 Annual Report | https://www.cathaypacific.com/content/dam/cx/about-us/investor-relations/interim-annual-reports/en/2025_cx_annual_report_en.pdf | 2025 revenue, passenger revenue, ASK/RPK, load factor, yield, cost per ATK, loyalty-programme contract liability, and recognised revenue | $c_m$ proxy, model context, and consistency checks |
| S2 | Cathay Hold Your Fare | https://www.cathaypacific.com/cx/en_HK/manage-booking/travel-extras/hold-your-fare.html | 72-hour hold; at least 168 hours before departure; Cathay website only; fee per passenger/booking; no changes | $T_s=72$ hours and eligibility boundary |
| S3 | Hold Your Fare terms | https://www.cathaypacific.com/cx/en_HK/manage-booking/travel-extras/hold-your-fare/terms-and-conditions.html | Fare fixed for 72 hours; fee non-refundable; non-transferable; no changes; website only | Operating boundary and time window |
| S4 | Cathay HKG–TYO fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-tokyo.html?CABINCLASS=Y | Current Economy lowest fare HKD3,890; monthly and daily fare chart | $P_1$, D1, D2 |
| S5 | Cathay HKG–TPE fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-taipei.html?CABINCLASS=Y | Current Economy lowest fare HKD1,895 | $P_1$, D1, D2 |
| S6 | Cathay HKG–BKK fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-bangkok.html?CABINCLASS=Y | Current Economy lowest fare HKD2,646 | $P_1$, D1, D2 |
| S7 | Cathay HKG–SIN fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-singapore.html?CABINCLASS=Y | Current Economy lowest fare HKD3,134 | $P_1$, D1, D2 |
| S8 | Cathay HKG–SYD fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-sydney.html?CABINCLASS=Y | Current Economy lowest fare HKD4,886 | D2 and $v_m$ cash-fare sample |
| S9 | Cathay HKG–LON fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-london.html?CABINCLASS=Y | Current Economy lowest fare HKD7,371; monthly fares | D2 and long-haul reference |
| S10 | Cathay HKG–SFO fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-san-francisco.html?CABINCLASS=Y | Current Economy lowest fare HKD7,064 | $v_m$ cash-fare sample |
| S11 | Cathay HKG–YVR fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-vancouver.html?CABINCLASS=Y | Current Economy lowest fare HKD7,925 | $v_m$ cash-fare sample |
| S12 | Cathay HKG–ALA fare page | https://www.cathaypacific.com/flights/en_HK/flights-from-hong-kong-to-almaty.html?CABINCLASS=Y | Current Economy lowest fare HKD4,089 | $v_m$ cash-fare sample |
| S13 | Asia Miles award page | https://www.cathaypacific.com/cx/en_HK/book-a-trip/redeem-flights/redeem-flight-awards.html | HKG–TPE 7,000 one-way miles; HKG–ALA 13,000; HKG–SYD 20,000; HKG–SFO 27,000; HKG–YVR 27,000 | $v_m$ award-mile sample |
| S14 | Asia Miles award chart | https://flights.cathaypacific.com/en_HK/redeem-flights/flight-award-chart.html | Award miles exclude fuel surcharges and taxes; awards follow distance/cabin rules | Tax haircut for $v_m$ |
| S15 | Cathay optional services page | https://www.cathaypacific.com/cx/en_HK/optional-services-and-fees.html | Seat selection, baggage, pets, and similar items are optional services | Exclusions from $P_t$ |
| S16 | Cathay investor relations page | https://www.cathaypacific.com/cx/en_HK/investor-relations.html | First-half 2026 revenue and profit overview | Financial background only |

## 2. Key Data Mapping

### 2.1 Fares

The current lowest Economy fare on each Cathay route page is used for $P_1$:

| Route | $P_1$ HKD | Source |
|---|---:|---|
| HKG–TYO | 3,890 | S4 |
| HKG–TPE | 1,895 | S5 |
| HKG–BKK | 2,646 | S6 |
| HKG–SIN | 3,134 | S7 |

The page footnote states that prices are quoted for one adult on a one-way/round-trip basis, include taxes and carrier-imposed surcharges, and are subject to change. The model therefore defines $P_t$ as the official available price including taxes; optional services such as seat selection and baggage are excluded.

### 2.2 72-Hour Window

S2 and S3 provide the following facts:

- The holding period is 72 hours.
- The first flight must depart at least 168 hours after purchase.
- The service is available on the Cathay website only.
- The fee is charged per passenger/booking.
- The fee is non-refundable and non-transferable.
- The itinerary cannot be changed during the holding period.

The model uses $T_s=t_0+72$ hours and treats "at least 168 hours before departure" as an eligibility condition. The model is not a copy of Cathay's official Hold Your Fare product: the official product fixes the fare, while this model is a "price cap plus miles compensation" contract.

### 2.3 Miles Value

S13 provides one-way award miles, while S8, S10, S11, S12, and S5 provide the corresponding cash round-trip fares. The calculation is

$$
v_{m,r}^{\text{gross}}=
\frac{P_{\text{cash,return},r}}{2M_{\text{award,one-way},r}}.
$$

Because award miles exclude taxes and surcharges, the model applies a 20% tax/surcharge haircut to the gross value:

$$
v_{m,r}^{\text{net}}=0.80\,v_{m,r}^{\text{gross}}.
$$

The net values across the five routes range from 0.0977 to 0.1258 HKD/mile, with a mean of 0.1108. The model uses $v_m=0.11$ HKD/mile.

### 2.4 Loyalty-Programme Cost Proxy

S1 (2025 Annual Report, around PDF page 115) discloses:

- Loyalty-programme contract liability at year-end 2025: HK$7,007m;
- Revenue deferred during the year: HK$4,768m;
- Revenue recognised during the year: HK$3,529m.

The model uses the recognition/deferral ratio

$$
\eta=\frac{3,529}{4,768}=0.7401
$$

as a conservative fulfilment-cost factor:

$$
c_m=\eta v_m=0.7401\times0.11=0.0814\approx0.08.
$$

This is not Cathay's disclosed "marginal cost per mile"; it is a proxy derived from public accounting data. Before production, replace it with Cathay's internal fulfilment cost, breakage, and redemption-mix data.

### 2.5 Price Volatility

The 68 official daily fare observations in D1 are used to estimate $\sigma_d$. Route-level results:

| Route | $\sigma_d$ | $\sigma_{72}$ |
|---|---:|---:|
| HKG–TYO | 14.31% | 24.78% |
| HKG–TPE | 3.79% | 6.56% |
| HKG–BKK | 7.95% | 13.76% |
| HKG–SIN | 11.94% | 20.68% |

These values come from an official price cross-section across departure dates and are a proxy for 72-hour price uncertainty, not a historical same-itinerary quote panel.

## 3. Source Limitations

1. Cathay's public website does not publish an hourly historical fare panel; D1 is a cross-section.
2. The Hold Your Fare page does not publish a fixed fee amount, so $\kappa=3\%$ is a policy cap, not a value reverse-engineered from the official fee.
3. The Asia Miles award page displays minimum award levels; actual availability and taxes vary by date.
4. The annual report discloses the loyalty contract liability and revenue recognition but not total miles issued or redeemed.
5. This model does not introduce legal, regulatory, tax, or accounting determinations; these are outside the scope of the mathematical construction.
