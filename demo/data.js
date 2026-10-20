const ROUTE_DATA = {
  TYO: {
    code: "TYO",
    from: "Hong Kong",
    to: "Tokyo",
    fromCode: "HKG",
    toCode: "TYO",
    p1Base: 3890,
    sigma72: 0.2477719691,
    cCapRatio: 0.4550128535,
    pminRatio: 1.2917737789,
    pmaxRatio: 1.7208226221,
    durationLabel: "4h 05m",
    durationMinutes: 245,
    aircraft: "Airbus A350-900",
    dateOffset: 0,
    flightNumbers: ["CX 548", "CX 520", "CX 542", "CX 500", "CX 564", "CX 530", "CX 536", "CX 502"],
    times: [
      ["09:10", "13:15"],
      ["10:25", "14:30"],
      ["14:30", "18:35"],
      ["16:05", "20:10"],
      ["23:55", "04:00"],
      ["08:45", "12:50"],
      ["11:35", "15:40"],
      ["13:20", "17:25"]
    ],
    priceMultipliers: [0.97, 0.985, 1.0, 1.015, 1.03, 0.98, 1.01, 1.02],
    settlementRatios: [1.05, 1.12, 1.22, 1.30, 1.38, 1.48, 1.60, 1.69]
  },
  TPE: {
    code: "TPE",
    from: "Hong Kong",
    to: "Taipei",
    fromCode: "HKG",
    toCode: "TPE",
    p1Base: 1895,
    sigma72: 0.0656051787,
    cCapRatio: 0.1160949868,
    pminRatio: 1.0015831135,
    pmaxRatio: 1.1614775726,
    durationLabel: "1h 45m",
    durationMinutes: 105,
    aircraft: "Airbus A330-300",
    dateOffset: 1,
    flightNumbers: ["CX 450", "CX 452", "CX 454", "CX 456", "CX 458", "CX 460", "CX 462"],
    times: [
      ["08:00", "09:45"],
      ["10:15", "12:00"],
      ["13:10", "14:55"],
      ["15:40", "17:25"],
      ["18:20", "20:05"],
      ["21:10", "22:55"],
      ["07:30", "09:15"]
    ],
    priceMultipliers: [0.98, 0.995, 1.0, 1.01, 1.025, 0.99, 1.015],
    settlementRatios: [0.96, 0.99, 1.01, 1.04, 1.08, 1.12, 1.17]
  },
  BKK: {
    code: "BKK",
    from: "Hong Kong",
    to: "Bangkok",
    fromCode: "HKG",
    toCode: "BKK",
    p1Base: 2646,
    sigma72: 0.1376266400,
    cCapRatio: 0.2418745276,
    pminRatio: 1.0888133031,
    pmaxRatio: 1.3624338624,
    durationLabel: "2h 55m",
    durationMinutes: 175,
    aircraft: "Airbus A330-300",
    dateOffset: 2,
    flightNumbers: ["CX 701", "CX 703", "CX 705", "CX 707", "CX 709", "CX 711", "CX 713"],
    times: [
      ["08:30", "11:25"],
      ["10:50", "13:45"],
      ["13:25", "16:20"],
      ["15:10", "18:05"],
      ["17:45", "20:40"],
      ["19:30", "22:25"],
      ["22:10", "01:05"]
    ],
    priceMultipliers: [0.98, 0.99, 1.0, 1.01, 1.02, 0.995, 1.015],
    settlementRatios: [1.02, 1.06, 1.09, 1.13, 1.20, 1.27, 1.36]
  },
  SIN: {
    code: "SIN",
    from: "Hong Kong",
    to: "Singapore",
    fromCode: "HKG",
    toCode: "SIN",
    p1Base: 3134,
    sigma72: 0.2067901505,
    cCapRatio: 0.3733248245,
    pminRatio: 1.2064454371,
    pmaxRatio: 1.5797702616,
    durationLabel: "4h 00m",
    durationMinutes: 240,
    aircraft: "Airbus A350-900",
    dateOffset: 3,
    flightNumbers: ["CX 635", "CX 637", "CX 639", "CX 641", "CX 643", "CX 645", "CX 647", "CX 649"],
    times: [
      ["08:15", "12:15"],
      ["09:50", "13:50"],
      ["11:20", "15:20"],
      ["13:45", "17:45"],
      ["15:30", "19:30"],
      ["17:10", "21:10"],
      ["19:55", "23:55"],
      ["21:40", "01:40"]
    ],
    priceMultipliers: [0.98, 0.99, 1.0, 1.01, 1.02, 0.995, 1.015, 1.005],
    settlementRatios: [1.08, 1.14, 1.20, 1.26, 1.33, 1.42, 1.55, 1.58]
  }
};

const FLIGHT_COUNTS = { TYO: 8, TPE: 7, BKK: 7, SIN: 8 };
const DEPART_DATES = [
  "2027-01-08",
  "2027-01-15",
  "2027-01-22",
  "2027-02-05",
  "2027-02-19",
  "2027-03-05",
  "2027-03-19",
  "2027-04-02",
  "2027-04-16",
  "2027-04-30"
];

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMinutes(time, minutes) {
  const [hh, mm] = time.split(":").map(Number);
  const total = hh * 60 + mm + minutes;
  const dayOffset = Math.floor(total / 1440);
  const normalized = ((total % 1440) + 1440) % 1440;
  const outH = String(Math.floor(normalized / 60)).padStart(2, "0");
  const outM = String(normalized % 60).padStart(2, "0");
  return { time: `${outH}:${outM}`, dayOffset };
}

function buildFlights() {
  const flights = [];

  for (const [code, route] of Object.entries(ROUTE_DATA)) {
    const count = FLIGHT_COUNTS[code];
    for (let i = 0; i < count; i += 1) {
      const departDate = DEPART_DATES[(i + route.dateOffset) % DEPART_DATES.length];
      const p1 = Math.round(route.p1Base * route.priceMultipliers[i]);
      const settlementPrice = Math.round(p1 * route.settlementRatios[i]);
      const cCap = Math.ceil((p1 * route.cCapRatio) / 10) * 10;
      const pmax = Math.ceil(p1 * route.pmaxRatio);
      const [departTime, _unusedArrival] = route.times[i];
      const arrival = addMinutes(departTime, route.durationMinutes);
      const flightNumber = route.flightNumbers[i];

      flights.push({
        id: `${flightNumber.replace(/\s+/g, "")}-${departDate}`,
        code,
        routeLabel: `${route.from} to ${route.to}`,
        from: route.from,
        to: route.to,
        fromCode: route.fromCode,
        toCode: route.toCode,
        flightNumber,
        departDate,
        returnDate: addDays(departDate, 7),
        saleEnds: addDays(departDate, -1),
        departTime,
        arriveTime: arrival.time,
        arrivalDayOffset: arrival.dayOffset,
        durationLabel: route.durationLabel,
        aircraft: route.aircraft,
        cabin: "Economy Essential",
        p1,
        sigma72: route.sigma72,
        cCap,
        pmax,
        maxMiles: Math.floor((0.5 * cCap) / 0.11),
        settlementPrice
      });
    }
  }

  return flights.sort((a, b) => {
    const dateCompare = a.departDate.localeCompare(b.departDate);
    return dateCompare !== 0 ? dateCompare : a.departTime.localeCompare(b.departTime);
  });
}

const FLIGHTS = buildFlights();
