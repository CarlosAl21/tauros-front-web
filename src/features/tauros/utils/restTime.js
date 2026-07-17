// Tiempo (duracion) y descanso se guardan y editan SIEMPRE en segundos, en
// un unico campo numerico -- sin selector de unidad.
//
// Antes habia un input de "valor" + un <select> de "Segundos/Minutos" en 4
// pantallas distintas, cada una convirtiendo entre el par {valor, unidad} y
// los segundos crudos que espera el backend por su cuenta. Eso genero fallas
// reales y dificiles de rastrear:
//   - El <select> de unidad cambiaba la unidad sin convertir el numero (60
//     con "Segundos" pasaba a leerse como 60 minutos al tocar el selector).
//   - Al navegar entre dias de un plan, una funcion que esperaba el dato
//     "crudo" (recienLlegado del backend) se volvia a llamar sobre un draft
//     que ya estaba en formato {valor, unidad}, perdiendo o corrompiendo el
//     descanso ya cargado.
// Con un solo campo en segundos no hay una segunda fuente de verdad que
// pueda desincronizarse: no existe forma de "cambiar la unidad sin
// convertir" porque no hay unidad que cambiar.
export function formatSecondsHint(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return '';
  }

  if (parsed < 60) {
    return `${Math.trunc(parsed)} seg`;
  }

  const minutes = Math.floor(parsed / 60);
  const remainder = Math.trunc(parsed % 60);

  if (remainder === 0) {
    return `≈ ${minutes} min`;
  }

  return `≈ ${minutes} min ${remainder} seg`;
}

export function toPositiveSeconds(value, fallback = 60) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.trunc(parsed);
}
