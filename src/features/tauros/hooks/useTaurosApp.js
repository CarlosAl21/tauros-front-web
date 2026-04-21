import { useEffect, useMemo, useState } from 'react';
import { MODULE_MAP } from '../config/modules';
import { apiRequest } from '../services/api';
import { buildFormFromRecord, buildInitialForm, normalizePayload } from '../utils/form';

const EMPTY_DASHBOARD = {
  usuarios: [],
  ejercicios: [],
  maquinas: [],
  planes: [],
  eventos: [],
  sugerencias: [],
};

const ALLOWED_ROLES = ['admin', 'coach'];

export function useTaurosApp() {
  const [activeModuleKey, setActiveModuleKey] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [moduleMessage, setModuleMessage] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [formMode, setFormMode] = useState('closed');

  const [token, setToken] = useState(() => localStorage.getItem('tauros_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('tauros_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [authForm, setAuthForm] = useState({
    correo: '',
    password: '',
    cedula: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
  });

  const [createForm, setCreateForm] = useState({});
  const [catalogs, setCatalogs] = useState({
    usuarios: [],
    categorias: [],
    tipos: [],
    maquinas: [],
    planes: [],
    rutinaDias: [],
    ejercicios: [],
  });
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);

  const activeModule = MODULE_MAP[activeModuleKey];

  useEffect(() => {
    setCreateForm(buildInitialForm(activeModule));
    setSelectedId('');
    setFormMode('closed');
    setError('');
    setSuccess('');
    setModuleMessage('');
  }, [activeModule]);

  useEffect(() => {
    if (!token) {
      return;
    }

    localStorage.setItem('tauros_token', token);
    if (user) {
      localStorage.setItem('tauros_user', JSON.stringify(user));
    }
  }, [token, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadCatalogs = async () => {
      try {
        const [usuarios, categorias, tipos, maquinas, planes, rutinaDias, ejercicios] = await Promise.all([
          apiRequest('/usuario', token),
          apiRequest('/categoria', token),
          apiRequest('/tipo', token),
          apiRequest('/maquina', token),
          apiRequest('/plan-entrenamiento', token),
          apiRequest('/rutina-dia', token),
          apiRequest('/ejercicio', token),
        ]);

        setCatalogs({
          usuarios: Array.isArray(usuarios) ? usuarios : [],
          categorias: Array.isArray(categorias) ? categorias : [],
          tipos: Array.isArray(tipos) ? tipos : [],
          maquinas: Array.isArray(maquinas) ? maquinas : [],
          planes: Array.isArray(planes) ? planes : [],
          rutinaDias: Array.isArray(rutinaDias) ? rutinaDias : [],
          ejercicios: Array.isArray(ejercicios) ? ejercicios : [],
        });
      } catch (_err) {
        // Si un catalogo falla por permisos, la app sigue funcionando.
      }
    };

    loadCatalogs();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadModuleData = async () => {
      try {
        setLoading(true);
        setError('');
        setModuleMessage('');

        if (activeModuleKey === 'dashboard') {
          const [usuarios, ejercicios, maquinas, planes, eventos, sugerencias] = await Promise.all([
            apiRequest('/usuario', token),
            apiRequest('/ejercicio', token),
            apiRequest('/maquina', token),
            apiRequest('/plan-entrenamiento', token),
            apiRequest('/evento', token),
            apiRequest('/sugerencia', token),
          ]);

          setDashboardData({
            usuarios: Array.isArray(usuarios) ? usuarios : [],
            ejercicios: Array.isArray(ejercicios) ? ejercicios : [],
            maquinas: Array.isArray(maquinas) ? maquinas : [],
            planes: Array.isArray(planes) ? planes : [],
            eventos: Array.isArray(eventos) ? eventos : [],
            sugerencias: Array.isArray(sugerencias) ? sugerencias : [],
          });
          setRecords([]);
          return;
        }

        const response = await apiRequest(activeModule.endpoint, token);
        if (Array.isArray(response)) {
          setRecords(response);
        } else {
          setRecords([]);
          setModuleMessage(typeof response === 'string' ? response : JSON.stringify(response));
        }
      } catch (err) {
        setError(err.message || 'No se pudo cargar la informacion del modulo');
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [activeModule, activeModuleKey, token]);

  const metrics = useMemo(() => ([
    { label: 'Usuarios', value: dashboardData.usuarios.length },
    { label: 'Ejercicios', value: dashboardData.ejercicios.length },
    { label: 'Maquinas', value: dashboardData.maquinas.length },
    { label: 'Planes', value: dashboardData.planes.length },
    { label: 'Eventos', value: dashboardData.eventos.length },
    { label: 'Sugerencias', value: dashboardData.sugerencias.length },
  ]), [dashboardData]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) {
      return records;
    }

    const value = searchTerm.toLowerCase();

    if (activeModuleKey === 'composicion-corporal') {
      return records.filter((item) => {
        const usuario = item?.usuario;
        const usuarioTexto = usuario
          ? `${usuario.cedula || ''} ${usuario.nombre || ''} ${usuario.apellido || ''}`
          : '';

        const base = JSON.stringify(item).toLowerCase();
        return `${base} ${usuarioTexto.toLowerCase()}`.includes(value);
      });
    }

    return records.filter((item) => JSON.stringify(item).toLowerCase().includes(value));
  }, [activeModuleKey, records, searchTerm]);

  const selectedRecord = useMemo(() => {
    if (!selectedId || !activeModule?.idField) {
      return null;
    }

    return records.find((row) => String(row[activeModule.idField]) === String(selectedId)) || null;
  }, [activeModule, records, selectedId]);

  const reloadModule = async () => {
    if (!token || activeModuleKey === 'dashboard') {
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(activeModule.endpoint, token);
      if (Array.isArray(response)) {
        setRecords(response);
      } else {
        setRecords([]);
        setModuleMessage(typeof response === 'string' ? response : JSON.stringify(response));
      }
    } catch (err) {
      setError(err.message || 'No se pudo recargar el modulo');
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = (presetForm = null, keepSelection = false) => {
    const initialForm = buildInitialForm(activeModule);
    setCreateForm(presetForm ? { ...initialForm, ...presetForm } : initialForm);
    setFormMode('create');
    if (!keepSelection) {
      setSelectedId('');
    }
    setError('');
    setSuccess('');
  };

  const openEditForm = () => {
    if (!selectedRecord || !activeModule.canCreate) {
      return;
    }

    setCreateForm(buildFormFromRecord(selectedRecord, activeModule));
    setFormMode('edit');
    setError('');
    setSuccess('');
  };

  const closeForm = () => {
    setFormMode('closed');
    setCreateForm(buildInitialForm(activeModule));
    setSelectedId('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!activeModule.canCreate) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const payload = normalizePayload(createForm, activeModule);
      if (activeModule.key === 'usuario') {
        if (formMode === 'edit' && user?.rol !== 'admin') {
          payload.rol = selectedRecord?.rol || 'user';
        } else {
          payload.rol = user?.rol === 'admin' ? (payload.rol || 'user') : 'user';
        }
      }

      if (formMode === 'edit' && selectedRecord?.[activeModule.idField]) {
        await apiRequest(`${activeModule.endpoint}/${selectedRecord[activeModule.idField]}`, token, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(activeModule.endpoint, token, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setSuccess(formMode === 'edit' ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
      setCreateForm(buildInitialForm(activeModule));
      setFormMode('closed');
      setSelectedId('');
      await reloadModule();
    } catch (err) {
      setError(err.message || (formMode === 'edit' ? 'No se pudo actualizar el registro' : 'No se pudo crear el registro'));
    }
  };

  const handleDelete = async () => {
    if (!activeModule.canDelete || !selectedRecord || !activeModule.idField) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await apiRequest(`${activeModule.endpoint}/${selectedRecord[activeModule.idField]}`, token, {
        method: 'DELETE',
      });

      setSuccess('Registro eliminado correctamente');
      setSelectedId('');
      await reloadModule();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el registro');
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const endpoint = '/auth/login';
      const body = {
        correo: authForm.correo,
        password: authForm.password,
      };

      const response = await apiRequest(endpoint, '', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!ALLOWED_ROLES.includes(response.user?.rol)) {
        setToken('');
        setUser(null);
        localStorage.removeItem('tauros_token');
        localStorage.removeItem('tauros_user');
        setError('Solo admin o coach pueden ingresar al sistema');
        return;
      }

      setToken(response.access_token);
      setUser(response.user);
      setAuthForm({
        correo: '',
        password: '',
        cedula: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        telefono: '',
      });
      setSuccess('Sesion iniciada correctamente');
    } catch (err) {
      setError(err.message || 'Error de autenticacion');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setRecords([]);
    setDashboardData(EMPTY_DASHBOARD);
    setError('');
    setSuccess('');
    localStorage.removeItem('tauros_token');
    localStorage.removeItem('tauros_user');
  };

  const getOptionsForField = (field) => {
    if (field === 'categoriaId') {
      return catalogs.categorias.map((item) => ({ value: item.categoriaId, label: item.nombre }));
    }

    if (field === 'tipoId') {
      return catalogs.tipos.map((item) => ({ value: item.tipoId, label: item.nombre }));
    }

    if (field === 'maquinaId') {
      return catalogs.maquinas.map((item) => ({ value: item.maquinaId, label: item.nombre }));
    }

    if (field === 'usuarioId') {
      return catalogs.usuarios.map((item) => ({ value: item.userId, label: `${item.nombre} ${item.apellido} (${item.correo})` }));
    }

    if (field === 'planEntrenamientoId') {
      return catalogs.planes.map((item) => ({ value: item.planEntrenamientoId, label: item.nombre }));
    }

    if (field === 'rutinaDiaId') {
      return catalogs.rutinaDias.map((item) => ({ value: item.rutinaDiaId, label: `${item.numeroDia} - ${item.nombre}` }));
    }

    if (field === 'ejercicioId') {
      return catalogs.ejercicios.map((item) => ({ value: item.ejercicioId, label: item.nombre }));
    }

    if (field === 'tipoEntidad') {
      return [
        { value: 'EJERCICIO', label: 'EJERCICIO' },
        { value: 'RUTINA', label: 'RUTINA' },
        { value: 'EVENTO', label: 'EVENTO' },
      ];
    }

    if (field === 'rol') {
      return [
        { value: 'user', label: 'user' },
        { value: 'coach', label: 'coach' },
        { value: 'admin', label: 'admin' },
      ];
    }

    return [];
  };

  return {
    activeModule,
    activeModuleKey,
    authForm,
    catalogs,
    createForm,
    formMode,
    dashboardData,
    error,
    filteredRecords,
    loading,
    metrics,
    moduleMessage,
    records,
    searchTerm,
    selectedId,
    selectedRecord,
    success,
    token,
    user,
    getOptionsForField,
    handleAuth,
    handleCreate,
    handleDelete,
    handleLogout,
    openCreateForm,
    openEditForm,
    closeForm,
    reloadModule,
    setActiveModuleKey,
    setAuthForm,
    setCreateForm,
    setSearchTerm,
    setSelectedId,
  };
}
