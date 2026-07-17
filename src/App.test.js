import { render, screen } from '@testing-library/react';
import App from './App';
import { TAUROS_USER_KEY } from './features/tauros/services/api';

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

test('sin sesion activa, la app redirige a la pantalla de login', () => {
  render(<App />);

  expect(screen.getByRole('button', { name: /iniciar sesion/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
});

test('con sesion activa, la app muestra el panel autenticado en vez del login', async () => {
  // La sesion real ahora vive en una cookie httpOnly (no accesible/simulable
  // desde el test); el usuario en localStorage es la unica senal que la app
  // usa para saber si hay sesion activa.
  localStorage.setItem(
    TAUROS_USER_KEY,
    JSON.stringify({ userId: '1', nombre: 'Coach', apellido: 'Demo', correo: 'coach@tauros.test', rol: 'coach' })
  );

  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => [],
  });

  render(<App />);

  expect(await screen.findByRole('button', { name: /cerrar sesion/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /iniciar sesion/i })).not.toBeInTheDocument();
});
