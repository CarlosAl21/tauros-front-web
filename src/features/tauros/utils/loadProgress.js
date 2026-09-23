// Load (weight lifted) progress helpers.
//
// The backend always stores the canonical value in kilograms (`cargaKg`);
// `unidad` only records what the user typed on mobile. The web view converts
// from `cargaKg` for display, so every number shown comes from one source.

export const KG_PER_LB = 0.45359237;

export const LOAD_UNITS = ['kg', 'lb'];

export function convertFromKg(kg, unit = 'kg') {
  const parsed = Number(kg);
  if (kg === null || kg === undefined || kg === '' || !Number.isFinite(parsed)) {
    return null;
  }

  return unit === 'lb' ? parsed / KG_PER_LB : parsed;
}

function roundToDisplay(value) {
  return Math.round(value * 10) / 10;
}

// 1 decimal, trailing ".0" dropped, never "-0".
export function formatLoadNumber(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '';
  }

  const rounded = roundToDisplay(Number(value));
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
}

export function formatLoad(kg, unit = 'kg') {
  const converted = convertFromKg(kg, unit);
  if (converted === null) {
    return '-';
  }

  return `${formatLoadNumber(converted)} ${unit}`;
}

// Returns the signed delta between two canonical kg values in the given unit.
// `trend` is derived from the rounded value, so a delta that displays as 0
// is never colored as a gain or a loss.
export function formatLoadDelta(firstKg, lastKg, unit = 'kg') {
  const first = convertFromKg(firstKg, unit);
  const last = convertFromKg(lastKg, unit);
  if (first === null || last === null) {
    return { text: '-', trend: 'flat' };
  }

  // Subtract the values as displayed (1 decimal) so the delta always matches
  // the range next to it: "60 kg -> 63.1 kg" reads "+3.1 kg".
  const rounded = roundToDisplay(roundToDisplay(last) - roundToDisplay(first));
  if (rounded === 0) {
    return { text: `0 ${unit}`, trend: 'flat' };
  }

  const sign = rounded > 0 ? '+' : '-';
  return {
    text: `${sign}${formatLoadNumber(Math.abs(rounded))} ${unit}`,
    trend: rounded > 0 ? 'up' : 'down',
  };
}

export function formatLoadDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Maps a chronological list of values to SVG polyline points inside a
// width x height box (with `padding` on every side). Returns '' when there
// are fewer than 2 valid values, since a single point is not a trend.
export function buildSparklinePoints(values, width, height, padding = 2) {
  // Drop missing values before Number(): Number(null) and Number('') are 0,
  // which would plot a fake zero-load point.
  const numeric = (Array.isArray(values) ? values : [])
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(Number)
    .filter((value) => Number.isFinite(value));

  if (numeric.length < 2) {
    return '';
  }

  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = innerWidth / (numeric.length - 1);

  return numeric
    .map((value, index) => {
      const x = padding + index * stepX;
      // Flat series sit on the vertical middle instead of the bottom edge.
      const ratio = range === 0 ? 0.5 : (value - min) / range;
      const y = padding + innerHeight - ratio * innerHeight;
      return `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`;
    })
    .join(' ');
}
