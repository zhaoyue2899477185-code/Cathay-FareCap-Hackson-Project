# Cathay Fare Cap Demo

Offline single-page demo for the fare-cap / Asia Miles protection model.
Data and examples are simulated

## Setup

Download the whole demo directory.
```powershell
git clone --filter=blob:none --sparse https://github.com/zhaoyue2899477185-code/Cathay-FareCap-Hackson-Project
cd Cathay-FareCap-Hackson-Project
git sparse-checkout set https://github.com/zhaoyue2899477185-code/Cathay-FareCap-Hackson-Project/demo
```

## Run

From this directory:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`.

## Included flow

1. Browse 30 offline round-trip Economy fares across HKG–TYO, HKG–TPE, HKG–BKK, and HKG–SIN.
2. Open a fare and choose an integer protected price within the calibrated feasible range.
3. The protection fee \(K\) updates immediately from the offline lognormal pricing formula.
4. Complete the simulated payment.
5. The record is saved in `localStorage` and becomes ready to settle immediately.
6. In the account view, buy the ticket or abandon the protection.
7. Buying a ticket above the protected price adds miles to the Asia Miles pool.
8. The bottom refresh button switches to a fresh demo account and clears all records and miles.

Payout in the demo is triggered only when the settlement fare is above the current fare \(P_1\), and the mileage difference is calculated from \(P_T-P_0\).

## Demo conventions

- Every flight has a fixed, pre-set settlement fare so every demo run is reproducible.
- The demo uses partial miles coverage \(\rho=0.5\). The formal model document keeps full coverage \(\rho=1.0\).
- The protected price input is restricted to the demo’s feasible interval.
- The protected price range is 50% of the current fare up to the current fare; the premium cap is 20%, with a HKD 10 safety margin so the displayed fee stays within the cap under browser numerical integration.
- No real ticket, payment, or mileage is issued.
