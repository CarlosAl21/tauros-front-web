import { act, fireEvent, render, screen } from '@testing-library/react';
import PlanDetailScreen from './PlanDetailScreen';
import { apiRequest } from '../services/api';

jest.mock('../services/api', () => ({
  apiRequest: jest.fn().mockResolvedValue({}),
}));

const plan = {
  nombre: 'Prueba piernas 2',
  descripcion: 'Plan de prueba',
  duracionDias: 1,
  esPlantilla: true,
  rutinasDia: [
    {
      rutinaDiaId: 'dia-1',
      numeroDia: 1,
      nombre: 'A',
      rutinasEjercicio: [
        {
          rutinaEjercicioId: 'rutina-ejercicio-1',
          orden: 1,
          series: 3,
          repeticiones: 12,
          // El dato viejo corrupto que reporto el usuario: 3600 segundos
          // guardado como descanso por el bug de conversion ya arreglado.
          descansoSegundos: 3600,
          carga: '',
          notasEspecificas: '',
          ejercicio: { nombre: 'Abduccion' },
        },
      ],
    },
  ],
};

beforeEach(() => {
  apiRequest.mockClear();
});

test('al editar, el descanso viejo de 3600 segundos se muestra como 60 Minutos, no como "3600" crudo', () => {
  render(<PlanDetailScreen plan={plan} loading={false} token="tok" onUpdate={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

  expect(screen.getByLabelText('Descanso')).toHaveValue(60);
  expect(screen.getByLabelText('Unidad (descanso)')).toHaveValue('minutes');
});

test('cambiar la unidad de Segundos a Minutos convierte el valor en vez de dejarlo crudo', () => {
  render(<PlanDetailScreen plan={plan} loading={false} token="tok" onUpdate={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getByLabelText('Unidad (descanso)'), { target: { value: 'seconds' } });

  // 60 minutos -> al pasar a Segundos tiene que convertir a 3600, no quedar en "60".
  expect(screen.getByLabelText('Descanso')).toHaveValue(3600);
});

test('al guardar, el valor+unidad se convierte de nuevo a segundos correctos para el backend', async () => {
  render(<PlanDetailScreen plan={plan} loading={false} token="tok" onUpdate={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  // Corrige el dato viejo: pasa de "60 minutos" a "1 minuto" (60 segundos reales).
  fireEvent.change(screen.getByLabelText('Descanso'), { target: { value: '1' } });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await Promise.resolve();
  });

  expect(apiRequest).toHaveBeenCalledWith(
    '/rutina-ejercicio/rutina-ejercicio-1',
    'tok',
    expect.objectContaining({
      method: 'PATCH',
      body: expect.stringContaining('"descansoSegundos":60'),
    }),
  );
});
