import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInputType, isOptionalField, resolveValue } from '../utils/form';

function formatLabel(field) {
  const labels = {
    userId: 'ID usuario',
    cedula: 'Cedula',
    nombre: 'Nombre',
    apellido: 'Apellido',
    fechaNacimiento: 'Fecha de nacimiento',
    correo: 'Correo',
    password: 'Contrasena',
    telefono: 'Telefono',
    rol: 'Rol',
    isActive: 'Activo',
    fechaHora: 'Fecha y hora',
    tipoEntidad: 'Tipo de entidad',
    contenido: 'Contenido',
    entidadId: 'ID de entidad',
    descripcion: 'Descripcion',
    linkVideo: 'Link de video',
    linkAM: 'Link AM',
    linkFoto: 'Link de foto',
    diasSemanales: 'Dias semanales',
    apertura: 'Apertura',
    cierre: 'Cierre',
    'usuario.nombreCompleto': 'Usuario',
    peso: 'Peso (kg)',
    talla: 'Talla (m)',
    grasaCorporal: 'Grasa corporal (%)',
    edadCorporal: 'Edad corporal (años)',
    grasaVisceral: 'Grasa visceral (%)',
    composicionCorporalId: 'Composicion corporal',
    planEntrenamientoId: 'Plan de entrenamiento',
    rutinaDiaId: 'Rutina dia',
    ejercicioId: 'Ejercicio',
    maquinaId: 'Maquina',
    categoriaId: 'Categoria',
    tipoId: 'Tipo',
    'categoria.nombre': 'Categoria',
    'tipo.nombre': 'Tipo',
    'maquina.nombre': 'Maquina',
  };

  if (labels[field]) {
    return labels[field];
  }

  const baseField = field.includes('.') ? field.split('.').at(-1) : field;
  if (labels[baseField]) {
    return labels[baseField];
  }

  return baseField
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function getFieldOptions(activeModule, field, user, getOptionsForField) {
  if (activeModule.key === 'usuario' && field === 'rol') {
    if (user?.rol !== 'admin') {
      return [{ value: 'user', label: 'user' }];
    }

    return [
      { value: 'user', label: 'user' },
      { value: 'coach', label: 'coach' },
      { value: 'admin', label: 'admin' },
    ];
  }

  return getOptionsForField(field);
}

function shouldHideField(field, idField) {
  if (field === idField) {
    return true;
  }

  const lastSegment = field.includes('.') ? field.split('.').at(-1) : field;
  return lastSegment === 'userId' || lastSegment === 'composicionCorporalId' || lastSegment?.endsWith('Id');
}

function findUsuarioByCedula(usuariosCatalog, cedula) {
  const value = cedula.trim().toLowerCase();
  if (!value) {
    return [];
  }

  return usuariosCatalog.filter((item) => String(item.cedula ?? '').toLowerCase().includes(value));
}

function toDateValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getTime();
}

function getCompositionUserId(record) {
  return record?.usuario?.userId || record?.usuarioId || null;
}

