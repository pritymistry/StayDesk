// All dates are handled as 'YYYY-MM-DD' strings to avoid timezone bugs.
const pad = (n) => String(n).padStart(2, '0');
const DAY_MS = 24 * 60 * 60 * 1000;

const toUTC = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Rejects things like 2026-02-31
const isValidDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return new Date(toUTC(s)).toISOString().slice(0, 10) === s;
};

const nightsBetween = (checkIn, checkOut) => Math.round((toUTC(checkOut) - toUTC(checkIn)) / DAY_MS);

// Every night of the stay: check-in day included, check-out day excluded
const eachNight = (checkIn, checkOut) => {
  const start = toUTC(checkIn);
  const total = nightsBetween(checkIn, checkOut);
  const nights = [];
  for (let i = 0; i < total; i++) {
    nights.push(new Date(start + i * DAY_MS).toISOString().slice(0, 10));
  }
  return nights;
};

module.exports = { today, isValidDate, nightsBetween, eachNight };
