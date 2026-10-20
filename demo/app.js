const STORAGE_KEY = "cathay-fare-cap-demo-v1";
const V_M = 0.11;
const C_M = 0.08;
const RHO = 0.5;
const LAMBDA = 0.10;
const ADMIN_RATIO = 0.005;
const PROFIT_RATIO = 0.005;

const ICONS = {
  plane: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.2 13.2 20.7 5.1l-3.1 12.8-5-4-3.1 4.1-1-6.1-5.3 1.3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    </svg>`,
  arrow: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15M14 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  shield: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.5-2.7 7.7-7 9.3-4.3-1.6-7-4.8-7-9.3V6l7-2.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="m8.8 12 2.1 2.1 4.4-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  close: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  check: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5.5 12.5 4.2 4.2 8.8-9" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
};

const state = {
  view: "fares",
  filter: "ALL",
  records: loadRecords(),
  selectedFlight: null,
  selectedP0: null,
  selectedK: null,
  lastFocus: null
};

const els = {
  faresView: document.getElementById("faresView"),
  accountView: document.getElementById("accountView"),
  navFares: document.getElementById("navFares"),
  navAccount: document.getElementById("navAccount"),
  brandButton: document.getElementById("brandButton"),
  headerAccount: document.getElementById("headerAccount"),
  headerMiles: document.getElementById("headerMiles"),
  destinationFilter: document.getElementById("destinationFilter"),
  resultCount: document.getElementById("resultCount"),
  flightList: document.getElementById("flightList"),
  milesPool: document.getElementById("milesPool"),
  recordCount: document.getElementById("recordCount"),
  recordsList: document.getElementById("recordsList"),
  resetDemo: document.getElementById("resetDemo"),
  modalRoot: document.getElementById("modalRoot"),
  toast: document.getElementById("toast")
};

const Z_GRID = (() => {
  const points = 401;
  const min = -4;
  const max = 4;
  const step = (max - min) / (points - 1);
  const grid = [];
  let totalWeight = 0;

  for (let i = 0; i < points; i += 1) {
    const z = min + i * step;
    const weight = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    grid.push({ z, weight });
    totalWeight += weight;
  }

  return grid.map((point) => ({
    z: point.z,
    weight: point.weight / totalWeight
  }));
})();

let toastTimer = null;

function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function formatHKD(value, decimals = 0) {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatMiles(value) {
  return new Intl.NumberFormat("en-HK").format(Math.max(0, Math.round(value)));
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("en-HK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function totalMiles() {
  return state.records
    .filter((record) => record.status === "purchased")
    .reduce((sum, record) => sum + Number(record.milesAwarded || 0), 0);
}

function getFlight(flightId) {
  return FLIGHTS.find((flight) => flight.id === flightId);
}

function getRecord(recordId) {
  return state.records.find((record) => record.id === recordId);
}

function computeFee(flight, p0) {
  let expectedLoss = 0;
  let expectedLossSquared = 0;

  for (const point of Z_GRID) {
    const price = flight.p1 * Math.exp(-0.5 * flight.sigma72 * flight.sigma72 + flight.sigma72 * point.z);
    const difference =
      price > flight.p1
        ? Math.min(Math.max(price - p0, 0), flight.cCap)
        : 0;
    const miles = Math.min(Math.floor((RHO * difference) / V_M), flight.maxMiles);
    const loss = C_M * miles;
    expectedLoss += point.weight * loss;
    expectedLossSquared += point.weight * loss * loss;
  }

  const variance = Math.max(expectedLossSquared - expectedLoss * expectedLoss, 0);
  const sigmaLoss = Math.sqrt(variance);
  const fee =
    expectedLoss +
    ADMIN_RATIO * flight.p1 +
    LAMBDA * sigmaLoss +
    PROFIT_RATIO * flight.p1;

  return {
    fee: Math.max(0, fee),
    expectedLoss,
    sigmaLoss
  };
}

function findPmin(flight) {
  const feeCap = 0.20 * flight.p1;
  const low = Math.ceil(flight.p1 * 0.5);
  const high = flight.pmax;

  if (computeFee(flight, high).fee > feeCap) {
    return high;
  }

  let left = low;
  let right = high;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (computeFee(flight, mid).fee <= feeCap) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return Math.min(high, left + 10);
}

function computeSettlementMiles(record) {
  if (record.settlementPrice <= record.p1) {
    return 0;
  }
  const difference = Math.min(
    Math.max(record.settlementPrice - record.p0, 0),
    record.cCap
  );
  return Math.min(Math.floor((RHO * difference) / V_M), record.maxMiles);
}

function renderFlights() {
  const flights = FLIGHTS.filter(
    (flight) => state.filter === "ALL" || flight.code === state.filter
  );

  els.resultCount.textContent = String(flights.length);
  els.flightList.innerHTML = flights.map(flightCard).join("");
}

function flightCard(flight) {
  const arriveDate = flight.arrivalDayOffset
    ? `<span class="time-date">+${flight.arrivalDayOffset} day</span>`
    : "";

  return `
    <article class="flight-card" data-flight-id="${flight.id}">
      <div>
        <div class="flight-route">
          <span class="airport-code">${flight.fromCode}</span>
          <span class="route-arrow">${ICONS.arrow}</span>
          <span class="airport-code">${flight.toCode}</span>
        </div>
        <div class="flight-meta">
          <strong>${flight.flightNumber}</strong>
          <span>${formatDate(flight.departDate)}</span>
          <span>${flight.cabin}</span>
          <span>Returns ${formatDate(flight.returnDate)}</span>
          <span class="tag">Direct</span>
          <span class="tag">Round trip</span>
        </div>
        <div class="flight-times">
          <div class="time-block">
            <div class="time-value">${flight.departTime}</div>
            <div class="time-date">${flight.fromCode}</div>
          </div>
          <div class="time-block">
            <div class="time-value">${flight.arriveTime}</div>
            <div class="time-date">${flight.toCode} ${arriveDate}</div>
          </div>
          <div class="time-block">
            <div class="time-value">${flight.durationLabel}</div>
            <div class="time-date">${flight.aircraft}</div>
          </div>
        </div>
      </div>

      <div class="flight-price">
        <span class="price-label">Current fare</span>
        <span class="price-value">${formatHKD(flight.p1)}</span>
        <span class="price-sub">per person · round trip</span>
      </div>

      <div class="flight-action">
        <button class="button button-primary" type="button" data-action="protect" aria-label="Protect fare on ${flight.flightNumber}">
          ${ICONS.shield}
          Protect this fare
        </button>
        <span class="protection-range">Protected price ${formatHKD(flight.pmin)}–${formatHKD(flight.pmax)}</span>
      </div>
    </article>
  `;
}

function renderAccount() {
  const records = state.records
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const miles = totalMiles();

  els.headerMiles.textContent = `${formatMiles(miles)} miles`;
  els.milesPool.textContent = formatMiles(miles);
  els.recordCount.textContent = pluralize(records.length, "record");

  if (records.length === 0) {
    els.recordsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.shield}</div>
        <h3>No protection records yet</h3>
        <p>Choose a fare from the flight list and set a protected price to start a demo protection.</p>
        <button class="button button-primary" type="button" data-action="browse">Browse fares</button>
      </div>
    `;
    return;
  }

  els.recordsList.innerHTML = records.map(recordCard).join("");
}

