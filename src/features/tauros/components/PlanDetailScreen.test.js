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
          // guardado como descanso por el bug del selector de unidad, ya
          // eliminado por completo del diseño.
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

test('al editar, el descanso se muestra en segundos crudos, sin selector de unidad que pueda desincronizarse', () => {
  render(<PlanDetailScreen plan={plan} loading={false} token="tok" onUpdate={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

  expect(screen.getByLabelText('Descanso (segundos)')).toHaveValue(3600);
  // No debe existir ningun selector de unidad -- ya no hay nada que cambiar.
  expect(screen.queryByText('Segundos')).not.toBeInTheDocument();
  expect(screen.queryByText('Minutos')).not.toBeInTheDocument();
});

test('muestra un texto de ayuda de solo lectura con el equivalente en minutos, sin afectar el valor guardado', () => {
  render(<PlanDetailScreen plan={plan} loading={false} token="tok" onUpdate={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

  expect(screen.getByText('≈ 60 min')).toBeInTheDocument();
  expect(screen.getByLabelText('Descanso (segundos)')).toHaveValue(3600);
});

test('al guardar, el valor en segundos se manda tal cual al backend, sin ninguna conversion', async () => {
  render(<PlanDetailScreen plan={plan} loading={false} token="tok" onUpdate={() => {}} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  // Corrige el dato viejo directamente: de 3600 (el bug) a 60 segundos reales.
  fireEvent.change(screen.getByLabelText('Descanso (segundos)'), { target: { value: '60' } });

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
