/**
 * GUÍA COMPLETA DE PRUEBAS UNITARIAS - CAJA BLANCA Y CAJA NEGRA
 * 
 * Este archivo contiene ejemplos de pruebas unitarias para React
 * usando React Testing Library y Jest
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

/**
 * EJEMPLO 1: PRUEBAS DE CAJA NEGRA - Componente Login
 * Probamos el comportamiento externo sin conocer la implementación interna
 */

// Simulemos un componente Login
const LoginComponent = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('El correo y contraseña son requeridos');
      return;
    }

    if (!email.includes('@')) {
      setError('El correo debe ser válido');
      return;
    }

    onLogin({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Correo:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@test.com"
        />
      </div>
      <div>
        <label htmlFor="password">Contraseña:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Pass123!"
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};

describe('LoginComponent - PRUEBAS DE CAJA NEGRA', () => {
  it('Debe mostrar un formulario de login con campos de correo y contraseña', () => {
    const mockOnLogin = jest.fn();
    render(<LoginComponent onLogin={mockOnLogin} />);

    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('Debe mostrar error cuando los campos están vacíos', () => {
    const mockOnLogin = jest.fn();
    render(<LoginComponent onLogin={mockOnLogin} />);

    const button = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(button);

    expect(screen.getByText(/el correo y contraseña son requeridos/i)).toBeInTheDocument();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('Debe mostrar error cuando el correo no es válido', () => {
    const mockOnLogin = jest.fn();
    render(<LoginComponent onLogin={mockOnLogin} />);

    const emailInput = screen.getByLabelText(/correo/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const button = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
    fireEvent.click(button);

    expect(screen.getByText(/el correo debe ser válido/i)).toBeInTheDocument();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('Debe llamar a onLogin con datos correctos cuando el formulario es válido', () => {
    const mockOnLogin = jest.fn();
    render(<LoginComponent onLogin={mockOnLogin} />);

    const emailInput = screen.getByLabelText(/correo/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const button = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'usuario@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
    fireEvent.click(button);

    expect(mockOnLogin).toHaveBeenCalledWith({
      email: 'usuario@test.com',
      password: 'Pass123!',
    });
  });

  it('Debe permitir al usuario escribir en los campos de entrada', async () => {
    const mockOnLogin = jest.fn();
    render(<LoginComponent onLogin={mockOnLogin} />);

    const emailInput = screen.getByLabelText(/correo/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'SecurePass123!');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('SecurePass123!');
  });
});

/**
 * EJEMPLO 2: PRUEBAS DE CAJA BLANCA - Componente con lógica interna
 * Probamos la lógica específica del componente sabiendo cómo funciona internamente
 */

const UsuarioProfileComponent = ({ usuarioId }) => {
  const [usuario, setUsuario] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [edad, setEdad] = React.useState(null);

  React.useEffect(() => {
    const fetchUsuario = async () => {
      setIsLoading(true);
      try {
        // Simulación de API call
        const mockResponse = {
          userId: usuarioId,
          nombre: 'Test',
          apellido: 'User',
          correo: 'test@test.com',
          cedula: '12345678',
          fechaNacimiento: '1990-01-15',
        };
        
        // Lógica para calcular edad (esto es lo que probamos en caja blanca)
        const birthDate = new Date(mockResponse.fechaNacimiento);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        
        setEdad(calculatedAge);
        setUsuario(mockResponse);
      } catch (error) {
        console.error('Error fetching usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsuario();
  }, [usuarioId]);

  if (isLoading) return <div>Cargando...</div>;
  if (!usuario) return <div>Usuario no encontrado</div>;

  return (
    <div>
      <h2>{usuario.nombre} {usuario.apellido}</h2>
      <p>Edad: {edad}</p>
      <p>Correo: {usuario.correo}</p>
      <p>Cédula: {usuario.cedula}</p>
    </div>
  );
};

describe('UsuarioProfileComponent - PRUEBAS DE CAJA BLANCA', () => {
  it('Debe renderizar los datos del usuario correctamente', async () => {
    render(<UsuarioProfileComponent usuarioId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      expect(screen.getByText(/test@test.com/i)).toBeInTheDocument();
      expect(screen.getByText(/12345678/i)).toBeInTheDocument();
    });
  });

  it('Debe mostrar estado de carga inicialmente', () => {
    render(<UsuarioProfileComponent usuarioId="1" />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('Debe calcular la edad correctamente', async () => {
    render(<UsuarioProfileComponent usuarioId="1" />);

    await waitFor(() => {
      // Edad de 1990-01-15 en 2026-05-04 es 36 años
      expect(screen.getByText(/Edad: 36/i)).toBeInTheDocument();
    });
  });
});

/**
 * EJEMPLO 3: TESTS DE HOOKS PERSONALIZADOS (Caja Blanca)
 */

import { renderHook, act } from '@testing-library/react';

const useUsuarioForm = () => {
  const [formData, setFormData] = React.useState({
    nombre: '',
    apellido: '',
    correo: '',
  });
  const [errors, setErrors] = React.useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido) newErrors.apellido = 'El apellido es requerido';
    if (!formData.correo.includes('@')) newErrors.correo = 'El correo debe ser válido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { formData, errors, handleChange, validate };
};

describe('useUsuarioForm - PRUEBAS DE HOOKS (Caja Blanca)', () => {
  it('Debe inicializar el formulario con valores vacíos', () => {
    const { result } = renderHook(() => useUsuarioForm());

    expect(result.current.formData.nombre).toBe('');
    expect(result.current.formData.apellido).toBe('');
    expect(result.current.formData.correo).toBe('');
    expect(result.current.errors).toEqual({});
  });

  it('Debe actualizar los datos del formulario cuando se llama handleChange', () => {
    const { result } = renderHook(() => useUsuarioForm());

    act(() => {
      result.current.handleChange('nombre', 'Juan');
      result.current.handleChange('apellido', 'Pérez');
      result.current.handleChange('correo', 'juan@test.com');
    });

    expect(result.current.formData.nombre).toBe('Juan');
    expect(result.current.formData.apellido).toBe('Pérez');
    expect(result.current.formData.correo).toBe('juan@test.com');
  });

  it('Debe limpiar errores cuando el usuario empieza a escribir', () => {
    const { result } = renderHook(() => useUsuarioForm());

    // Simular validación que genera un error
    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.nombre).toBeDefined();

    // Ahora escribir debería limpiar el error
    act(() => {
      result.current.handleChange('nombre', 'Juan');
    });

    expect(result.current.errors.nombre).toBeNull();
  });

  it('Debe validar correctamente el formulario', () => {
    const { result } = renderHook(() => useUsuarioForm());

    // Validar con datos vacíos
    let isValid;
    act(() => {
      isValid = result.current.validate();
    });
    expect(isValid).toBe(false);

    // Llenar datos válidos
    act(() => {
      result.current.handleChange('nombre', 'Juan');
      result.current.handleChange('apellido', 'Pérez');
      result.current.handleChange('correo', 'juan@test.com');
    });

    // Validar nuevamente
    act(() => {
      isValid = result.current.validate();
    });
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });
});
