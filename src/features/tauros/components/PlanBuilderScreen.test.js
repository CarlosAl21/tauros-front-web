import { convertValueToUnit } from './PlanBuilderScreen';

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
