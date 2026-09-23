import {
  buildSparklinePoints,
  convertFromKg,
  formatLoad,
  formatLoadDate,
  formatLoadDelta,
  formatLoadNumber,
} from './loadProgress';

describe('convertFromKg', () => {
  test('kg stays as is', () => {
    expect(convertFromKg(80, 'kg')).toBe(80);
  });

  test('converts kg to lb with the exact factor', () => {
    expect(convertFromKg(0.45359237, 'lb')).toBeCloseTo(1, 10);
    expect(convertFromKg(100, 'lb')).toBeCloseTo(220.462, 3);
  });

  test('invalid input returns null', () => {
    expect(convertFromKg(null)).toBeNull();
    expect(convertFromKg(undefined)).toBeNull();
    expect(convertFromKg('')).toBeNull();
    expect(convertFromKg('abc')).toBeNull();
  });
});

describe('formatLoadNumber', () => {
  test('one decimal, trailing .0 dropped', () => {
    expect(formatLoadNumber(80)).toBe('80');
    expect(formatLoadNumber(80.04)).toBe('80');
    expect(formatLoadNumber(82.5)).toBe('82.5');
    expect(formatLoadNumber(82.46)).toBe('82.5');
  });

  test('never renders -0', () => {
    expect(formatLoadNumber(-0.01)).toBe('0');
  });
});

describe('formatLoad', () => {
  test('formats in the requested unit', () => {
    expect(formatLoad(100, 'kg')).toBe('100 kg');
    expect(formatLoad(100, 'lb')).toBe('220.5 lb');
    expect(formatLoad(20.4116, 'lb')).toBe('45 lb');
  });

  test('missing value shows a dash', () => {
    expect(formatLoad(null, 'kg')).toBe('-');
  });
});

describe('formatLoadDelta', () => {
  test('gain is positive with sign', () => {
    expect(formatLoadDelta(60, 62.5, 'kg')).toEqual({ text: '+2.5 kg', trend: 'up' });
  });

  test('loss is negative with sign', () => {
    expect(formatLoadDelta(62.5, 60, 'kg')).toEqual({ text: '-2.5 kg', trend: 'down' });
  });

  test('no change (or change that rounds to 0) is flat', () => {
    expect(formatLoadDelta(60, 60, 'kg')).toEqual({ text: '0 kg', trend: 'flat' });
    expect(formatLoadDelta(60, 60.01, 'kg')).toEqual({ text: '0 kg', trend: 'flat' });
  });

  test('delta is computed from the displayed (rounded) values', () => {
    // 60.04 -> "60", 63.14 -> "63.1": the delta must read +3.1, not +3.
    expect(formatLoadDelta(60.04, 63.14, 'kg')).toEqual({ text: '+3.1 kg', trend: 'up' });
    expect(formatLoadDelta(60, 63.1, 'kg')).toEqual({ text: '+3.1 kg', trend: 'up' });
    // 60.04 and 59.96 both display as "60", so there is no visible change.
    expect(formatLoadDelta(59.96, 60.04, 'kg')).toEqual({ text: '0 kg', trend: 'flat' });
  });

  test('converts to lb', () => {
    expect(formatLoadDelta(0, 4.5359237, 'lb')).toEqual({ text: '+10 lb', trend: 'up' });
  });

  test('missing values show a dash', () => {
    expect(formatLoadDelta(null, 60, 'kg')).toEqual({ text: '-', trend: 'flat' });
  });
});

describe('formatLoadDate', () => {
  test('invalid or empty shows a dash', () => {
    expect(formatLoadDate('')).toBe('-');
    expect(formatLoadDate('not-a-date')).toBe('-');
  });

  test('valid ISO renders a non-empty date', () => {
    expect(formatLoadDate('2026-09-20T12:00:00.000Z')).toMatch(/2026/);
  });
});

describe('buildSparklinePoints', () => {
  test('fewer than 2 values yields no line', () => {
    expect(buildSparklinePoints([], 100, 20)).toBe('');
    expect(buildSparklinePoints([50], 100, 20)).toBe('');
  });

  test('maps min to bottom and max to top within padding', () => {
    expect(buildSparklinePoints([10, 20], 100, 20, 0)).toBe('0,20 100,0');
  });

  test('null, undefined and empty values are skipped, not plotted as 0', () => {
    expect(buildSparklinePoints([10, null, undefined, '', 20], 100, 20, 0)).toBe('0,20 100,0');
    expect(buildSparklinePoints([null, 50], 100, 20)).toBe('');
  });

  test('flat series sits on the vertical middle', () => {
    expect(buildSparklinePoints([5, 5, 5], 100, 20, 0)).toBe('0,10 50,10 100,10');
  });
});
