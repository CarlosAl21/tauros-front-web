import { convertValueToUnit, secondsToInputValue, toSeconds } from './restTime';

describe('convertValueToUnit', () => {
  test('60 segundos pasa a 1 minuto al cambiar la unidad (no se queda en "60 minutos")', () => {
    expect(convertValueToUnit('60', 'seconds', 'minutes')).toBe('1');
  });

  test('1 minuto pasa a 60 segundos al volver a segundos', () => {
    expect(convertValueToUnit('1', 'minutes', 'seconds')).toBe('60');
  });

  test('90 segundos redondea a 2 minutos', () => {
    expect(convertValueToUnit('90', 'seconds', 'minutes')).toBe('2');
  });

  test('no toca el valor si la unidad no cambia', () => {
    expect(convertValueToUnit('45', 'seconds', 'seconds')).toBe('45');
  });

  test('deja vacio/invalido tal cual, sin inventar un numero', () => {
    expect(convertValueToUnit('', 'seconds', 'minutes')).toBe('');
    expect(convertValueToUnit(undefined, 'seconds', 'minutes')).toBe(undefined);
  });
});

describe('secondsToInputValue', () => {
  test('3600 segundos (el dato viejo corrupto) se muestra como 60 minutos, no como 3600', () => {
    expect(secondsToInputValue(3600)).toEqual({ value: '60', unit: 'minutes' });
  });

  test('60 segundos se muestra como 1 minuto', () => {
    expect(secondsToInputValue(60)).toEqual({ value: '1', unit: 'minutes' });
  });

  test('45 segundos (no multiplo de 60) se queda en segundos', () => {
    expect(secondsToInputValue(45)).toEqual({ value: '45', unit: 'seconds' });
  });
});

describe('toSeconds', () => {
  test('convierte minutos a segundos', () => {
    expect(toSeconds('1', 'minutes')).toBe(60);
  });

  test('deja segundos tal cual', () => {
    expect(toSeconds('45', 'seconds')).toBe(45);
  });

  test('usa el fallback si el valor es invalido', () => {
    expect(toSeconds('', 'seconds', 30)).toBe(30);
    expect(toSeconds('abc', 'minutes', 30)).toBe(30);
  });
});
