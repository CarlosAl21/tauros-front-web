import { fireEvent, render, screen } from '@testing-library/react';
import LoadProgressPanel from './LoadProgressPanel';
import { fetchLoadHistory, fetchLoadSummary } from '../services/api';

jest.mock('../services/api', () => ({
  fetchLoadSummary: jest.fn(),
  fetchLoadHistory: jest.fn(),
}));

const summary = [
  {
    ejercicioId: 'ej-1',
    ejercicioNombre: 'Sentadilla',
    registros: 3,
    primeraCargaKg: 60,
    primeraFecha: '2026-09-01T10:00:00.000Z',
    ultimaCargaKg: 70,
    ultimaFecha: '2026-09-20T10:00:00.000Z',
    unidad: 'kg',
  },
];

const history = [
  { registroCargaId: 'r3', ejercicioId: 'ej-1', rutinaEjercicioId: null, cargaKg: 70, unidad: 'kg', fechaRegistro: '2026-09-20T10:00:00.000Z' },
  { registroCargaId: 'r2', ejercicioId: 'ej-1', rutinaEjercicioId: null, cargaKg: 65, unidad: 'kg', fechaRegistro: '2026-09-10T10:00:00.000Z' },
  { registroCargaId: 'r1', ejercicioId: 'ej-1', rutinaEjercicioId: null, cargaKg: 60, unidad: 'kg', fechaRegistro: '2026-09-01T10:00:00.000Z' },
];

beforeEach(() => {
  fetchLoadSummary.mockReset();
  fetchLoadHistory.mockReset();
});

test('shows the empty state when the user has no records', async () => {
  fetchLoadSummary.mockResolvedValue([]);
  render(<LoadProgressPanel usuarioId="u-1" />);

  expect(await screen.findByText('Este usuario aún no registró cargas')).toBeInTheDocument();
  expect(fetchLoadSummary).toHaveBeenCalledWith('u-1');
});

test('shows the error state with a retry action', async () => {
  fetchLoadSummary.mockRejectedValueOnce(new Error('Fallo backend')).mockResolvedValueOnce([]);
  render(<LoadProgressPanel usuarioId="u-1" />);

  expect(await screen.findByText('Fallo backend')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Este usuario aún no registró cargas')).toBeInTheDocument();
});

test('renders the summary, toggles units and expands the history once', async () => {
  fetchLoadSummary.mockResolvedValue(summary);
  fetchLoadHistory.mockResolvedValue(history);
  render(<LoadProgressPanel usuarioId="u-1" />);

  expect(await screen.findByText('Sentadilla')).toBeInTheDocument();
  expect(screen.getByText('60 kg → 70 kg')).toBeInTheDocument();
  expect(screen.getByText('+10 kg')).toBeInTheDocument();
  expect(screen.getByText('3 registros')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'lb' }));
  expect(screen.getByText('132.3 lb → 154.3 lb')).toBeInTheDocument();
  expect(screen.getByText('+22 lb')).toBeInTheDocument();

  const row = screen.getByRole('button', { name: /Sentadilla/ });
  fireEvent.click(row);
  expect(await screen.findByText('143.3 lb')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Tendencia de carga' })).toBeInTheDocument();
  expect(fetchLoadHistory).toHaveBeenCalledWith('u-1', 'ej-1');

  // Collapse and re-expand: history is cached, no second request.
  fireEvent.click(row);
  fireEvent.click(row);
  expect(await screen.findByText('143.3 lb')).toBeInTheDocument();
  expect(fetchLoadHistory).toHaveBeenCalledTimes(1);
});
