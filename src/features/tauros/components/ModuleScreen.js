import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInputType, isOptionalField, resolveValue } from '../utils/form';
import MuscleSelector, { MUSCLE_GROUPS } from './MuscleSelector';
import muscleBackground from '../utils/pictures/Musculos.jpg';

function isFileLike(value) {
  return typeof File !== 'undefined' && value instanceof File;
}

async function compressVideoFile(file) {
  if (!isFileLike(file) || !file.type.startsWith('video/') || typeof MediaRecorder === 'undefined') {
    return file;
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm');

  if (!mimeType) {
    return file;
  }

  return new Promise((resolve) => {
    const sourceUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = sourceUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    video.onloadedmetadata = async () => {
      try {
        const maxWidth = 960;
        const scale = video.videoWidth > maxWidth ? (maxWidth / video.videoWidth) : 1;
        const width = Math.max(320, Math.floor(video.videoWidth * scale));
        const height = Math.max(240, Math.floor(video.videoHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          URL.revokeObjectURL(sourceUrl);
          resolve(file);
          return;
        }

        const draw = () => {
          if (video.paused || video.ended) {
            return;
          }
          context.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(draw);
        };

        const canvasStream = canvas.captureStream(24);
        let audioTrack = null;
        if (typeof video.captureStream === 'function') {
          const mediaStream = video.captureStream();
          audioTrack = mediaStream.getAudioTracks()[0] || null;
        }

        const composedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...(audioTrack ? [audioTrack] : []),
        ]);

        const chunks = [];
        const recorder = new MediaRecorder(composedStream, {
          mimeType,
          videoBitsPerSecond: 1_000_000,
          audioBitsPerSecond: audioTrack ? 96_000 : undefined,
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          URL.revokeObjectURL(sourceUrl);

          if (!blob.size || blob.size >= file.size) {
            resolve(file);
            return;
          }

          const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
          resolve(new File([blob], `${file.name.split('.').slice(0, -1).join('.') || 'video'}-optimizado.${extension}`, { type: blob.type }));
        };

        video.onended = () => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        };

        recorder.start(250);
        video.currentTime = 0;
        await video.play();
        draw();
      } catch (_err) {
        URL.revokeObjectURL(sourceUrl);
        resolve(file);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      resolve(file);
    };
  });
}

async function exportMuscleSvgToFile(svgElement) {
  if (!svgElement) {
    return null;
  }

  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(svgElement);
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  const image = new Image();
  const backgroundImage = new Image();

  await Promise.all([
    new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = encoded;
    }),
    new Promise((resolve, reject) => {
      backgroundImage.onload = resolve;
      backgroundImage.onerror = reject;
      backgroundImage.src = muscleBackground;
    }),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
  if (!blob) {
    return null;
  }

  return new File([blob], `activacion-muscular-${Date.now()}.jpg`, { type: 'image/jpeg' });
}

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
    linkVideo: 'Video',
    linkAM: 'Link AM',
    linkFoto: 'Foto de la maquina',
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

function getExerciseMetaValue(record, field, options = []) {
  const nestedValue = record?.[field];
  if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
    if (nestedValue.nombre) {
      return String(nestedValue.nombre);
    }
  }

  const directValue = resolveValue(record, field);

  if (typeof directValue === 'object' && directValue !== null && directValue !== '-') {
    if (directValue.nombre) {
      return directValue.nombre;
    }
  } else if (directValue && directValue !== '-') {
    if (typeof directValue === 'string' && directValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(directValue);
        if (parsed && typeof parsed === 'object' && parsed.nombre) {
          return String(parsed.nombre);
        }
      } catch (_error) {
        // If the string is not valid JSON we keep the normal fallback flow.
      }
    }

    return directValue;
  }

  const fieldId = field.endsWith('Id') ? field : `${field}Id`;
  const rawId = record?.[fieldId] ?? record?.[field];
  if (rawId === null || rawId === undefined || rawId === '') {
    return '-';
  }

  const matched = options.find((option) => String(option.value) === String(rawId));
  return matched?.label || String(rawId);
}

