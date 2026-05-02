import { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../services/api';

function resolveId(candidate) {
  if (!candidate) {
    return '';
  }

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (typeof candidate === 'object') {
    return String(
      candidate.planEntrenamientoId
      || candidate.rutinaDiaId
      || candidate.rutinaEjercicioId
      || candidate.ejercicioId
      || candidate.userId
      || '',
    );
  }

  return String(candidate);
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

function ExerciseThumbnail({ src, className = '', alt = 'Miniatura del ejercicio' }) {
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

function toPositiveInteger(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function toSeconds(value, unit = 'seconds', fallback = 60) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return unit === 'minutes' ? Math.trunc(parsed * 60) : Math.trunc(parsed);
}

function secondsToInputValue(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { value: '60', unit: 'seconds' };
  }

  if (parsed >= 60 && parsed % 60 === 0) {
    return { value: String(parsed / 60), unit: 'minutes' };
  }

  return { value: String(parsed), unit: 'seconds' };
}

function buildWarmupDraft(item) {
  const hasDuration = item?.duracionSegundos !== undefined && item?.duracionSegundos !== null;
  return {
    mode: hasDuration ? 'time' : 'reps',
    valor: String(hasDuration ? item.duracionSegundos : (item?.repeticiones ?? 10)),
    unidad: 'seconds',
    intensidad: String(item?.intensidad || 'baja'),
  };
}

function uniqueRecords(records, key) {
  const seen = new Map();

  records.forEach((record) => {
    if (!record) {
      return;
    }

    const identifier = record[key];
    if (identifier === undefined || identifier === null || identifier === '') {
      return;
    }

    if (!seen.has(String(identifier))) {
      seen.set(String(identifier), record);
    }
  });

  return Array.from(seen.values());
}

function sortDays(days) {
  return days.slice().sort((left, right) => Number(left.numeroDia || 0) - Number(right.numeroDia || 0));
}

function getDayExerciseSource(day, rutinaEjercicios) {
  if (Array.isArray(day?.rutinasEjercicio) && day.rutinasEjercicio.length) {
    return day.rutinasEjercicio;
  }

  const source = Array.isArray(rutinaEjercicios) ? rutinaEjercicios : [];
  return source.filter((item) => {
    const rutinaDiaId = resolveId(item.rutinaDia) || resolveId(item.rutinaDiaId);
    return String(rutinaDiaId) === String(day?.rutinaDiaId);
  });
}

function buildDraftExercise(item, exercisesById, fallbackSeries, fallbackRepetitions) {
  const ejercicioId = String(item?.ejercicio?.ejercicioId || item?.ejercicioId || '');
  if (!ejercicioId) {
    return null;
  }

  const hasTime = item?.tiempoSegundos !== undefined && item?.tiempoSegundos !== null;
  const hasSpecificRest = item?.descansoSegundos !== undefined && item?.descansoSegundos !== null;
  const restValues = secondsToInputValue(item?.descansoSegundos ?? 60);

  return {
    ejercicioId,
    ejercicio: item?.ejercicio || exercisesById.get(ejercicioId) || null,
    series: String(item?.series ?? fallbackSeries),
    executionMode: hasTime ? 'time' : 'reps',
    repeticiones: String(item?.repeticiones ?? fallbackRepetitions),
    tiempoValor: String(hasTime ? item.tiempoSegundos : 60),
    tiempoUnidad: 'seconds',
    descansoMode: hasSpecificRest ? 'specific' : 'general',
    descansoValor: hasSpecificRest ? restValues.value : '',
    descansoUnidad: hasSpecificRest ? restValues.unit : 'seconds',
    calentamientos: Array.isArray(item?.calentamientos)
      ? item.calentamientos.map((cal) => buildWarmupDraft(cal))
      : [],
  };
}

function buildDraftsForDays(days, rutinaEjercicios, exercisesById, fallbackSeries, fallbackRepetitions) {
  return days.reduce((accumulator, day) => {
    const ejercicios = getDayExerciseSource(day, rutinaEjercicios)
      .map((item) => buildDraftExercise(item, exercisesById, fallbackSeries, fallbackRepetitions))
      .filter(Boolean);

    accumulator[String(day.rutinaDiaId)] = {
      descripcion: day.descripcion || `Dia ${day.numeroDia}`,
      descansoSegundos: String(day.descansoSegundos ?? 60),
      exercises: ejercicios,
    };

    return accumulator;
  }, {});
}

function buildDraftForDay(day, rutinaEjercicios, exercisesById, fallbackSeries, fallbackRepetitions) {
  const sourceExercises = getDayExerciseSource(day, rutinaEjercicios)
    .map((item) => buildDraftExercise(item, exercisesById, fallbackSeries, fallbackRepetitions))
    .filter(Boolean);

  return {
    descripcion: day?.descripcion || `Dia ${day?.numeroDia || ''}`,
    descansoSegundos: String(day?.descansoSegundos ?? 60),
    exercises: sourceExercises,
  };
}

function PlanBuilderScreen({
  token,
  plans,
  rutinaDias,
  rutinaEjercicios,
  ejercicios,
  usuarios,
  onOpenPlan,
  onRefresh,
  initialEditPlanId,
}) {
  const [viewMode, setViewMode] = useState('list');
  const [workflowMode, setWorkflowMode] = useState('create');
  const [creationPhase, setCreationPhase] = useState('step1');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [creationPlanId, setCreationPlanId] = useState('');
  const [selectedRutinaDiaId, setSelectedRutinaDiaId] = useState('');
  const [dayDrafts, setDayDrafts] = useState({});
  const [draftSeedPlanId, setDraftSeedPlanId] = useState('');
  const [dayDescription, setDayDescription] = useState('');
  const [dayRestValue, setDayRestValue] = useState('60');
  const [dayRestUnit, setDayRestUnit] = useState('seconds');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [assignCedulaQuery, setAssignCedulaQuery] = useState('');
  const [assignSelectedUser, setAssignSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [consumedInitialEdit, setConsumedInitialEdit] = useState(false);

  const [planForm, setPlanForm] = useState({
    nombre: '',
    descripcion: '',
    duracionDias: '',
    objetivo: '',
  });

  const [selectedExerciseDrafts, setSelectedExerciseDrafts] = useState([]);
  const [defaultSeries, setDefaultSeries] = useState('3');
  const [defaultExecutionMode, setDefaultExecutionMode] = useState('reps');
  const [defaultRepetitions, setDefaultRepetitions] = useState('12');
  const [defaultTimeValue, setDefaultTimeValue] = useState('60');
  const [defaultTimeUnit, setDefaultTimeUnit] = useState('seconds');
  const defaultSeriesRef = useRef(defaultSeries);
  const defaultRepetitionsRef = useRef(defaultRepetitions);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);

  const planCards = useMemo(() => {
    const source = Array.isArray(plans) ? plans : [];
    return source
      .filter((plan) => plan?.esPlantilla !== false)
      .slice()
      .sort((left, right) => String(left?.nombre || '').localeCompare(String(right?.nombre || '')));
  }, [plans]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) {
      return null;
    }

    return planCards.find((plan) => String(plan.planEntrenamientoId) === String(selectedPlanId)) || null;
  }, [planCards, selectedPlanId]);

  const creationPlan = useMemo(() => {
    if (!creationPlanId) {
      return null;
    }

    return planCards.find((plan) => String(plan.planEntrenamientoId) === String(creationPlanId)) || null;
  }, [creationPlanId, planCards]);

  const creationPlanDays = useMemo(() => {
    if (!creationPlan) {
      return [];
    }

    const directDays = Array.isArray(creationPlan.rutinasDia)
      ? creationPlan.rutinasDia
      : (Array.isArray(rutinaDias) ? rutinaDias : []).filter((day) => {
          const dayPlanId = resolveId(day.planEntrenamiento) || resolveId(day.planEntrenamientoId);
          return String(dayPlanId) === String(creationPlan.planEntrenamientoId);
        });

    return sortDays(directDays);
  }, [creationPlan, rutinaDias]);

  const selectedRutinaDia = useMemo(() => {
    if (!creationPlanDays.length) {
      return null;
    }

    return creationPlanDays.find((day) => String(day.rutinaDiaId) === String(selectedRutinaDiaId)) || creationPlanDays[0];
  }, [creationPlanDays, selectedRutinaDiaId]);

  const categoryOptions = useMemo(
    () => uniqueRecords(
      (Array.isArray(ejercicios) ? ejercicios : [])
        .map((exercise) => exercise?.categoria)
        .filter(Boolean),
      'categoriaId',
    ).sort((left, right) => String(left.nombre || '').localeCompare(String(right.nombre || ''))),
    [ejercicios],
  );

  const typeOptions = useMemo(
    () => uniqueRecords(
      (Array.isArray(ejercicios) ? ejercicios : [])
        .map((exercise) => exercise?.tipo)
        .filter(Boolean),
      'tipoId',
    ).sort((left, right) => String(left.nombre || '').localeCompare(String(right.nombre || ''))),
    [ejercicios],
  );

  const selectedExerciseIds = useMemo(
    () => new Set(selectedExerciseDrafts.map((item) => String(item.ejercicioId))),
    [selectedExerciseDrafts],
  );

  const availableExercises = useMemo(() => {
    const source = Array.isArray(ejercicios) ? ejercicios : [];
    const searchTerm = exerciseSearch.trim().toLowerCase();

    return source
      .filter((exercise) => !selectedExerciseIds.has(String(exercise.ejercicioId)))
      .filter((exercise) => {
        const matchesSearch = !searchTerm
          || [
            exercise?.nombre,
            exercise?.categoria?.nombre,
            exercise?.tipo?.nombre,
            exercise?.maquina?.nombre,
          ].some((value) => String(value || '').toLowerCase().includes(searchTerm));

        const matchesCategory = !selectedCategoryId
          || String(exercise?.categoria?.categoriaId || '') === String(selectedCategoryId);

        const matchesType = !selectedTypeId
          || String(exercise?.tipo?.tipoId || '') === String(selectedTypeId);

        return matchesSearch && matchesCategory && matchesType;
      })
      .slice()
      .sort((left, right) => String(left.nombre || '').localeCompare(String(right.nombre || '')));
  }, [ejercicios, exerciseSearch, selectedCategoryId, selectedExerciseIds, selectedTypeId]);

  const exercisesById = useMemo(() => {
    const source = Array.isArray(ejercicios) ? ejercicios : [];
    return new Map(source.map((exercise) => [String(exercise.ejercicioId), exercise]));
  }, [ejercicios]);

  const selectedDayDraft = useMemo(() => {
    if (!selectedRutinaDia) {
      return null;
    }

    return dayDrafts[String(selectedRutinaDia.rutinaDiaId)] || buildDraftForDay(
      selectedRutinaDia,
      rutinaEjercicios,
      exercisesById,
      defaultSeries,
      defaultRepetitions,
    );
  }, [dayDrafts, defaultRepetitions, defaultSeries, exercisesById, rutinaEjercicios, selectedRutinaDia]);

  useEffect(() => {
    if (!selectedExerciseDrafts.length) {
      return;
    }

    setSelectedExerciseDrafts((current) => current.map((item) => {
      if (defaultExecutionMode === 'time') {
        return {
          ...item,
          series: defaultSeries,
          executionMode: 'time',
          repeticiones: '',
          tiempoValor: defaultTimeValue,
          tiempoUnidad: defaultTimeUnit,
        };
      }

      return {
        ...item,
        series: defaultSeries,
        executionMode: 'reps',
        repeticiones: defaultRepetitions,
        tiempoValor: item.tiempoValor || '60',
        tiempoUnidad: item.tiempoUnidad || 'seconds',
      };
    }));
  }, [defaultExecutionMode, defaultRepetitions, defaultSeries, defaultTimeUnit, defaultTimeValue, selectedExerciseDrafts.length]);

  const ejerciciosDelDia = useMemo(() => selectedDayDraft?.exercises || [], [selectedDayDraft]);

  const assignUserMatches = useMemo(() => {
    const source = Array.isArray(usuarios) ? usuarios : [];
    const search = assignCedulaQuery.trim().toLowerCase();
    if (!search) {
      return [];
    }

    return source
      .filter((user) => String(user?.cedula || '').toLowerCase().includes(search))
      .slice(0, 8);
  }, [assignCedulaQuery, usuarios]);

  useEffect(() => {
    if (!planCards.length) {
      setSelectedPlanId('');
      return;
    }

    if (!selectedPlanId) {
      setSelectedPlanId(String(planCards[0].planEntrenamientoId));
      return;
    }

    if (!planCards.some((plan) => String(plan.planEntrenamientoId) === String(selectedPlanId))) {
      setSelectedPlanId(String(planCards[0].planEntrenamientoId));
    }
  }, [planCards, selectedPlanId]);

  useEffect(() => {
    if (consumedInitialEdit || !initialEditPlanId || !planCards.length) {
      return;
    }

    const exists = planCards.some((plan) => String(plan.planEntrenamientoId) === String(initialEditPlanId));
    if (!exists) {
      return;
    }

    setConsumedInitialEdit(true);
    setSelectedPlanId(String(initialEditPlanId));
    setCreationPlanId(String(initialEditPlanId));
    setViewMode('create');
    setWorkflowMode('edit');
    setCreationPhase('configure');
  }, [consumedInitialEdit, initialEditPlanId, planCards]);

  useEffect(() => {
    if (viewMode !== 'create' || creationPhase !== 'configure' || !creationPlan?.planEntrenamientoId || !creationPlanDays.length) {
      return;
    }

    const currentPlanId = String(creationPlan.planEntrenamientoId);
    if (draftSeedPlanId === currentPlanId) {
      return;
    }

    const initialDrafts = buildDraftsForDays(
      creationPlanDays,
      rutinaEjercicios,
      exercisesById,
      defaultSeries,
      defaultRepetitions,
    );

    setDayDrafts(initialDrafts);
    setDraftSeedPlanId(currentPlanId);

    const firstDay = creationPlanDays[0];
    if (firstDay) {
      setSelectedRutinaDiaId(String(firstDay.rutinaDiaId));
      const firstDraft = initialDrafts[String(firstDay.rutinaDiaId)];
      setDayDescription(firstDraft?.descripcion || firstDay.descripcion || `Dia ${firstDay.numeroDia}`);
      const restValues = secondsToInputValue(firstDraft?.descansoSegundos || firstDay.descansoSegundos || 60);
      setDayRestValue(restValues.value);
      setDayRestUnit(restValues.unit);
      setSelectedExerciseDrafts(firstDraft?.exercises || []);
    }
  }, [
    creationPhase,
    creationPlan,
    creationPlanDays,
    defaultRepetitions,
    defaultSeries,
    draftSeedPlanId,
    exercisesById,
    rutinaEjercicios,
    viewMode,
  ]);

  useEffect(() => {
    defaultSeriesRef.current = defaultSeries;
    defaultRepetitionsRef.current = defaultRepetitions;
  }, [defaultSeries, defaultRepetitions]);

  useEffect(() => {
    if (viewMode !== 'create' || creationPhase !== 'configure' || !selectedRutinaDia) {
      return;
    }

    const dayId = String(selectedRutinaDia.rutinaDiaId);
    const draft = dayDrafts[dayId] || buildDraftForDay(
      selectedRutinaDia,
      rutinaEjercicios,
      exercisesById,
      defaultSeriesRef.current,
      defaultRepetitionsRef.current,
    );

    setDayDescription(draft.descripcion || selectedRutinaDia.descripcion || `Dia ${selectedRutinaDia.numeroDia}`);
    const restValues = secondsToInputValue(draft.descansoSegundos || selectedRutinaDia.descansoSegundos || 60);
    setDayRestValue(restValues.value);
    setDayRestUnit(restValues.unit);
    setSelectedExerciseDrafts(draft.exercises || []);
  }, [
    creationPhase,
    dayDrafts,
    exercisesById,
    rutinaEjercicios,
    selectedRutinaDia,
    viewMode,
  ]);

  const openCreateWizard = () => {
    setError('');
    setSuccess('');
    setViewMode('create');
    setWorkflowMode('create');
    setCreationPhase('step1');
    setCreationPlanId('');
    setSelectedRutinaDiaId('');
    setSelectedExerciseDrafts([]);
    setDayDrafts({});
    setDraftSeedPlanId('');
    setDayRestValue('60');
    setDayRestUnit('seconds');
    setPlanForm({ nombre: '', descripcion: '', duracionDias: '', objetivo: '' });
  };

  const closeCreateWizard = () => {
    setViewMode('list');
    setWorkflowMode('create');
    setCreationPhase('step1');
    setCreationPlanId('');
    setSelectedRutinaDiaId('');
    setSelectedExerciseDrafts([]);
    setDayDrafts({});
    setDraftSeedPlanId('');
    setDayDescription('');
    setDayRestValue('60');
    setDayRestUnit('seconds');
    setExerciseSearch('');
    setSelectedCategoryId('');
    setSelectedTypeId('');
  };

  const persistCurrentDayDraft = (
    dayId = selectedRutinaDiaId,
    description = dayDescription,
    descansoValue = dayRestValue,
    descansoUnit = dayRestUnit,
    exercises = selectedExerciseDrafts,
  ) => {
    if (!dayId) {
      return;
    }

    const normalizedExercises = exercises
      .map((item) => buildDraftExercise(item, exercisesById, defaultSeries, defaultRepetitions))
      .filter(Boolean);

    setDayDrafts((current) => ({
      ...current,
      [String(dayId)]: {
        descripcion: description,
        descansoSegundos: String(toSeconds(descansoValue, descansoUnit, 60)),
        exercises: normalizedExercises,
      },
    }));
  };

  const getDraftSnapshot = () => {
    const snapshot = { ...dayDrafts };
    if (selectedRutinaDiaId) {
      snapshot[String(selectedRutinaDiaId)] = {
        descripcion: dayDescription,
        descansoSegundos: String(toSeconds(dayRestValue, dayRestUnit, 60)),
        exercises: selectedExerciseDrafts,
      };
    }

    return snapshot;
  };

  const finalizePlanDrafts = async () => {
    if (!creationPlan || !creationPlanDays.length) {
      return;
    }

    const snapshot = getDraftSnapshot();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      for (const day of creationPlanDays) {
        const dayId = String(day.rutinaDiaId);
        const draft = snapshot[dayId] || buildDraftForDay(day, rutinaEjercicios, exercisesById, defaultSeries, defaultRepetitions);
        const dayExercisesSource = getDayExerciseSource(day, rutinaEjercicios);

        await apiRequest(`/rutina-dia/${day.rutinaDiaId}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            planEntrenamientoId: creationPlan.planEntrenamientoId,
            numeroDia: Number(day.numeroDia),
            nombre: day.nombre,
            descripcion: draft.descripcion || day.descripcion || `Dia ${day.numeroDia}`,
            descansoSegundos: toSeconds(draft.descansoSegundos || dayRestValue, dayRestUnit, 60),
          }),
        });

        const existingExerciseIds = dayExercisesSource
          .map((item) => item?.rutinaEjercicioId)
          .filter(Boolean);

        for (const rutinaEjercicioId of existingExerciseIds) {
          await apiRequest(`/rutina-ejercicio/${rutinaEjercicioId}`, token, {
            method: 'DELETE',
          });
        }

        for (const [index, draftExercise] of (draft.exercises || []).entries()) {
          const isTimeMode = draftExercise.executionMode === 'time' || defaultExecutionMode === 'time';
          const tiempoSegundos = isTimeMode
            ? toSeconds(draftExercise.tiempoValor || defaultTimeValue, draftExercise.tiempoUnidad || defaultTimeUnit, 60)
            : null;
          const generalRestSeconds = toSeconds(draft.descansoSegundos || dayRestValue, dayRestUnit, 60);
          const descansoSegundos = draftExercise.descansoMode === 'specific'
            ? toSeconds(draftExercise.descansoValor || draft.descansoSegundos || dayRestValue, draftExercise.descansoUnidad || dayRestUnit, generalRestSeconds)
            : generalRestSeconds;
          const calentamientos = Array.isArray(draftExercise.calentamientos)
            ? draftExercise.calentamientos.map((warmup, warmupIndex) => {
              const isTimeWarmup = warmup?.mode === 'time';
              return {
                orden: warmupIndex + 1,
                intensidad: warmup?.intensidad || 'baja',
                repeticiones: isTimeWarmup ? null : toPositiveInteger(warmup?.valor, 10),
                duracionSegundos: isTimeWarmup ? toSeconds(warmup?.valor, warmup?.unidad, 30) : null,
              };
            })
            : [];

          await apiRequest('/rutina-ejercicio', token, {
            method: 'POST',
            body: JSON.stringify({
              orden: index + 1,
              series: toPositiveInteger(draftExercise.series, toPositiveInteger(defaultSeries, 1)),
              repeticiones: isTimeMode ? null : toPositiveInteger(draftExercise.repeticiones, toPositiveInteger(defaultRepetitions, 1)),
              tiempoSegundos,
              descansoSegundos,
              carga: '',
              notasEspecificas: '',
              rutinaDiaId: day.rutinaDiaId,
              ejercicioId: draftExercise.ejercicioId,
              calentamientos,
            }),
          });
        }
      }

      await onRefresh();
      setViewMode('list');
      setWorkflowMode('edit');
      setCreationPhase('step1');
      setCreationPlanId('');
      setSelectedRutinaDiaId('');
      setSelectedExerciseDrafts([]);
      setDayDrafts({});
      setDraftSeedPlanId('');
      setDayDescription('');
      setDayRestValue('60');
      setDayRestUnit('seconds');
      setExerciseSearch('');
      setSelectedCategoryId('');
      setSelectedTypeId('');
      onOpenPlan?.(creationPlan.planEntrenamientoId);
      setSuccess('Plan guardado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el plan completo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceOrFinalize = async (event) => {
    event.preventDefault();

    if (!selectedRutinaDia || !creationPlanDays.length) {
      setError('No hay un dia seleccionado para continuar.');
      return;
    }

    persistCurrentDayDraft();

    const currentDayIndex = creationPlanDays.findIndex((day) => String(day.rutinaDiaId) === String(selectedRutinaDia.rutinaDiaId));
    const nextDay = currentDayIndex >= 0 ? creationPlanDays[currentDayIndex + 1] : null;

    if (nextDay) {
      setSelectedRutinaDiaId(String(nextDay.rutinaDiaId));
      setSuccess(`Dia ${selectedRutinaDia.numeroDia} guardado localmente. Continua con el siguiente dia.`);
      return;
    }

    await finalizePlanDrafts();
  };

  const handleCreatePlan = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!planForm.nombre || !planForm.descripcion || !planForm.duracionDias || !planForm.objetivo) {
      setError('Completa nombre, descripcion, duracion y objetivo para crear el plan.');
      return;
    }

    try {
      setLoading(true);
      const created = await apiRequest('/plan-entrenamiento', token, {
        method: 'POST',
        body: JSON.stringify({
          nombre: planForm.nombre,
          descripcion: planForm.descripcion,
          duracionDias: Number(planForm.duracionDias),
          objetivo: planForm.objetivo,
        }),
      });

      await onRefresh();

      const createdPlanId = String(created?.planEntrenamientoId || '');
      setSelectedPlanId(createdPlanId);
      setCreationPlanId(createdPlanId);
      setWorkflowMode('create');
      setCreationPhase('configure');
      setPlanForm({ nombre: '', descripcion: '', duracionDias: '', objetivo: '' });
      setSuccess('Plan creado correctamente. Continua con la asignacion de ejercicios por dia.');
    } catch (err) {
      setError(err.message || 'No se pudo crear el plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSelectedPlan = async () => {
    if (!selectedPlan) {
      setError('Selecciona una plantilla para asignar.');
      return;
    }

    if (!assignSelectedUser?.userId) {
      setError('Busca y selecciona un usuario por cédula para asignar la plantilla.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await apiRequest('/plan-entrenamiento/asignar-plan', token, {
        method: 'POST',
        body: JSON.stringify({
          planEntrenamientoId: selectedPlan.planEntrenamientoId,
          usuarioId: assignSelectedUser.userId,
        }),
      });

      await onRefresh();
      setAssignCedulaQuery('');
      setAssignSelectedUser(null);
      setSuccess('Plan asignado correctamente al usuario seleccionado.');
    } catch (err) {
      setError(err.message || 'No se pudo asignar el plan.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseSelection = (exercise) => {
    const ejercicioId = String(exercise.ejercicioId);

    setSelectedExerciseDrafts((current) => {
      if (current.some((item) => String(item.ejercicioId) === ejercicioId)) {
        return current.filter((item) => String(item.ejercicioId) !== ejercicioId);
      }

      return [
        ...current,
        {
          ejercicioId,
          ejercicio: exercise,
          series: defaultSeries,
          executionMode: defaultExecutionMode,
          repeticiones: defaultRepetitions,
          tiempoValor: defaultTimeValue,
          tiempoUnidad: defaultTimeUnit,
          descansoMode: 'general',
          descansoValor: '',
          descansoUnidad: dayRestUnit,
          calentamientos: [],
        },
      ];
    });
  };

  const addExerciseSelection = (exercise) => {
    const ejercicioId = String(exercise.ejercicioId);

    setSelectedExerciseDrafts((current) => {
      if (current.some((item) => String(item.ejercicioId) === ejercicioId)) {
        return current;
      }

      return [
        ...current,
        {
          ejercicioId,
          ejercicio: exercise,
          series: defaultSeries,
          executionMode: defaultExecutionMode,
          repeticiones: defaultRepetitions,
          tiempoValor: defaultTimeValue,
          tiempoUnidad: defaultTimeUnit,
          descansoMode: 'general',
          descansoValor: '',
          descansoUnidad: dayRestUnit,
          calentamientos: [],
        },
      ];
    });
  };

  const handleExerciseDragStart = (event, exercise) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', String(exercise.ejercicioId));
  };

  const handleDropSelectedZone = (event) => {
    event.preventDefault();
    setIsDropZoneActive(false);

    const draggedExerciseId = event.dataTransfer.getData('text/plain');
    if (!draggedExerciseId) {
      return;
    }

    const exercise = exercisesById.get(String(draggedExerciseId));
    if (!exercise) {
      return;
    }

    addExerciseSelection(exercise);
  };

  const updateExerciseDraft = (exerciseId, field, value) => {
    setSelectedExerciseDrafts((current) => current.map((item) => (
      String(item.ejercicioId) === String(exerciseId)
        ? { ...item, [field]: value }
        : item
    )));
  };

  const addWarmupToExercise = (exerciseId) => {
    setSelectedExerciseDrafts((current) => current.map((item) => {
      if (String(item.ejercicioId) !== String(exerciseId)) {
        return item;
      }

      return {
        ...item,
        calentamientos: [
          ...(Array.isArray(item.calentamientos) ? item.calentamientos : []),
          { mode: 'reps', valor: '10', unidad: 'seconds', intensidad: 'baja' },
        ],
      };
    }));
  };

  const updateWarmupDraft = (exerciseId, warmupIndex, field, value) => {
    setSelectedExerciseDrafts((current) => current.map((item) => {
      if (String(item.ejercicioId) !== String(exerciseId)) {
        return item;
      }

      const warmups = Array.isArray(item.calentamientos) ? item.calentamientos : [];
      return {
        ...item,
        calentamientos: warmups.map((warmup, index) => (
          index === warmupIndex ? { ...warmup, [field]: value } : warmup
        )),
      };
    }));
  };

  const removeWarmupFromExercise = (exerciseId, warmupIndex) => {
    setSelectedExerciseDrafts((current) => current.map((item) => {
      if (String(item.ejercicioId) !== String(exerciseId)) {
        return item;
      }

      const warmups = Array.isArray(item.calentamientos) ? item.calentamientos : [];
      return {
        ...item,
        calentamientos: warmups.filter((_, index) => index !== warmupIndex),
      };
    }));
  };

  const handleSaveDay = async (event) => {
    return handleAdvanceOrFinalize(event);
  };

  const selectedDayExercises = ejerciciosDelDia.map((item) => ({
    id: item.rutinaEjercicioId || `${item.orden}-${item.ejercicioId}`,
    nombre: item?.ejercicio?.nombre || 'Ejercicio sin nombre',
    series: item.series,
    repeticiones: item.repeticiones,
    tiempoSegundos: item.tiempoSegundos,
  }));

  return (
    <section className="plan-builder-shell">
      {error && <p className="status error">{error}</p>}
      {success && <p className="status success">{success}</p>}

      {viewMode === 'list' ? (
        <article className="plan-builder-card plan-builder-card--wide">
          <div className="card-head card-head--tight plan-builder-card__head">
            <div>
              <h2>Planes existentes</h2>
              <span>Selecciona una plantilla para ver acciones disponibles.</span>
            </div>
            <button type="button" className="btn-primary" onClick={openCreateWizard}>
              Crear plan
            </button>
          </div>

          {selectedPlan && (
            <div className="plan-builder-action-strip">
              <label className="plan-builder-inline-label plan-builder-inline-label--compact">
                Buscar por cédula
                <input
                  value={assignCedulaQuery}
                  onChange={(event) => {
                    setAssignCedulaQuery(event.target.value);
                    setAssignSelectedUser(null);
                  }}
                  placeholder="Ingresa cédula"
                />
              </label>

              <button
                type="button"
                className="btn-action"
                onClick={handleAssignSelectedPlan}
                disabled={loading || !assignSelectedUser?.userId}
              >
                Asignar
              </button>

              {assignSelectedUser && (
                <div className="selected-user-chip">
                  Usuario seleccionado: {assignSelectedUser.nombre} {assignSelectedUser.apellido} · Cédula: {assignSelectedUser.cedula}
                </div>
              )}

              {!assignSelectedUser && assignCedulaQuery.trim() && (
                <div className="user-search-list">
                  {assignUserMatches.length ? assignUserMatches.map((usuario) => (
                    <button
                      key={usuario.userId}
                      type="button"
                      className="user-search-item"
                      onClick={() => {
                        setAssignSelectedUser(usuario);
                        setAssignCedulaQuery(String(usuario.cedula || ''));
                      }}
                    >
                      <strong>{usuario.nombre} {usuario.apellido}</strong>
                      <span>{usuario.cedula}</span>
                    </button>
                  )) : (
                    <span className="plan-builder-empty">No hay usuarios con esa cédula.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {!planCards.length && (
            <div className="plan-builder-empty plan-builder-empty--highlight">
              Aun no hay plantillas. Usa Crear plan para iniciar el proceso.
            </div>
          )}

          <div className="plan-card-grid">
            {planCards.map((plan) => {
              const planId = String(plan.planEntrenamientoId);
              const dias = Array.isArray(plan.rutinasDia) ? plan.rutinasDia : [];
              const isActive = String(selectedPlanId) === planId;

              return (
                <article
                  key={planId}
                  className={`plan-card ${isActive ? 'plan-card--active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(planId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPlanId(planId);
                    }
                  }}
                >
                  <span className="plan-card__eyebrow">Plantilla</span>
                  <h3>{plan.nombre}</h3>
                  <p>{plan.descripcion || 'Sin descripcion'}</p>
                  <div className="plan-card__meta">
                    <span>{plan.duracionDias || 0} dias</span>
                    <span>{plan.objetivo || 'Sin objetivo'}</span>
                  </div>
                  <div className="plan-card__footer">
                    <strong>{dias.length} dias generados</strong>
                    <span>{plan.esPlantilla ? 'Activa como plantilla' : 'Asignado'}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-action plan-card__button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenPlan?.(planId);
                    }}
                  >
                    Ver detalle
                  </button>
                </article>
              );
            })}
          </div>
        </article>
      ) : (
        <article className="plan-builder-card plan-builder-card--wide">
          <div className="card-head card-head--tight plan-builder-card__head">
            <div>
              <h2>{workflowMode === 'edit' ? 'Ventana de edicion' : 'Ventana de creacion'}</h2>
              <span>{workflowMode === 'edit'
                ? 'Edita los dias existentes del plan y actualiza sus ejercicios.'
                : 'Completa el proceso por pasos hasta configurar todos los dias.'}</span>
            </div>

            <button type="button" className="btn-action" onClick={closeCreateWizard}>
              Cerrar
            </button>
          </div>

          {creationPhase === 'step1' ? (
            <form className="form-grid plan-builder-create-panel" onSubmit={handleCreatePlan}>
              <label>
                Nombre del plan
                <input
                  value={planForm.nombre}
                  onChange={(event) => setPlanForm((current) => ({ ...current, nombre: event.target.value }))}
                />
              </label>
              <label>
                Descripcion
                <input
                  value={planForm.descripcion}
                  onChange={(event) => setPlanForm((current) => ({ ...current, descripcion: event.target.value }))}
                />
              </label>
              <label>
                Duracion en dias
                <input
                  type="number"
                  min="1"
                  value={planForm.duracionDias}
                  onChange={(event) => setPlanForm((current) => ({ ...current, duracionDias: event.target.value }))}
                />
              </label>
              <label>
                Objetivo
                <input
                  value={planForm.objetivo}
                  onChange={(event) => setPlanForm((current) => ({ ...current, objetivo: event.target.value }))}
                />
              </label>

              <div className="plan-builder-create-actions">
                <button type="submit" className="btn-primary" disabled={loading}>Crear y continuar</button>
              </div>
            </form>
          ) : (
            <div className="plan-builder-grid">
              <article className="plan-builder-card plan-builder-card--wide plan-builder-card--fullwidth">
                <div className="card-head card-head--tight">
                  <div>
                    <h2>Asignar ejercicios por dia</h2>
                    <span>Actualiza la descripcion y guarda cada dia para avanzar.</span>
                  </div>
                </div>

                <div className="plan-builder-list plan-builder-day-list">
                  <strong>Dias del plan</strong>
                  {creationPlanDays.length ? creationPlanDays.map((dia) => {
                    const diaId = String(dia.rutinaDiaId);
                    const diaDraft = dayDrafts[diaId] || buildDraftForDay(dia, rutinaEjercicios, exercisesById, defaultSeries, defaultRepetitions);
                    return (
                      <button
                        key={diaId}
                        type="button"
                        className={`plan-builder-list-item ${selectedRutinaDiaId === diaId ? 'active' : ''}`}
                        onClick={() => {
                          persistCurrentDayDraft();
                          setSelectedRutinaDiaId(diaId);
                        }}
                      >
                        <strong>Dia {dia.numeroDia}</strong>
                        <span>{dia.nombre}</span>
                        <small>{diaDraft.descripcion || dia.descripcion || 'Sin descripcion'}</small>
                        <em>{(diaDraft.exercises || []).length} ejercicios</em>
                      </button>
                    );
                  }) : <span className="plan-builder-empty">Aun no hay dias disponibles.</span>}
                </div>

                <form className="form-grid plan-builder-day-form" onSubmit={handleSaveDay}>
                  <label>
                    Descripcion
                    <input
                      value={dayDescription}
                      onChange={(event) => setDayDescription(event.target.value)}
                      placeholder={selectedRutinaDia ? `Dia ${selectedRutinaDia.numeroDia}` : 'Selecciona un dia'}
                    />
                  </label>

                  <div className="plan-builder-rest-control">
                    <label>
                      Descanso general
                      <input
                        type="number"
                        min="1"
                        value={dayRestValue}
                        onChange={(event) => setDayRestValue(event.target.value)}
                        placeholder="60"
                      />
                    </label>

                    <label>
                      Unidad
                      <select
                        value={dayRestUnit}
                        onChange={(event) => setDayRestUnit(event.target.value)}
                      >
                        <option value="seconds">Segundos</option>
                        <option value="minutes">Minutos</option>
                      </select>
                    </label>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading || !selectedRutinaDia}>
                    {creationPlanDays.length && selectedRutinaDiaId === String(creationPlanDays[creationPlanDays.length - 1]?.rutinaDiaId)
                      ? 'Finalizar y guardar'
                      : 'Siguiente dia'}
                  </button>
                </form>

                <div className="plan-builder-list">
                  <strong>Ejercicios guardados en este dia</strong>
                  {selectedDayExercises.length ? selectedDayExercises.map((item) => (
                    <div key={item.id} className="plan-builder-list-item static">
                      {item.nombre} · {item.series || '-'} x {item.tiempoSegundos ? `${item.tiempoSegundos}s` : (item.repeticiones || '-')} · Descanso {item.descansoSegundos ? `${item.descansoSegundos}s` : 'general'}
                    </div>
                  )) : <span className="plan-builder-empty">Este dia aun no tiene ejercicios guardados.</span>}
                </div>
              </article>

              <article className="plan-builder-card plan-builder-card--fullwidth">
                <div className="card-head card-head--tight">
                  <div>
                    <h2>Ejercicios del dia</h2>
                    <span>Selecciona ejercicios, define series, repeticiones o tiempo, y guarda el dia.</span>
                  </div>
                </div>

                <div className="plan-builder-defaults">
                  <label>
                    Series por defecto
                    <input
                      type="number"
                      min="1"
                      value={defaultSeries}
                      onChange={(event) => setDefaultSeries(event.target.value)}
                    />
                  </label>

                  <label>
                    Modo general
                    <select value={defaultExecutionMode} onChange={(event) => setDefaultExecutionMode(event.target.value)}>
                      <option value="reps">Repeticiones</option>
                      <option value="time">Tiempo</option>
                    </select>
                  </label>

                  <label>
                    {defaultExecutionMode === 'time' ? 'Tiempo por defecto' : 'Repeticiones por defecto'}
                    {defaultExecutionMode === 'time' ? (
                      <input
                        type="number"
                        min="1"
                        value={defaultTimeValue}
                        onChange={(event) => setDefaultTimeValue(event.target.value)}
                      />
                    ) : (
                      <input
                        type="number"
                        min="1"
                        value={defaultRepetitions}
                        onChange={(event) => setDefaultRepetitions(event.target.value)}
                      />
                    )}
                  </label>

                  {defaultExecutionMode === 'time' && (
                    <label>
                      Unidad general
                      <select value={defaultTimeUnit} onChange={(event) => setDefaultTimeUnit(event.target.value)}>
                        <option value="seconds">Segundos</option>
                        <option value="minutes">Minutos</option>
                      </select>
                    </label>
                  )}
                </div>

                <div className="plan-builder-filters">
                  <label className="inline-filter">
                    Buscar ejercicio
                    <input
                      value={exerciseSearch}
                      onChange={(event) => setExerciseSearch(event.target.value)}
                      placeholder="Nombre, categoria, tipo o maquina"
                    />
                  </label>

                  <label className="inline-filter">
                    Categoria
                    <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
                      <option value="">Todas</option>
                      {categoryOptions.map((category) => (
                        <option key={category.categoriaId} value={category.categoriaId}>{category.nombre}</option>
                      ))}
                    </select>
                  </label>

                  <label className="inline-filter">
                    Tipo
                    <select value={selectedTypeId} onChange={(event) => setSelectedTypeId(event.target.value)}>
                      <option value="">Todos</option>
                      {typeOptions.map((type) => (
                        <option key={type.tipoId} value={type.tipoId}>{type.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="plan-builder-exercise-grid">
                  <section className="plan-builder-available-column">
                    <div className="plan-builder-section-head">
                      <strong>Ejercicios disponibles</strong>
                      <span>{availableExercises.length} resultados</span>
                    </div>

                    <div className="exercise-card-grid plan-builder-exercise-list">
                      {availableExercises.length ? availableExercises.map((exercise) => {
                        const exerciseId = String(exercise.ejercicioId);
                        const categoria = exercise?.categoria?.nombre || 'Sin categoria';
                        const tipo = exercise?.tipo?.nombre || 'Sin tipo';
                        const maquina = exercise?.maquina?.nombre || 'Sin maquina';

                        return (
                          <article
                            key={exerciseId}
                            className="exercise-card exercise-pick-card"
                            role="button"
                            tabIndex={0}
                            draggable
                            onDragStart={(event) => handleExerciseDragStart(event, exercise)}
                            onClick={() => addExerciseSelection(exercise)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                addExerciseSelection(exercise);
                              }
                            }}
                          >
                            <div className="exercise-card__summary-main">
                              <ExerciseThumbnail
                                src={exercise?.linkVideo || ''}
                                className="exercise-card__poster exercise-card__poster--compact"
                                alt={`Miniatura de ${exercise.nombre}`}
                              />
                              <div className="exercise-card__summary-copy">
                                <span className="exercise-card__eyebrow">Ejercicio</span>
                                <h3>{exercise.nombre}</h3>
                                <p>{[categoria, tipo].join(' · ')}</p>
                              </div>
                            </div>

                            <div className="exercise-pick-card__meta">
                              <div>
                                <span>Categoria</span>
                                <strong>{categoria}</strong>
                              </div>
                              <div>
                                <span>Tipo</span>
                                <strong>{tipo}</strong>
                              </div>
                              <div>
                                <span>Maquina</span>
                                <strong>{maquina}</strong>
                              </div>
                            </div>
                          </article>
                        );
                      }) : (
                        <div className="exercise-empty">No hay ejercicios que coincidan con los filtros.</div>
                      )}
                    </div>
                  </section>

                  <section className="plan-builder-selected-column">
                    <div className="plan-builder-section-head">
                      <strong>Ejercicios seleccionados</strong>
                      <span>{selectedExerciseDrafts.length} seleccionados</span>
                    </div>

                    <div
                      className={`plan-builder-selected-list ${isDropZoneActive ? 'drop-ready' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDropZoneActive(true);
                      }}
                      onDragLeave={() => setIsDropZoneActive(false)}
                      onDrop={handleDropSelectedZone}
                    >
                      {selectedExerciseDrafts.length ? selectedExerciseDrafts.map((draft) => {
                        const exercise = draft.ejercicio || {};
                        const categoria = exercise?.categoria?.nombre || 'Sin categoria';
                        const tipo = exercise?.tipo?.nombre || 'Sin tipo';
                        const maquina = exercise?.maquina?.nombre || 'Sin maquina';

                        return (
                          <article key={draft.ejercicioId} className="exercise-card exercise-card--selected plan-builder-selected-card">
                            <div className="exercise-card__summary-main">
                              <ExerciseThumbnail
                                src={exercise?.linkVideo || ''}
                                className="exercise-card__poster exercise-card__poster--compact"
                                alt={`Miniatura de ${exercise.nombre || 'ejercicio'}`}
                              />
                              <div className="exercise-card__summary-copy">
                                <span className="exercise-card__eyebrow">Seleccionado</span>
                                <h3>{exercise.nombre || 'Ejercicio sin nombre'}</h3>
                                <p>{[categoria, tipo, maquina].join(' · ')}</p>
                              </div>
                            </div>

                            <div className="plan-builder-selected-fields">
                              <label>
                                Series
                                <input
                                  type="number"
                                  min="1"
                                  value={draft.series}
                                  onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'series', event.target.value)}
                                />
                              </label>

                              <label>
                                Modo de ejecucion
                                <select
                                  value={draft.executionMode || 'reps'}
                                  onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'executionMode', event.target.value)}
                                >
                                  <option value="reps">Repeticiones</option>
                                  <option value="time">Tiempo</option>
                                </select>
                              </label>

                              {draft.executionMode === 'time' ? (
                                <>
                                  <label>
                                    Tiempo
                                    <input
                                      type="number"
                                      min="1"
                                      value={draft.tiempoValor || ''}
                                      onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'tiempoValor', event.target.value)}
                                    />
                                  </label>

                                  <label>
                                    Unidad
                                    <select
                                      value={draft.tiempoUnidad || 'seconds'}
                                      onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'tiempoUnidad', event.target.value)}
                                    >
                                      <option value="seconds">Segundos</option>
                                      <option value="minutes">Minutos</option>
                                    </select>
                                  </label>
                                </>
                              ) : (
                                <label>
                                  Repeticiones
                                  <input
                                    type="number"
                                    min="1"
                                    value={draft.repeticiones}
                                    onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'repeticiones', event.target.value)}
                                  />
                                </label>
                              )}

                              <label>
                                Descanso
                                <select
                                  value={draft.descansoMode || 'general'}
                                  onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'descansoMode', event.target.value)}
                                >
                                  <option value="general">General</option>
                                  <option value="specific">Específico</option>
                                </select>
                              </label>

                              {(draft.descansoMode || 'general') === 'specific' && (
                                <>
                                  <label>
                                    Descanso específico
                                    <input
                                      type="number"
                                      min="1"
                                      value={draft.descansoValor || ''}
                                      onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'descansoValor', event.target.value)}
                                    />
                                  </label>

                                  <label>
                                    Unidad
                                    <select
                                      value={draft.descansoUnidad || 'seconds'}
                                      onChange={(event) => updateExerciseDraft(draft.ejercicioId, 'descansoUnidad', event.target.value)}
                                    >
                                      <option value="seconds">Segundos</option>
                                      <option value="minutes">Minutos</option>
                                    </select>
                                  </label>
                                </>
                              )}
                            </div>

                            <div className="plan-builder-selected-note">
                              {categoria} · {tipo} · {maquina}
                            </div>

                            <div className="plan-builder-warmups">
                              <div className="plan-builder-warmups__head">
                                <strong>Calentamientos</strong>
                                <button
                                  type="button"
                                  className="btn-action"
                                  onClick={() => addWarmupToExercise(draft.ejercicioId)}
                                >
                                  + Agregar
                                </button>
                              </div>

                              {(Array.isArray(draft.calentamientos) && draft.calentamientos.length) ? (
                                draft.calentamientos.map((warmup, warmupIndex) => (
                                  <div key={`${draft.ejercicioId}-warmup-${warmupIndex}`} className="plan-builder-warmup-item">
                                    <label>
                                      Modo
                                      <select
                                        value={warmup.mode || 'reps'}
                                        onChange={(event) => updateWarmupDraft(draft.ejercicioId, warmupIndex, 'mode', event.target.value)}
                                      >
                                        <option value="reps">Repeticiones</option>
                                        <option value="time">Tiempo</option>
                                      </select>
                                    </label>

                                    <label>
                                      {(warmup.mode || 'reps') === 'time' ? 'Tiempo' : 'Repeticiones'}
                                      <input
                                        type="number"
                                        min="1"
                                        value={warmup.valor || ''}
                                        onChange={(event) => updateWarmupDraft(draft.ejercicioId, warmupIndex, 'valor', event.target.value)}
                                      />
                                    </label>

                                    {(warmup.mode || 'reps') === 'time' && (
                                      <label>
                                        Unidad
                                        <select
                                          value={warmup.unidad || 'seconds'}
                                          onChange={(event) => updateWarmupDraft(draft.ejercicioId, warmupIndex, 'unidad', event.target.value)}
                                        >
                                          <option value="seconds">Segundos</option>
                                          <option value="minutes">Minutos</option>
                                        </select>
                                      </label>
                                    )}

                                    <label>
                                      Intensidad
                                      <select
                                        value={warmup.intensidad || 'baja'}
                                        onChange={(event) => updateWarmupDraft(draft.ejercicioId, warmupIndex, 'intensidad', event.target.value)}
                                      >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                      </select>
                                    </label>

                                    <button
                                      type="button"
                                      className="btn-action danger"
                                      onClick={() => removeWarmupFromExercise(draft.ejercicioId, warmupIndex)}
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <small className="plan-builder-empty">Sin calentamientos configurados.</small>
                              )}
                            </div>

                            <div className="exercise-card__actions">
                              <button type="button" className="btn-action danger" onClick={() => toggleExerciseSelection(exercise)}>
                                Quitar
                              </button>
                            </div>
                          </article>
                        );
                      }) : (
                        <div className="plan-builder-empty plan-builder-empty--highlight">
                          Selecciona ejercicios de la lista para agregarlos aqui.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </article>
            </div>
          )}
        </article>
      )}
    </section>
  );
}

export default PlanBuilderScreen;
