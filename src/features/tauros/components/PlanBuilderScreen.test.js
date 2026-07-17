import { fireEvent, render, screen, within } from '@testing-library/react';
import PlanBuilderScreen from './PlanBuilderScreen';
import { apiRequest } from '../services/api';

jest.mock('../services/api', () => ({
  apiRequest: jest.fn().mockResolvedValue({}),
}));

const ejercicios = [
  { ejercicioId: 'ej-1', nombre: 'Abduccion', categoria: null, tipo: null, maquina: null },
];

const plan = {
  planEntrenamientoId: 'plan-1',
  nombre: 'Prueba piernas 2',
  descripcion: 'Plan de prueba',
  duracionDias: 2,
  objetivo: 'Fuerza',
  esPlantilla: true,
  rutinasDia: [
    {
      rutinaDiaId: 'dia-1',
      numeroDia: 1,
      nombre: 'A',
      descripcion: 'Dia 1',
      descansoSegundos: 90,
      rutinasEjercicio: [
        {
          rutinaEjercicioId: 'rutina-ejercicio-1',
          orden: 1,
          series: 3,
          repeticiones: 12,
          // Descanso especifico propio del ejercicio, distinto del general
          // del dia (90) -- esto es justo lo que se perdia al navegar a otro
          // dia y volver, porque buildDraftExercise se re-llamaba sobre un
          // draft que ya no tenia "descansoSegundos" (tenia valor+unidad).
          descansoSegundos: 45,
          ejercicio: { ejercicioId: 'ej-1', nombre: 'Abduccion' },
        },
      ],
    },
    {
      rutinaDiaId: 'dia-2',
      numeroDia: 2,
      nombre: 'B',
      descripcion: 'Dia 2',
      descansoSegundos: 60,
      rutinasEjercicio: [],
    },
  ],
};

const baseProps = {
  token: 'tok',
  plans: [plan],
  rutinaDias: plan.rutinasDia,
  rutinaEjercicios: plan.rutinasDia.flatMap((dia) => dia.rutinasEjercicio),
  ejercicios,
  usuarios: [],
  onOpenPlan: () => {},
  onRefresh: () => Promise.resolve(),
  initialEditPlanId: 'plan-1',
};

beforeEach(() => {
  apiRequest.mockClear();
});

test('navegar a otro dia y volver no pierde el descanso especifico del ejercicio (bug de fondo ya arreglado)', () => {
  render(<PlanBuilderScreen {...baseProps} />);

  // Arranca directo en modo edicion del plan (initialEditPlanId), en el dia 1.
  const specificRestInput = screen.getByLabelText('Descanso específico (segundos)');
  expect(specificRestInput).toHaveValue(45);

  // Navega al dia 2 y de vuelta al dia 1.
  fireEvent.click(screen.getByRole('button', { name: /Dia 2/ }));
  fireEvent.click(screen.getByRole('button', { name: /Dia 1/ }));

  // El descanso especifico del ejercicio tiene que seguir siendo 45, no
  // haberse reseteado a vacio ni haber heredado el general del dia.
  expect(screen.getByLabelText('Descanso específico (segundos)')).toHaveValue(45);
});

test('no hay ningun selector de Segundos/Minutos en el asistente -- todo se edita en segundos', () => {
  render(<PlanBuilderScreen {...baseProps} />);

  expect(screen.queryByRole('combobox', { name: /^Unidad/ })).not.toBeInTheDocument();
});

test('el descanso general del dia se ve en segundos crudos, con ayuda de solo lectura', () => {
  render(<PlanBuilderScreen {...baseProps} />);

  const dayRestInput = screen.getByLabelText('Descanso general (segundos)');
  expect(dayRestInput).toHaveValue(90);
  expect(screen.getByText('≈ 1 min 30 seg')).toBeInTheDocument();
});