function buildExerciseVideoThumbnail(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(videoUrl);
    if (!parsed.hostname.includes('res.cloudinary.com') || !parsed.pathname.includes('/video/upload/')) {
      return '';
    }

    const [prefix, suffix] = parsed.pathname.split('/video/upload/');
    if (!suffix) {
      return '';
    }

    const jpgPath = suffix.replace(/\.[^./?]+$/, '.jpg');
    const thumbnailPath = `${prefix}/video/upload/so_0/${jpgPath}`;
    return `${parsed.origin}${thumbnailPath}${parsed.search || ''}`;
  } catch (_error) {
    return '';
  }
}

function ExerciseVideoThumbnail({ src, className = '', alt = 'Miniatura del video' }) {
  const thumbnailSrc = useMemo(() => buildExerciseVideoThumbnail(src), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [thumbnailSrc]);

  if (!thumbnailSrc || failed) {
    return <div className={`${className} exercise-card__poster--empty`}>Sin miniatura</div>;
  }

  return (
    <img
      src={thumbnailSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function ExerciseVideoPreview({ src, className = '', controls = false, autoPlay = false, expanded = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const snapToFirstFrame = () => {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (_error) {
        // Some browsers throw while metadata is still loading.
      }
    };

    const handleLoadedData = () => {
      snapToFirstFrame();
      if (expanded && autoPlay) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    snapToFirstFrame();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [autoPlay, expanded, src]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      controls={controls}
      muted
      playsInline
      preload={expanded ? 'auto' : 'metadata'}
    />
  );
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
  const isMachineModule = activeModule.key === 'maquina';
  const isCategoryOrTypeModule = activeModule.key === 'categoria' || activeModule.key === 'tipo';
  const navigate = useNavigate();
  const muscleSvgRef = useRef(null);
  const visibleFields = (activeModule.fields || []).filter((field) => !shouldHideField(field, activeModule.idField));
  const [usuarioSearch, setUsuarioSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [musclePreviewUrl, setMusclePreviewUrl] = useState('');
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
  const machineOptions = isExerciseModule ? getOptionsForField('maquinaId') : [];

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

  const machinePhotoLabel = createForm.linkFotoFile?.name || createForm.linkFoto || 'Sin archivo';

  useEffect(() => {
    if (!isExerciseModule) {
      return;
    }

    if (!selectedMuscles.length) {
      setMusclePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return '';
      });
      setCreateForm((current) => ({
        ...current,
        linkAMFile: undefined,
      }));
      return;
    }

    let ignore = false;
    let generatedPreview = '';

    const createMuscleImage = async () => {
      const file = await exportMuscleSvgToFile(muscleSvgRef.current);
      if (!file || ignore) {
        return;
      }

      generatedPreview = URL.createObjectURL(file);
      setMusclePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return generatedPreview;
      });
      setCreateForm((current) => ({
        ...current,
        linkAMFile: file,
        linkAM: '',
      }));
    };

    createMuscleImage();

    return () => {
      ignore = true;
      if (generatedPreview) {
        URL.revokeObjectURL(generatedPreview);
      }
    };
  }, [isExerciseModule, selectedMuscles, setCreateForm]);

  useEffect(() => {
    if (!isExerciseModule) {
      setSelectedMuscles([]);
      setMusclePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return '';
      });
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
          {isCategoryOrTypeModule && (
            <button type="button" className="btn-action" onClick={() => navigate('/ejercicios')}>
              ← Volver a ejercicios
            </button>
          )}
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
              onClick={() => {
                if (formMode === 'create') {
                  closeForm();
                  return;
                }

                openCreateForm();
              }}
            >
              {formMode === 'create' ? 'Cerrar registro' : (isUserModule ? 'Crear usuario' : 'Crear')}
            </button>
          )}
          {activeModule.canCreate && selectedRecord && !isExerciseModule && (
            <button type="button" className="btn-action" onClick={() => openEditForm()}>
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
          {activeModule.canDelete && selectedRecord && !isExerciseModule && (
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

        <div className={isExerciseModule ? 'exercise-card-grid' : (isMachineModule ? 'machine-card-grid' : 'table-scroll')}>
          {isExerciseModule ? (
            rowsToRender.length ? rowsToRender.map((row) => {
              const id = String(row?.[activeModule.idField] || row?.nombre || JSON.stringify(row));
              const isSelected = selectedId === id;
              const nombre = resolveValue(row, 'nombre');
              const categoria = getExerciseMetaValue(row, 'categoria', categoriaOptions);
              const tipo = getExerciseMetaValue(row, 'tipo', tipoOptions);
              const maquina = getExerciseMetaValue(row, 'maquina', machineOptions);
              const videoSrc = row?.linkVideo || '';
              const amSrc = row?.linkAM || '';
              const hasMeta = [categoria, tipo, maquina].some((value) => value && value !== '-');

              return (
                <details key={id} className={`exercise-card ${isSelected ? 'exercise-card--selected' : ''}`} open={isSelected}>
                  <summary
                    className="exercise-card__summary"
                    onClick={(event) => {
                      event.preventDefault();
                      setSelectedId(isSelected ? '' : id);
                    }}
                  >
                    <div className="exercise-card__summary-main">
                      <ExerciseVideoThumbnail
                        src={videoSrc}
                        className="exercise-card__poster"
                        alt={`Miniatura de ${nombre}`}
                      />
                      <div className="exercise-card__summary-copy">
                        <span className="exercise-card__eyebrow">Ejercicio</span>
                        <h3>{nombre}</h3>
                        <p>{hasMeta ? [categoria, tipo, maquina].filter((value) => value && value !== '-').join(' · ') : 'Sin categoría, tipo o máquina asociadas'}</p>
                      </div>
                    </div>
                    <span className="exercise-card__toggle">{isSelected ? 'Contraer' : 'Abrir'}</span>
                  </summary>

                  <div className="exercise-card__body">
                    <div className="exercise-card__detail-grid">
                      <div>
                        <span>Nombre</span>
                        <strong>{nombre}</strong>
                      </div>
                      <div>
                        <span>Categoría</span>
                        <strong>{categoria}</strong>
                      </div>
                      <div>
                        <span>Tipo</span>
                        <strong>{tipo}</strong>
                      </div>
                      <div>
                        <span>Máquina</span>
                        <strong>{maquina}</strong>
                      </div>
                    </div>

                    <div className="exercise-card__media">
                      <section>
                        <h4>Video</h4>
                        <ExerciseVideoPreview
                          src={videoSrc}
                          className="exercise-card__video"
                          controls
                          autoPlay
                          expanded={isSelected}
                        />
                      </section>

                      <section>
                        <h4>Activación muscular</h4>
                        {amSrc ? (
                          <img src={amSrc} alt={`Activación muscular de ${nombre}`} className="exercise-card__am" />
                        ) : (
                          <div className="exercise-card__empty-media">Sin imagen AM</div>
                        )}
                      </section>
                    </div>

                    <div className="exercise-card__actions">
                      <button
                        type="button"
                        className="btn-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditForm(row);
                        }}
                      >
                        Editar
                      </button>
                      {activeModule.canDelete && (
                        <button
                          type="button"
                          className="btn-action danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(id);
                            handleDelete();
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </details>
              );
            }) : (
              <div className="exercise-empty">No hay registros para mostrar.</div>
            )
          ) : isMachineModule ? (
            rowsToRender.length ? rowsToRender.map((row) => {
              const id = String(row?.[activeModule.idField] || row?.nombre || JSON.stringify(row));
              const isSelected = selectedId === id;
              const nombre = resolveValue(row, 'nombre');
              const numeroMaquina = resolveValue(row, 'numeroMaquina');
              const fotoSrc = row?.linkFoto || '';

              return (
                <article
                  key={id}
                  className={`machine-card ${isSelected ? 'machine-card--selected' : ''}`}
                  onClick={() => setSelectedId(isSelected ? '' : id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(isSelected ? '' : id);
                    }
                  }}
                >
                  {fotoSrc ? (
                    <img
                      src={fotoSrc}
                      alt={`Foto de ${nombre}`}
                      className="machine-card__image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="machine-card__image machine-card__image--empty">Sin imagen</div>
                  )}

                  <div className="machine-card__copy">
                    <span className="machine-card__eyebrow">Maquina</span>
                    <h3>{nombre}</h3>
                    <p>N.{numeroMaquina}</p>
                  </div>
                </article>
              );
            }) : (
              <div className="exercise-empty">No hay registros para mostrar.</div>
            )
          ) : (
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
          )}
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

              if (isExerciseModule && field === 'linkVideo') {
                const videoLabel = createForm.linkVideoFile?.name || createForm.linkVideo || 'Sin archivo';
                return (
                  <label key={field}>
                    Link de video
                    <input
                      type="file"
                      accept="video/*"
                      required={formMode === 'create'}
                      onChange={async (event) => {
                        const selected = event.target.files?.[0];
                        if (!selected) {
                          return;
                        }

                        setVideoProcessing(true);
                        const optimizedVideo = await compressVideoFile(selected);
                        setCreateForm((current) => ({
                          ...current,
                          linkVideoFile: optimizedVideo,
                          linkVideo: '',
                        }));
                        setVideoProcessing(false);
                      }}
                    />
                    <span>{videoProcessing ? 'Comprimiendo video...' : `Archivo: ${videoLabel}`}</span>
                  </label>
                );
              }

              if (isExerciseModule && field === 'linkAM') {
                const amLabel = createForm.linkAMFile?.name || createForm.linkAM || 'Sin archivo generado';
                return (
                  <label key={field}>
                    Activacion muscular (AM)
                    <div className="muscle-picker">
                      <MuscleSelector
                        ref={muscleSvgRef}
                        selectedMuscles={selectedMuscles}
                        onToggleMuscle={(muscleId) => {
                          setSelectedMuscles((current) => (
                            current.includes(muscleId)
                              ? current.filter((value) => value !== muscleId)
                              : [...current, muscleId]
                          ));
                        }}
                      />

                      <div className="muscle-tags">
                        {MUSCLE_GROUPS.map((muscle) => {
                          const active = selectedMuscles.includes(muscle.id);
                          return (
                            <button
                              key={`tag-${muscle.id}`}
                              type="button"
                              className={`muscle-chip ${active ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedMuscles((current) => (
                                  current.includes(muscle.id)
                                    ? current.filter((value) => value !== muscle.id)
                                    : [...current, muscle.id]
                                ));
                              }}
                            >
                              {muscle.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <span>{`Archivo AM: ${amLabel}`}</span>
                    <small>Selecciona al menos un musculo para generar el archivo AM requerido.</small>
                    {musclePreviewUrl && (
                      <img src={musclePreviewUrl} alt="Vista previa AM" className="muscle-preview" />
                    )}
                  </label>
                );
              }

              if (isMachineModule && field === 'linkFoto') {
                return (
                  <label key={field}>
                    Foto de la maquina
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const selected = event.target.files?.[0];
                        setCreateForm((current) => ({
                          ...current,
                          linkFotoFile: selected || undefined,
                          linkFoto: selected ? '' : current.linkFoto,
                        }));
                      }}
                      required={formMode === 'create'}
                    />
                    <span>{machinePhotoLabel}</span>
                  </label>
                );
              }

              if (isExerciseModule && field === 'maquinaId') {
                const machineOptions = getOptionsForField('maquinaId');
                return (
                  <label key={field}>
                    {formatLabel(field)}
                    <select
                      value={createForm[field] ?? ''}
                      onChange={(event) => setCreateForm((current) => ({ ...current, [field]: event.target.value }))}
                    >
                      <option value="">Sin maquina</option>
                      {machineOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                );
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
