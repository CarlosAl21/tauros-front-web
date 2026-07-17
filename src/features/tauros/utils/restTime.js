// Fuente unica para convertir entre segundos (lo que guarda el backend:
// tiempoSegundos/descansoSegundos) y el par {valor, unidad} que edita el
// usuario en un input + selector de Segundos/Minutos. Antes esta logica
// estaba duplicada en PlanBuilderScreen.js y ModuleScreen.js, y terminaron
// desincronizadas: el selector de unidad cambiaba la unidad sin convertir el
// numero, asi que "60" con Segundos pasaba a leerse como "60" Minutos (3600
// segundos) en vez de "1" Minuto. Con un solo lugar para esto, arreglarlo acá
// lo arregla en todos los formularios que lo usen.

export function secondsToInputValue(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { value: '60', unit: 'seconds' };
  }

  if (parsed >= 60 && parsed % 60 === 0) {
    return { value: String(parsed / 60), unit: 'minutes' };
  }

  return { value: String(parsed), unit: 'seconds' };
}

export function toSeconds(value, unit = 'seconds', fallback = 60) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return unit === 'minutes' ? Math.trunc(parsed * 60) : Math.trunc(parsed);
}

// Al tocar el selector de unidad (segundos/minutos), el numero que ya estaba
// escrito tiene que convertirse a la unidad nueva -- si no, "60" con
// "Segundos" pasa a interpretarse como "60" con "Minutos" (3600 segundos) en
// vez de "1" minuto, que es lo que de verdad representan esos 60 segundos.
export function convertValueToUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }

  const parsed = Number(value);
  if (!value || !Number.isFinite(parsed) || parsed < 1) {
    return value;
  }

  const totalSeconds = fromUnit === 'minutes' ? parsed * 60 : parsed;
  const converted = toUnit === 'minutes' ? totalSeconds / 60 : totalSeconds;

  return String(Math.max(1, Math.round(converted)));
}