function recordCard(record) {
  const status = record.status || "active";
  const statusLabel =
    status === "active"
      ? "Ready to settle"
      : status === "purchased"
        ? "Purchased"
        : "Closed";
  const statusClass =
    status === "active"
      ? "status-active"
      : status === "purchased"
        ? "status-purchased"
        : "status-abandoned";

  const action =
    status === "active"
      ? `<button class="button button-primary" type="button" data-action="settle" data-record-id="${record.id}">Settle now ${ICONS.arrow}</button>`
      : `<span class="settled-note">${
          status === "purchased"
            ? `Bought at ${formatHKD(record.farePaid)} · ${formatMiles(record.milesAwarded)} miles`
            : "Fee retained · No miles"
        }</span>`;

  const milesValue =
    status === "purchased"
      ? `${formatMiles(record.milesAwarded)} miles`
      : status === "abandoned"
        ? "0 miles"
        : "Pending";

  return `
    <article class="record-card">
      <div>
        <div class="record-route">
          <strong>${record.fromCode} → ${record.toCode}</strong>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="record-meta">
          ${record.flightNumber} · ${formatDate(record.departDate)} · Returns ${formatDate(record.returnDate)}
        </div>
      </div>

      <div class="record-details">
        <div>
          <span class="detail-label">Fee paid</span>
          <span class="detail-value">${formatHKD(record.k, 2)}</span>
        </div>
        <div>
          <span class="detail-label">Protected price</span>
          <span class="detail-value">${formatHKD(record.p0)}</span>
        </div>
        <div>
          <span class="detail-label">Miles</span>
          <span class="detail-value">${milesValue}</span>
        </div>
      </div>

      <div class="record-action">${action}</div>
    </article>
  `;
}

