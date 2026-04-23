function formatDateOnly(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().slice(0, 10);
}

function formatTimeOnly(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toISOString().slice(11, 16);
}

export function resolveValue(obj, path) {
  if (path === 'usuario.nombreCompleto') {
    const usuario = obj?.usuario;
    if (!usuario) {
      return '-';
    }

    const fullName = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim();
    return fullName || '-';
  }

  const pieces = path.split('.');
  let result = obj;

  for (let index = 0; index < pieces.length; index += 1) {
    if (result === null || result === undefined) {
      return '-';
    }
    result = result[pieces[index]];
  }

  if (result === null || result === undefined || result === '') {
    return '-';
  }

  if (typeof result === 'string') {
    const lowerPath = path.toLowerCase();
    const isDateField = lowerPath.includes('fecha') || lowerPath.includes('date');
    const looksLikeIso = result.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(result);

    if (isDateField && looksLikeIso) {
      return formatDateOnly(result);
    }
  }

  if (result instanceof Date) {
    return formatDateOnly(result);
  }

  if (typeof result === 'object') {
    return JSON.stringify(result);
  }

  return String(result);
}

export function buildInitialForm(config) {
  if (!config?.formFields) {
    return {};
  }

  return config.formFields.reduce((acc, field) => {
    if (field === 'tipoEntidad') {
      return { ...acc, [field]: 'EJERCICIO' };
    }

    if (field === 'rol') {
      return { ...acc, [field]: 'user' };
    }

    return { ...acc, [field]: '' };
  }, {});
}

function formatDateInputValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTimeInputValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 16);
}

function formatTimeInputValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(11, 16);
}

export function buildFormFromRecord(record, config) {
  if (!record || !config?.formFields) {
    return buildInitialForm(config);
  }

  const resolveFormValue = (field) => {
    const direct = record[field];
    if (direct !== undefined && direct !== null) {
      return direct;
    }

    if (!field.endsWith('Id')) {
      return direct;
    }

    const relationKey = `${field.slice(0, -2)}`;
    const relation = record[relationKey];
    if (!relation || typeof relation !== 'object') {
      return direct;
    }

    return relation[field] ?? direct;
  };

  return config.formFields.reduce((acc, field) => {
    const value = resolveFormValue(field);

    if (field === 'password') {
      return { ...acc, [field]: '' };
    }

    if (field === 'tipoEntidad') {
      return { ...acc, [field]: value || 'EJERCICIO' };
    }

    if (field === 'rol') {
      return { ...acc, [field]: value || 'user' };
    }

    if (field === 'fechaHora') {
      return {
        ...acc,
        [field]: formatDateTimeInputValue(value),
        fechaHoraFecha: formatDateInputValue(value),
        fechaHoraHora: formatTimeInputValue(value),
      };
    }

    if (field === 'fechaNacimiento') {
      return { ...acc, [field]: formatDateInputValue(value) };
    }

    if (field === 'apertura' || field === 'cierre') {
      return { ...acc, [field]: value ? String(value).slice(0, 5) : '' };
    }

    return { ...acc, [field]: value ?? '' };
  }, {});
}

export function normalizePayload(form, config) {
  const payload = { ...form };

  if (payload.fechaHoraFecha || payload.fechaHoraHora) {
    const datePart = payload.fechaHoraFecha
      || (typeof payload.fechaHora === 'string' && payload.fechaHora.includes('T') ? payload.fechaHora.slice(0, 10) : '');
    const timePart = payload.fechaHoraHora
      || (typeof payload.fechaHora === 'string' && payload.fechaHora.includes('T') ? payload.fechaHora.slice(11, 16) : '00:00');

    if (datePart) {
      payload.fechaHora = `${datePart}T${timePart || '00:00'}:00`;
    }
  }

  if (payload.fechaHoraFecha !== undefined) {
    delete payload.fechaHoraFecha;
  }

  if (payload.fechaHoraHora !== undefined) {
    delete payload.fechaHoraHora;
  }

  (config.numberFields || []).forEach((field) => {
    if (payload[field] === '' || payload[field] === null || payload[field] === undefined) {
      delete payload[field];
      return;
    }

    if (payload[field] !== '' && payload[field] !== null && payload[field] !== undefined) {
      payload[field] = Number(payload[field]);
    }
  });

  (config.dateFields || []).forEach((field) => {
    if (payload[field]) {
      payload[field] = new Date(payload[field]).toISOString();
    }
  });

  if (payload.apertura && /^\d{2}:\d{2}$/.test(payload.apertura)) {
    payload.apertura = `${payload.apertura}:00`;
  }

  if (payload.cierre && /^\d{2}:\d{2}$/.test(payload.cierre)) {
    payload.cierre = `${payload.cierre}:00`;
  }

  if (config.key === 'composicion-corporal' && payload.usuarioBusqueda !== undefined) {
    delete payload.usuarioBusqueda;
  }

  if (payload.linkVideoFile !== undefined) {
    delete payload.linkVideoFile;
  }

  if (payload.linkAMFile !== undefined) {
    delete payload.linkAMFile;
  }

  if (payload.linkFotoFile !== undefined) {
    delete payload.linkFotoFile;
  }

  if (payload.musculosSeleccionados !== undefined) {
    delete payload.musculosSeleccionados;
  }

  if (config.key === 'ejercicio' && !payload.maquinaId) {
    payload.maquinaId = null;
  }

  if (payload.usuarioId === '') {
    delete payload.usuarioId;
  }

  return payload;
}

export function isOptionalField(field) {
  return field === 'maquinaId' || field === 'linkVideo' || field === 'linkAM' || field === 'linkFoto' || field === 'usuarioId';
}

export function getInputType(field) {
  if (field === 'fechaHora') {
    return 'datetime-local';
  }

  if (field === 'fechaNacimiento') {
    return 'date';
  }

  if (field === 'apertura' || field === 'cierre') {
    return 'time';
  }

  if (field === 'correo') {
    return 'email';
  }

  if (field === 'password') {
    return 'password';
  }

  if (field === 'telefono' || field === 'cedula' || field === 'numeroMaquina') {
    return 'text';
  }

  return 'text';
}
