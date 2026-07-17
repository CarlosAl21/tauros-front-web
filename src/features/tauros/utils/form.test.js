import { normalizePayload } from './form';
import { MODULE_MAP } from '../config/modules';

test('normalizePayload nunca manda el id propio del registro en el body (ya va en la URL)', () => {
  const form = {
    ejercicioId: 'f049a401-5906-4cdb-a6a9-115243fa377d',
    nombre: 'Calentamiento Bicicleta',
    categoriaId: 'ea8ceb74-ac3b-442a-a7fa-889a5a7ee45b',
    tipoId: '3da96ed5-5f18-46b2-ae85-49d1587ac155',
    maquinaId: '08a90760-262e-4f39-b7b3-65fa489bc370',
    linkVideo: 'https://res.cloudinary.com/demo/video/upload/v1/x.webm',
    linkAM: 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg',
  };

  const payload = normalizePayload(form, MODULE_MAP.ejercicio);

  expect(payload.ejercicioId).toBeUndefined();
  expect(payload.nombre).toBe('Calentamiento Bicicleta');
  expect(payload.maquinaId).toBe('08a90760-262e-4f39-b7b3-65fa489bc370');
});

test('normalizePayload saca el id propio de cualquier modulo, no solo ejercicio', () => {
  const form = { userId: 'abc-123', nombre: 'Test', apellido: 'User' };
  const payload = normalizePayload(form, MODULE_MAP.usuario);

  expect(payload.userId).toBeUndefined();
  expect(payload.nombre).toBe('Test');
});