function ModuleScreen({
  activeModule,
  user,
  usuariosCatalog,
  filteredRecords,
  selectedId,
  setSelectedId,
  loading,
  selectedRecord,
  reloadModule,
  handleDelete,
  createForm,
  setCreateForm,
  handleCreate,
  formMode,
  openCreateForm,
  openEditForm,
  closeForm,
  getOptionsForField,
}) {
  const isUserModule = activeModule.key === 'usuario';
  const isCompositionModule = activeModule.key === 'composicion-corporal';
  const isExerciseModule = activeModule.key === 'ejercicio';
  const navigate = useNavigate();
  const visibleFields = (activeModule.fields || []).filter((field) => !shouldHideField(field, activeModule.idField));
  const [usuarioSearch, setUsuarioSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const formFields = (activeModule.formFields || []).filter((field) => {
    if (isUserModule && field === 'password' && formMode === 'edit' && user?.rol !== 'admin') {
      return false;
    }

    if (isCompositionModule && field === 'usuarioId') {
      return false;
    }

    return true;
  });

  const matchedUsers = useMemo(() => {
    if (!isCompositionModule) {
      return [];
    }

    return findUsuarioByCedula(usuariosCatalog || [], usuarioSearch);
  }, [isCompositionModule, usuariosCatalog, usuarioSearch]);

  const selectedUsuario = useMemo(() => {
    if (!isCompositionModule) {
      return null;
    }

    return (usuariosCatalog || []).find((item) => String(item.userId) === String(createForm.usuarioId)) || null;
  }, [createForm.usuarioId, isCompositionModule, usuariosCatalog]);

  const compositionGroups = useMemo(() => {
    if (!isCompositionModule) {
      return [];
    }

    const groupsMap = new Map();

    filteredRecords.forEach((record) => {
      const userId = getCompositionUserId(record);
      const fallbackId = String(record?.[activeModule.idField] ?? Math.random());
      const groupId = userId ? String(userId) : `sin-usuario-${fallbackId}`;

      if (!groupsMap.has(groupId)) {
        const nombreCompleto = [record?.usuario?.nombre, record?.usuario?.apellido].filter(Boolean).join(' ').trim();
        groupsMap.set(groupId, {
          groupId,
          usuarioId: userId ? String(userId) : '',
          nombreCompleto: nombreCompleto || 'Sin usuario',
          cedula: record?.usuario?.cedula || '',
          records: [],
        });
      }

      groupsMap.get(groupId).records.push(record);
    });

    return Array.from(groupsMap.values())
      .map((group) => {
        const sorted = [...group.records].sort((a, b) => toDateValue(b?.fechaRegistro) - toDateValue(a?.fechaRegistro));
        return {
          ...group,
          latest: sorted[0],
          history: sorted.slice(1),
        };
      })
      .sort((a, b) => toDateValue(b?.latest?.fechaRegistro) - toDateValue(a?.latest?.fechaRegistro));
  }, [activeModule.idField, filteredRecords, isCompositionModule]);

  const selectedCompositionGroup = useMemo(() => {
    if (!isCompositionModule || !selectedId) {
      return null;
    }

    return compositionGroups.find((group) => group.records.some((item) => String(item?.[activeModule.idField]) === String(selectedId))) || null;
  }, [activeModule.idField, compositionGroups, isCompositionModule, selectedId]);

  const exerciseFilteredRecords = useMemo(() => {
    if (!isExerciseModule) {
      return filteredRecords;
    }

    return filteredRecords.filter((record) => {
      const categoriaId = record?.categoria?.categoriaId ?? record?.categoriaId;
      const tipoId = record?.tipo?.tipoId ?? record?.tipoId;
      const categoryOk = !categoriaFilter || String(categoriaId) === String(categoriaFilter);
      const typeOk = !tipoFilter || String(tipoId) === String(tipoFilter);
      return categoryOk && typeOk;
    });
  }, [categoriaFilter, filteredRecords, isExerciseModule, tipoFilter]);

  const rowsToRender = isExerciseModule ? exerciseFilteredRecords : filteredRecords;
  const categoriaOptions = isExerciseModule ? getOptionsForField('categoriaId') : [];
  const tipoOptions = isExerciseModule ? getOptionsForField('tipoId') : [];

  const visibleCount = isCompositionModule ? compositionGroups.length : rowsToRender.length;

  useEffect(() => {
    if (formMode === 'closed' || !isCompositionModule) {
      setUsuarioSearch('');
      return;
    }

    if (!createForm.usuarioId) {
      setUsuarioSearch('');
      return;
    }

    const selected = (usuariosCatalog || []).find((item) => String(item.userId) === String(createForm.usuarioId));
    setUsuarioSearch(selected?.cedula ?? '');
  }, [createForm.usuarioId, formMode, isCompositionModule, usuariosCatalog]);

  useEffect(() => {
    if (!isExerciseModule) {
      setCategoriaFilter('');
      setTipoFilter('');
    }
  }, [isExerciseModule]);

  return (
    <section className={`module-grid ${isUserModule ? 'module-grid--compact' : ''}`}>
      <article className={`table-card ${isUserModule ? 'table-card--compact' : ''}`}>
        <div className="card-head">
          <h2>{activeModule.title} ({visibleCount})</h2>
          <span>{loading ? 'Cargando...' : 'Conectado'}</span>
        </div>

        <div className="action-strip">
          <button type="button" className="btn-action" onClick={reloadModule}>Recargar</button>
          {isExerciseModule && (
            <>
              <label className="inline-filter">
                Categoria
                <select value={categoriaFilter} onChange={(event) => setCategoriaFilter(event.target.value)}>
                  <option value="">Todas</option>
                  {categoriaOptions.map((opt) => (
                    <option key={`cat-filter-${opt.value}`} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              <label className="inline-filter">
                Tipo
                <select value={tipoFilter} onChange={(event) => setTipoFilter(event.target.value)}>
                  <option value="">Todos</option>
                  {tipoOptions.map((opt) => (
                    <option key={`type-filter-${opt.value}`} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {activeModule.canCreate && !selectedRecord && (
            <button
              type="button"
              className="btn-action"
              onClick={formMode === 'create' ? closeForm : openCreateForm}
            >
              {formMode === 'create' ? 'Cerrar registro' : (isUserModule ? 'Crear usuario' : 'Crear')}
            </button>
          )}
          {activeModule.canCreate && selectedRecord && (
            <button type="button" className="btn-action" onClick={openEditForm}>
              {isUserModule ? 'Editar usuario' : 'Editar seleccionado'}
            </button>
          )}
          {isCompositionModule && selectedCompositionGroup?.latest && (
            <button
              type="button"
              className="btn-action"
              onClick={() => {
                const latest = selectedCompositionGroup.latest;
                openCreateForm(
                  {
                    peso: latest?.peso ?? '',
                    talla: latest?.talla ?? '',
                    grasaCorporal: latest?.grasaCorporal ?? '',
                    edadCorporal: latest?.edadCorporal ?? '',
                    grasaVisceral: latest?.grasaVisceral ?? '',
                    usuarioId: getCompositionUserId(latest) ? String(getCompositionUserId(latest)) : '',
                  },
                  true,
                );
              }}
            >
              Agregar
            </button>
          )}
          {activeModule.canDelete && selectedRecord && (
            <button
              type="button"
              className="btn-action danger"
              onClick={handleDelete}
            >
              Eliminar seleccionado
            </button>
          )}
          {activeModule.isStub && <span className="stub-badge">Backend en construccion</span>}
        </div>

        {isExerciseModule && (
          <div className="relations-strip">
            <span>Catalogos relacionados:</span>
            <button type="button" className="btn-action" onClick={() => navigate('/categorias')}>
              Gestionar categorias
            </button>
            <button type="button" className="btn-action" onClick={() => navigate('/tipos')}>
              Gestionar tipos
            </button>
          </div>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>SEL</th>
                {visibleFields.map((field) => (
                  <th key={field}>{formatLabel(field)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isCompositionModule
                ? compositionGroups.flatMap((group) => {
                  const latest = group.latest;
                  const latestId = String(latest?.[activeModule.idField]);
                  const isSelected = selectedId === latestId;

                  const mainRow = (
                    <tr key={`latest-${latestId}`} className={isSelected ? 'row-selected' : ''}>
                      <td>
                        <button
                          type="button"
                          className={`row-select ${isSelected ? 'selected' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => (isSelected ? closeForm() : setSelectedId(latestId))}
                        >
                          {isSelected ? '●' : '○'}
                        </button>
                      </td>
                      {visibleFields.map((field) => (
                        <td key={`latest-${latestId}-${field}`}>{resolveValue(latest, field)}</td>
                      ))}
                    </tr>
                  );

                  if (!isSelected || group.history.length === 0) {
                    return [mainRow];
                  }

                  const historyRows = group.history.map((row) => {
                    const rowId = String(row?.[activeModule.idField]);
                    return (
                      <tr key={`history-${rowId}`} className="history-row">
                        <td />
                        {visibleFields.map((field) => (
                          <td key={`history-${rowId}-${field}`}>{resolveValue(row, field)}</td>
                        ))}
                      </tr>
                    );
                  });

                  return [mainRow, ...historyRows];
                })
                : rowsToRender.map((row) => {
                  const id = row[activeModule.idField] || JSON.stringify(row);
                  const isSelected = selectedId === String(id);
                  return (
                    <tr key={id} className={isSelected ? 'row-selected' : ''}>
                      <td>
                        <button
                          type="button"
                          className={`row-select ${isSelected ? 'selected' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => (isSelected ? closeForm() : setSelectedId(String(id)))}
                        >
                          {isSelected ? '●' : '○'}
                        </button>
                      </td>
                      {visibleFields.map((field) => (
                        <td key={`${id}-${field}`}>{resolveValue(row, field)}</td>
                      ))}
                    </tr>
                  );
                })}

              {!(isCompositionModule ? compositionGroups.length : rowsToRender.length) && (
                <tr>
                  <td colSpan={visibleFields.length + 1}>No hay registros para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {activeModule.canCreate && formMode !== 'closed' && (
        <article className="form-card">
          <div className="card-head card-head--tight">
            <h2>
              {formMode === 'edit'
                ? (isUserModule ? 'Editar usuario' : 'Editar registro')
                : (activeModule.key === 'usuario' ? 'Nuevo usuario' : 'Nuevo registro')}
            </h2>
            <button type="button" className="btn-action" onClick={closeForm}>Cerrar</button>
          </div>
          {activeModule.key === 'usuario' && user?.rol !== 'admin' && (
            <p className="status">El coach crea usuarios normales con rol user.</p>
          )}
          <form className="form-grid compact" onSubmit={handleCreate}>
            {isCompositionModule && (
              <label>
                Buscar usuario por cédula
                <input
                  type="text"
                  value={usuarioSearch}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setUsuarioSearch(nextValue);
                    setCreateForm((current) => ({ ...current, usuarioId: '' }));
                  }}
                  placeholder="Escribe la cédula"
                  autoComplete="off"
                />

                {matchedUsers.length > 0 && (
                  <div className="user-search-list">
                    {matchedUsers.slice(0, 6).map((item) => {
                      const fullName = [item.nombre, item.apellido].filter(Boolean).join(' ').trim();
                      return (
                        <button
                          key={item.userId}
                          type="button"
                          className={`user-search-item ${String(createForm.usuarioId) === String(item.userId) ? 'selected' : ''}`}
                          onClick={() => {
                            setCreateForm((current) => ({ ...current, usuarioId: item.userId }));
                            setUsuarioSearch(item.cedula || '');
                          }}
                        >
                          <strong>{fullName || 'Sin nombre'}</strong>
                          <span>{item.cedula}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedUsuario && (
                  <div className="selected-user-chip">
                    Usuario seleccionado: {selectedUsuario.nombre} {selectedUsuario.apellido}
                  </div>
                )}
              </label>
            )}

            {formFields.map((field) => {
              if (activeModule.key === 'usuario' && field === 'rol' && user?.rol !== 'admin') {
                return null;
              }

              const options = getFieldOptions(activeModule, field, user, getOptionsForField);
              const optional = isOptionalField(field);
              const required = isCompositionModule ? field === 'peso' : !optional;

              if (options.length) {
                return (
                  <label key={field}>
                    {formatLabel(field)}
                    <select
                      value={createForm[field] ?? ''}
                      onChange={(event) => setCreateForm((current) => ({ ...current, [field]: event.target.value }))}
                      required={required}
                    >
                      <option value="">{optional ? 'Opcional' : 'Selecciona una opcion'}</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <label key={field}>
                  {formatLabel(field)}
                  <input
                    type={getInputType(field)}
                    value={createForm[field] ?? ''}
                    onChange={(event) => setCreateForm((current) => ({ ...current, [field]: event.target.value }))}
                    required={required}
                  />
                </label>
              );
            })}

            <button type="submit" className="btn-primary">
              {isUserModule
                ? (formMode === 'edit' ? 'Guardar usuario' : 'Crear usuario')
                : (formMode === 'edit' ? 'Guardar cambios' : 'Guardar')}
            </button>
          </form>
        </article>
      )}
    </section>
  );
}

export default ModuleScreen;
