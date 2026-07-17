import { formatSecondsHint, toPositiveSeconds } from './restTime';

describe('formatSecondsHint', () => {
  test('menos de 60 segundos se muestra en segundos', () => {
    expect(formatSecondsHint(45)).toBe('45 seg');
  });

  test('multiplo exacto de 60 se muestra en minutos', () => {
    expect(formatSecondsHint(60)).toBe('≈ 1 min');
    expect(formatSecondsHint(3600)).toBe('≈ 60 min');
  });

  test('no multiplo de 60 se muestra combinado', () => {
    expect(formatSecondsHint(90)).toBe('≈ 1 min 30 seg');
  });

  test('vacio/invalido no muestra nada', () => {
    expect(formatSecondsHint('')).toBe('');
    expect(formatSecondsHint(undefined)).toBe('');
    expect(formatSecondsHint(0)).toBe('');
  });
});

describe('toPositiveSeconds', () => {
  test('trunca decimales', () => {
    expect(toPositiveSeconds('45.7')).toBe(45);
  });

  test('usa el fallback si es invalido o menor a 1', () => {
    expect(toPositiveSeconds('', 30)).toBe(30);
    expect(toPositiveSeconds('0', 30)).toBe(30);
    expect(toPositiveSeconds('abc', 30)).toBe(30);
  });
});
