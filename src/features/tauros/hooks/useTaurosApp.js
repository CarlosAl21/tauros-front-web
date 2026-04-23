import { useCallback, useEffect, useMemo, useState } from 'react';
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
    rutinaEjercicios: [],
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

  const loadCatalogs = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [usuarios, categorias, tipos, maquinas, planes, rutinaDias, rutinaEjercicios, ejercicios] = await Promise.all([
        apiRequest('/usuario', token),
        apiRequest('/categoria', token),
        apiRequest('/tipo', token),
        apiRequest('/maquina', token),
        apiRequest('/plan-entrenamiento', token),
        apiRequest('/rutina-dia', token),
        apiRequest('/rutina-ejercicio', token),
        apiRequest('/ejercicio', token),
      ]);

      setCatalogs({
        usuarios: Array.isArray(usuarios) ? usuarios : [],
        categorias: Array.isArray(categorias) ? categorias : [],
        tipos: Array.isArray(tipos) ? tipos : [],
        maquinas: Array.isArray(maquinas) ? maquinas : [],
        planes: Array.isArray(planes) ? planes : [],
        rutinaDias: Array.isArray(rutinaDias) ? rutinaDias : [],
        rutinaEjercicios: Array.isArray(rutinaEjercicios) ? rutinaEjercicios : [],
        ejercicios: Array.isArray(ejercicios) ? ejercicios : [],
      });
    } catch (_err) {
      // Si un catalogo falla por permisos, la app sigue funcionando.
    }
  }, [token]);

  useEffect(() => {
    loadCatalogs();
  }, [activeModuleKey, loadCatalogs]);

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

  useEffect(() => {
    if (formMode !== 'edit') {
      return;
    }

    if (selectedId) {
      return;
    }

    setFormMode('closed');
    setCreateForm(buildInitialForm(activeModule));
  }, [activeModule, formMode, selectedId]);

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

  const openEditForm = (recordOverride = null) => {
    const recordToEdit = recordOverride || selectedRecord;

    if (!recordToEdit || !activeModule.canCreate) {
      return;
    }

    const nextForm = buildFormFromRecord(recordToEdit, activeModule);
    if (activeModule.idField && recordToEdit?.[activeModule.idField]) {
      nextForm[activeModule.idField] = String(recordToEdit[activeModule.idField]);
    }

    setCreateForm(nextForm);
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
      const linkVideoFile = createForm.linkVideoFile;
      const linkAMFile = createForm.linkAMFile;
      const linkFotoFile = createForm.linkFotoFile;
      const payload = normalizePayload(createForm, activeModule);
      const hasTextValue = (value) => typeof value === 'string' && value.trim().length > 0;
      const editRecordId = createForm?.[activeModule.idField] || selectedRecord?.[activeModule.idField];

      if (activeModule.key === 'usuario') {
        if (formMode === 'edit' && user?.rol !== 'admin') {
          payload.rol = selectedRecord?.rol || 'user';
        } else {
          payload.rol = user?.rol === 'admin' ? (payload.rol || 'user') : 'user';
        }
      }

      if (activeModule.key === 'ejercicio' && formMode === 'edit') {
        const selectedExerciseId = editRecordId;
        if (selectedExerciseId) {
          payload.ejercicioId = String(selectedExerciseId);
        }
      }

      if (activeModule.key === 'ejercicio') {
        const categoriaSeleccionada = payload.categoriaId
          || createForm.categoriaId
          || selectedRecord?.categoria?.categoriaId
          || selectedRecord?.categoriaId;
        const tipoSeleccionado = payload.tipoId
          || createForm.tipoId
          || selectedRecord?.tipo?.tipoId
          || selectedRecord?.tipoId;

        if (categoriaSeleccionada) {
          payload.categoriaId = String(categoriaSeleccionada);
        }

        if (tipoSeleccionado) {
          payload.tipoId = String(tipoSeleccionado);
        }

        if (!payload.categoriaId || !payload.tipoId) {
          throw new Error('Debes seleccionar categoria y tipo para guardar el ejercicio');
        }
      }

      if (activeModule.key === 'horario' && formMode === 'create') {
        const selectedDays = Array.isArray(createForm.diasSeleccionados)
          ? createForm.diasSeleccionados
          : [];

        if (!selectedDays.length) {
          throw new Error('Selecciona al menos un dia de la semana');
        }

        if (!payload.apertura || !payload.cierre) {
          throw new Error('Define hora de apertura y cierre por defecto');
        }

        const byDay = createForm.horariosPorDia && typeof createForm.horariosPorDia === 'object'
          ? createForm.horariosPorDia
          : {};

        payload.diasSeleccionados = selectedDays;
        payload.horariosPorDia = selectedDays.map((day) => ({
          diaSemana: day,
          apertura: byDay[day]?.apertura || payload.apertura,
          cierre: byDay[day]?.cierre || payload.cierre,
        }));
      }

      const hasVideoFile = typeof File !== 'undefined' && linkVideoFile instanceof File;
      const hasAMFile = typeof Blob !== 'undefined' && linkAMFile instanceof Blob;

      if (activeModule.key === 'ejercicio' && formMode === 'create') {
        const hasVideoValue = hasVideoFile || hasTextValue(payload.linkVideo);
        const hasAMValue = hasAMFile || hasTextValue(payload.linkAM);

        if (!hasVideoValue) {
          throw new Error('Debes enviar linkVideo como archivo o enlace valido');
        }

        if (!hasAMValue) {
          throw new Error('Debes enviar linkAM como archivo o enlace valido');
        }
      }

      const shouldUseMultipart = activeModule.key === 'ejercicio'
        && (hasVideoFile || hasAMFile);

      const shouldUploadMachinePhoto = activeModule.key === 'maquina'
        && typeof File !== 'undefined'
        && linkFotoFile instanceof File;

      if (shouldUploadMachinePhoto) {
        delete payload.linkFoto;
      }

      if (activeModule.key === 'maquina' && formMode === 'create' && !shouldUploadMachinePhoto) {
        throw new Error('Debes seleccionar una foto de la maquina');
      }

      const requestBody = (shouldUseMultipart || shouldUploadMachinePhoto)
        ? (() => {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              return;
            }
            formData.append(key, String(value));
          });

          if (hasVideoFile) {
            formData.append('linkVideo', linkVideoFile);
          }

          if (hasAMFile) {
            const amFile = linkAMFile instanceof File ? linkAMFile : new File([linkAMFile], `am-${Date.now()}.jpg`, { type: 'image/jpeg' });
            formData.append('linkAM', amFile);
          }

          if (activeModule.key === 'ejercicio') {
            formData.set('categoriaId', String(payload.categoriaId || ''));
            formData.set('tipoId', String(payload.tipoId || ''));
          }

          if (shouldUploadMachinePhoto) {
            formData.append('linkFoto', linkFotoFile);
          }

          return formData;
        })()
        : JSON.stringify(payload);

      if (formMode === 'edit' && editRecordId) {
        await apiRequest(`${activeModule.endpoint}/${editRecordId}`, token, {
          method: 'PATCH',
          body: requestBody,
        });
      } else {
        await apiRequest(activeModule.endpoint, token, {
          method: 'POST',
          body: requestBody,
        });
      }

      setSuccess(formMode === 'edit' ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
      setCreateForm(buildInitialForm(activeModule));
      setFormMode('closed');
      setSelectedId('');
      await reloadModule();
      await loadCatalogs();
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
      await loadCatalogs();
      window.location.reload();
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
    refreshCatalogs: loadCatalogs,
    setActiveModuleKey,
    setAuthForm,
    setCreateForm,
    setSearchTerm,
    setSelectedId,
  };
}

