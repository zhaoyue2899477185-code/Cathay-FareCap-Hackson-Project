# Cathay-FareCap-Hackson-Project
## Team Name: Chinese Can Fly
A Cathay Hackson project about a "fare captation" function

# Cathay Fare Cap / Asia Miles Protection

Hackathon prototype for an airline fare-protection product. A passenger pays a protection fee \(K\), chooses a protected price \(P_0\), and may receive Asia Miles under the contract rules.

## Demo

Live demo: <https://zhaoyue2899477185-code.github.io/Cathay-FareCap-Hackson-Project/>

To run it locally:

```powershell
cd demo
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`.

The demo is a static offline site with 30 simulated flights. It uses `localStorage` for protection records and miles. No real payment, ticket, or mileage is issued.

## Repository Structure

| Path | Contents |
|---|---|
| `demo/` | Runnable demo: HTML, CSS, JavaScript, offline flight data |
| `model.md` | Complete formal model |
| `dataset/` | Dataset inventory, source mapping, core calibrated data and source observations|
| `construction-process.md` | Calibration and construction process |、
| `scripts/` | Core calibration scripts |

## Model vs Demo

- The formal model uses full miles coverage, \(\rho=1.0\).
- The demo uses partial coverage, \(\rho=0.5\), and a lower protection-price range so the passenger flow is easier to explore.
- \(P_0\) is the protected price / strike, not the amount paid immediately for a ticket.
- The current demo triggers a payout only when the settlement fare is above the current fare; it is a conditional subsidy model, not a pure target-price option.

## Data Sources

The source-to-parameter mapping is in `final-deliverables/03-source-mapping.md`.

The main sources are Cathay Pacific official fare pages, Cathay Hold Your Fare terms, Asia Miles award pages, and the Cathay 2025 Annual Report.

## Notes

- The pilot covers HKG–TYO, HKG–TPE, HKG–BKK and HKG–SIN.
- The formal model is a mathematical prototype, not a production insurance contract.
- A local or temporary preview URL is not part of the repository.
