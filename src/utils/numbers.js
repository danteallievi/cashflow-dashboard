export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function round(value, decimals = 8) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function nearlyEqual(a, b, tolerance = 1e-8) {
  return Math.abs(a - b) <= tolerance;
}