function navigate(view) {
  state.view = view;
  const isAccount = view === "account";

  els.faresView.classList.toggle("is-hidden", isAccount);
  els.accountView.classList.toggle("is-hidden", !isAccount);
  els.navFares.classList.toggle("is-active", !isAccount);
  els.navAccount.classList.toggle("is-active", isAccount);

  if (isAccount) {
    renderAccount();
  }

  window.scrollTo({ top: 0, behavior: "auto" });
}

function modalHeader(kicker, title) {
  return `
    <div class="modal-header">
      <div>
        <p class="eyebrow">${kicker}</p>
        <h2 class="modal-title">${title}</h2>
      </div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${ICONS.close}</button>
    </div>
  `;
}

function openModal(html, ariaLabel, focusSelector) {
  if (!document.body.classList.contains("modal-open")) {
    state.lastFocus = document.activeElement;
  }

  els.modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal" role="dialog" aria-modal="true" aria-label="${ariaLabel}">
        ${html}
      </section>
    </div>
  `;
  document.body.classList.add("modal-open");

  const focusTarget = focusSelector
    ? els.modalRoot.querySelector(focusSelector)
    : els.modalRoot.querySelector("button, input, select");
  focusTarget?.focus();
}

function closeModal() {
  els.modalRoot.innerHTML = "";
  document.body.classList.remove("modal-open");

  if (state.lastFocus && document.contains(state.lastFocus)) {
    state.lastFocus.focus({ preventScroll: true });
  } else {
    els.brandButton.focus({ preventScroll: true });
  }
}

function openProtectModal(flight) {
  state.selectedFlight = flight;
  state.selectedP0 = flight.pmin;
  const initialFee = computeFee(flight, flight.pmin);
  state.selectedK = initialFee.fee;

  const html = `
    ${modalHeader("Fare protection", "Set your protected price")}
    <div class="modal-body">
      <div class="flight-summary">
        <div class="summary-route">
          <strong>${flight.fromCode} → ${flight.toCode}</strong>
          <span>${flight.flightNumber} · ${formatDate(flight.departDate)} · ${flight.cabin}</span>
        </div>
        <div class="summary-fare">
          <span>Current fare</span>
          <strong>${formatHKD(flight.p1)}</strong>
        </div>
      </div>

      <label class="field-label" for="p0Input">Protected price</label>
      <div class="price-input-row">
        <span class="price-prefix">HKD</span>
        <input id="p0Input" type="number" inputmode="numeric" min="${flight.pmin}" max="${flight.pmax}" step="1" value="${flight.pmin}" />
      </div>
      <div class="range-wrap">
        <input id="p0Range" type="range" min="${flight.pmin}" max="${flight.pmax}" step="1" value="${flight.pmin}" aria-label="Protected price" />
        <div class="range-labels">
          <span>${formatHKD(flight.pmin)}</span>
          <span>${formatHKD(flight.pmax)}</span>
        </div>
      </div>
      <p class="input-hint">Whole HKD amounts only. The protected price ranges from 50% of the current fare up to the current fare; K is capped at 20% of the current fare. Payout triggers only when the settlement fare is above the current fare. This route's 72-hour volatility is ${((flight.sigma72 * 100).toFixed(1))}%.</p>
      <p id="p0Error" class="form-error is-hidden"></p>

      <div class="fee-panel">
        <div>
          <div class="fee-panel-label">Protection fee K</div>
          <div id="feeValue" class="fee-panel-value">${formatHKD(initialFee.fee, 2)}</div>
        </div>
        <div class="fee-panel-meta">
          of current fare
          <strong id="feePercent">${((initialFee.fee / flight.p1) * 100).toFixed(2)}%</strong>
        </div>
      </div>

      <div class="coverage-grid">
        <div class="coverage-item">
          <span>Covered difference</span>
          <strong>Up to ${formatHKD(flight.cCap)}</strong>
        </div>
        <div class="coverage-item">
          <span>Maximum payout</span>
          <strong>${formatMiles(flight.maxMiles)} miles</strong>
        </div>
      </div>

      <div class="modal-actions">
        <button class="button button-secondary" type="button" data-close-modal>Cancel</button>
        <button id="continuePayment" class="button button-primary" type="button">Continue to payment</button>
      </div>
    </div>
  `;

  openModal(html, "Set your protected price", "#p0Input");

  const input = els.modalRoot.querySelector("#p0Input");
  const range = els.modalRoot.querySelector("#p0Range");
  const error = els.modalRoot.querySelector("#p0Error");
  const feeValue = els.modalRoot.querySelector("#feeValue");
  const feePercent = els.modalRoot.querySelector("#feePercent");
  const continueButton = els.modalRoot.querySelector("#continuePayment");

  function updateFee(fromRange = false) {
    const raw = Number(input.value);
    const valid =
      Number.isFinite(raw) &&
      Number.isInteger(raw) &&
      raw >= flight.pmin &&
      raw <= flight.pmax;

    if (!valid) {
      error.textContent = `Enter a whole HKD amount between ${formatHKD(flight.pmin)} and ${formatHKD(flight.pmax)}.`;
      error.classList.remove("is-hidden");
      continueButton.disabled = true;
      return;
    }

    error.classList.add("is-hidden");
    continueButton.disabled = false;
    if (fromRange) {
      input.value = String(raw);
    } else {
      range.value = String(raw);
    }

    const result = computeFee(flight, raw);
    feeValue.textContent = formatHKD(result.fee, 2);
    feePercent.textContent = `${((result.fee / flight.p1) * 100).toFixed(2)}%`;
    state.selectedP0 = raw;
    state.selectedK = result.fee;
  }

  range.addEventListener("input", () => {
    input.value = range.value;
    updateFee(false);
  });

  input.addEventListener("input", () => updateFee(false));
  input.addEventListener("blur", () => {
    let value = Number(input.value);
    if (!Number.isFinite(value)) {
      value = flight.pmin;
    }
    value = Math.min(flight.pmax, Math.max(flight.pmin, Math.round(value)));
    input.value = String(value);
    range.value = String(value);
    updateFee(false);
  });

  continueButton.addEventListener("click", () => {
    if (continueButton.disabled) {
      return;
    }
    const p0 = Number(input.value);
    openPaymentModal(flight, p0, computeFee(flight, p0));
  });
}

function openPaymentModal(flight, p0, feeResult) {
  const fee = round2(feeResult.fee);
  const html = `
    ${modalHeader("Checkout", "Pay protection fee")}
    <div class="modal-body">
      <dl class="summary-list">
        <div class="summary-row">
          <dt>Flight</dt>
          <dd>${flight.flightNumber} · ${flight.fromCode} → ${flight.toCode}</dd>
        </div>
        <div class="summary-row">
          <dt>Departure</dt>
          <dd>${formatDate(flight.departDate)} · ${flight.departTime}</dd>
        </div>
        <div class="summary-row">
          <dt>Protected price</dt>
          <dd>${formatHKD(p0)}</dd>
        </div>
        <div class="summary-row">
          <dt>Coverage</dt>
          <dd>Up to ${formatHKD(flight.cCap)} / ${formatMiles(flight.maxMiles)} miles</dd>
        </div>
      </dl>
      <div class="payment-total">
        <span>Total due now</span>
        <strong>${formatHKD(fee, 2)}</strong>
      </div>

      <div class="payment-method">
        <div class="card-mark">VISA</div>
        <div>
          <strong>Demo card •••• 4242</strong>
          <span>Simulated payment · no real charge</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="button button-secondary" type="button" data-close-modal>Cancel</button>
        <button id="payButton" class="button button-primary" type="button">Pay ${formatHKD(fee, 2)}</button>
      </div>
    </div>
  `;

  openModal(html, "Pay protection fee", "#payButton");

  els.modalRoot.querySelector("#payButton").addEventListener("click", () => {
    const record = {
      id: makeId(),
      flightId: flight.id,
      routeLabel: flight.routeLabel,
      fromCode: flight.fromCode,
      toCode: flight.toCode,
      flightNumber: flight.flightNumber,
      departDate: flight.departDate,
      returnDate: flight.returnDate,
      saleEnds: flight.saleEnds,
      departTime: flight.departTime,
      p1: flight.p1,
      p0,
      k: fee,
      cCap: flight.cCap,
      maxMiles: flight.maxMiles,
      settlementPrice: flight.settlementPrice,
      status: "active",
      createdAt: new Date().toISOString(),
      settledAt: null,
      farePaid: 0,
      milesAwarded: 0
    };

    state.records.unshift(record);
    saveRecords();
    renderAccount();
    openSuccessModal(record);
  });
}

function openSuccessModal(record) {
  const html = `
    ${modalHeader("Fare protection", "Protection active")}
    <div class="modal-body">
      <div class="success-wrap">
        <div class="success-icon">${ICONS.check}</div>
        <p>Settlement is open now in this demo. You can buy the ticket or abandon the protection from your account.</p>
        <div class="success-summary">
          <div class="summary-row">
            <dt>Flight</dt>
            <dd>${record.flightNumber} · ${record.fromCode} → ${record.toCode}</dd>
          </div>
          <div class="summary-row">
            <dt>Protected price</dt>
            <dd>${formatHKD(record.p0)}</dd>
          </div>
          <div class="summary-row">
            <dt>Fee paid</dt>
            <dd>${formatHKD(record.k, 2)}</dd>
          </div>
        </div>
        <div class="modal-actions">
          <button id="backToFares" class="button button-secondary" type="button">Back to fares</button>
          <button id="viewAccount" class="button button-primary" type="button">View my account</button>
        </div>
      </div>
    </div>
  `;

  openModal(html, "Protection active", "#viewAccount");

  els.modalRoot.querySelector("#viewAccount").addEventListener("click", () => {
    closeModal();
    navigate("account");
  });

  els.modalRoot.querySelector("#backToFares").addEventListener("click", () => {
    closeModal();
    navigate("fares");
  });
}

function openSettlementModal(record) {
  const potentialMiles = computeSettlementMiles(record);
  const hasPayout = potentialMiles > 0;

  const html = `
    ${modalHeader("Settlement", "Settle your protection")}
    <div class="modal-body">
      <div class="flight-summary">
        <div class="summary-route">
          <strong>${record.fromCode} → ${record.toCode}</strong>
          <span>${record.flightNumber} · ${formatDate(record.departDate)} · ${formatDate(record.returnDate)} return</span>
        </div>
        <div class="summary-fare">
          <span>Your protected price</span>
          <strong>${formatHKD(record.p0)}</strong>
        </div>
      </div>

      <div class="settlement-grid">
        <div class="settlement-cell">
          <span>Fare at settlement</span>
          <strong>${formatHKD(record.settlementPrice)}</strong>
        </div>
        <div class="settlement-cell">
          <span>Protected price</span>
          <strong>${formatHKD(record.p0)}</strong>
        </div>
      </div>

      <div class="payout-panel ${hasPayout ? "" : "is-zero"}">
        <p class="eyebrow">${hasPayout ? "Eligible payout" : "No miles payout"}</p>
        <strong>${formatMiles(potentialMiles)} miles</strong>
        <p>${
          hasPayout
            ? "Buy the ticket at the settlement fare to receive these Asia Miles."
            : "The fare is at or below your protected price. You can still buy at the settlement fare."
        }</p>
      </div>

      <div class="modal-actions">
        <button id="abandonProtection" class="button button-danger" type="button">Abandon protection</button>
        <button id="buyTicket" class="button button-primary" type="button">Buy ticket at ${formatHKD(record.settlementPrice)}</button>
      </div>
    </div>
  `;

  openModal(html, "Settle your protection", "#buyTicket");

  els.modalRoot.querySelector("#buyTicket").addEventListener("click", () => {
    record.status = "purchased";
    record.settledAt = new Date().toISOString();
    record.farePaid = record.settlementPrice;
    record.milesAwarded = potentialMiles;
    saveRecords();
    renderAccount();
    closeModal();
    showToast(
      potentialMiles > 0
        ? `Ticket purchased. ${formatMiles(potentialMiles)} Asia Miles added.`
        : "Ticket purchased. No miles payout."
    );
  });

  els.modalRoot.querySelector("#abandonProtection").addEventListener("click", () => {
    record.status = "abandoned";
    record.settledAt = new Date().toISOString();
    record.farePaid = 0;
    record.milesAwarded = 0;
    saveRecords();
    renderAccount();
    closeModal();
    showToast("Protection closed. The fee is retained.");
  });
}

function resetDemoAccount() {
  state.records = [];
  localStorage.removeItem(STORAGE_KEY);
  renderAccount();
  navigate("account");
  showToast("Demo account reset. All protections and miles were cleared.");
}

function makeId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 3200);
}

function bindEvents() {
  els.brandButton.addEventListener("click", () => navigate("fares"));
  els.navFares.addEventListener("click", () => navigate("fares"));
  els.navAccount.addEventListener("click", () => navigate("account"));
  els.headerAccount.addEventListener("click", () => navigate("account"));

  els.destinationFilter.addEventListener("change", () => {
    state.filter = els.destinationFilter.value;
    renderFlights();
  });

  els.flightList.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="protect"]');
    if (!button) {
      return;
    }
    const card = button.closest("[data-flight-id]");
    const flight = card ? getFlight(card.dataset.flightId) : null;
    if (flight) {
      openProtectModal(flight);
    }
  });

  els.recordsList.addEventListener("click", (event) => {
    const browse = event.target.closest('[data-action="browse"]');
    if (browse) {
      navigate("fares");
      return;
    }

    const button = event.target.closest('[data-action="settle"]');
    if (!button) {
      return;
    }
    const record = getRecord(button.dataset.recordId);
    if (record && record.status === "active") {
      openSettlementModal(record);
    }
  });

  els.resetDemo.addEventListener("click", resetDemoAccount);

  els.modalRoot.addEventListener("click", (event) => {
    if (
      event.target.matches("[data-modal-backdrop]") ||
      event.target.closest("[data-close-modal]")
    ) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.modalRoot.innerHTML) {
      closeModal();
    }
  });
}

function init() {
  for (const flight of FLIGHTS) {
    flight.pmax = Math.ceil(flight.p1);
    flight.maxMiles = Math.floor((RHO * flight.cCap) / V_M);
    flight.pmin = findPmin(flight);
  }
  els.destinationFilter.value = state.filter;
  renderFlights();
  renderAccount();
  bindEvents();
}

init();
