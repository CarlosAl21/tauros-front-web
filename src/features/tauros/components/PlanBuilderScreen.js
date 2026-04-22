import { useMemo, useState } from 'react';
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
      || '',
    );
  }

  return String(candidate);
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
}) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedRutinaDiaId, setSelectedRutinaDiaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [planForm, setPlanForm] = useState({
    nombre: '',
    descripcion: '',
    duracionDias: '',
    objetivo: '',
    usuarioId: '',
  });

  const [diaForm, setDiaForm] = useState({
    numeroDia: '',
    nombre: '',
    descripcion: '',
  });

  const [rutinaEjercicioForm, setRutinaEjercicioForm] = useState({
    orden: '',
    series: '',
    repeticiones: '',
    carga: '',
    notasEspecificas: '',
    ejercicioId: '',
  });

  const planOptions = useMemo(
    () => (Array.isArray(plans) ? plans : []).map((plan) => ({
      value: String(plan.planEntrenamientoId),
      label: `${plan.nombre} (${plan.duracionDias || 0} dias)`,
    })),
    [plans],
  );

  const rutinaDiasDelPlan = useMemo(() => {
    const source = Array.isArray(rutinaDias) ? rutinaDias : [];
    if (!selectedPlanId) {
      return source;
    }

    return source.filter((dia) => {
      const planId = resolveId(dia.planEntrenamiento) || resolveId(dia.planEntrenamientoId);
      return String(planId) === String(selectedPlanId);
    });
  }, [rutinaDias, selectedPlanId]);

  const ejerciciosPorDia = useMemo(() => {
    const source = Array.isArray(rutinaEjercicios) ? rutinaEjercicios : [];
    if (!selectedRutinaDiaId) {
      return source;
    }

    return source.filter((item) => {
      const diaId = resolveId(item.rutinaDia) || resolveId(item.rutinaDiaId);
      return String(diaId) === String(selectedRutinaDiaId);
    });
  }, [rutinaEjercicios, selectedRutinaDiaId]);

  const planCards = useMemo(() => (Array.isArray(plans) ? plans : []), [plans]);

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
      const payload = {
        nombre: planForm.nombre,
        descripcion: planForm.descripcion,
        duracionDias: Number(planForm.duracionDias),
        objetivo: planForm.objetivo,
      };

      if (planForm.usuarioId) {
        payload.usuarioId = planForm.usuarioId;
      }

      const created = await apiRequest('/plan-entrenamiento', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await onRefresh();
      setSelectedPlanId(String(created?.planEntrenamientoId || ''));
      setPlanForm({ nombre: '', descripcion: '', duracionDias: '', objetivo: '', usuarioId: '' });
      setSuccess('Plan creado correctamente. Ahora agrega sus dias.');
    } catch (err) {
      setError(err.message || 'No se pudo crear el plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDia = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPlanId) {
      setError('Primero selecciona un plan para agregar un dia de rutina.');
      return;
    }

    if (!diaForm.numeroDia || !diaForm.nombre || !diaForm.descripcion) {
      setError('Completa numero de dia, nombre y descripcion.');
      return;
    }

    try {
      setLoading(true);
      const created = await apiRequest('/rutina-dia', token, {
        method: 'POST',
        body: JSON.stringify({
          numeroDia: Number(diaForm.numeroDia),
          nombre: diaForm.nombre,
          descripcion: diaForm.descripcion,
          planEntrenamientoId: selectedPlanId,
        }),
      });

      await onRefresh();
      setSelectedRutinaDiaId(String(created?.rutinaDiaId || ''));
      setDiaForm({ numeroDia: '', nombre: '', descripcion: '' });
      setSuccess('Dia de rutina creado. Ahora agrega ejercicios a ese dia.');
    } catch (err) {
      setError(err.message || 'No se pudo crear el dia de rutina.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRutinaEjercicio = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedRutinaDiaId) {
      setError('Selecciona un dia de rutina para agregar ejercicios.');
      return;
    }

    if (!rutinaEjercicioForm.ejercicioId) {
      setError('Selecciona un ejercicio para el dia de rutina.');
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/rutina-ejercicio', token, {
        method: 'POST',
        body: JSON.stringify({
          orden: Number(rutinaEjercicioForm.orden || 1),
          series: Number(rutinaEjercicioForm.series || 1),
          repeticiones: Number(rutinaEjercicioForm.repeticiones || 1),
          carga: rutinaEjercicioForm.carga || 'Libre',
          notasEspecificas: rutinaEjercicioForm.notasEspecificas || '-',
          rutinaDiaId: selectedRutinaDiaId,
          ejercicioId: rutinaEjercicioForm.ejercicioId,
        }),
      });

      await onRefresh();
      setRutinaEjercicioForm({
        orden: '',
        series: '',
        repeticiones: '',
        carga: '',
        notasEspecificas: '',
        ejercicioId: '',
      });
      setSuccess('Ejercicio agregado correctamente al dia de rutina.');
    } catch (err) {
      setError(err.message || 'No se pudo agregar el ejercicio a la rutina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="plan-builder-shell">
      <article className="plan-builder-card plan-builder-card--wide">
        <div className="card-head card-head--tight">
          <div>
            <h2>Planes existentes</h2>
            <span>Selecciona una tarjeta para ver el detalle completo.</span>
          </div>
        </div>

        <div className="plan-card-grid">
          {planCards.length ? planCards.map((plan) => {
            const planId = String(plan.planEntrenamientoId);
            const dias = Array.isArray(plan.rutinasDia) ? plan.rutinasDia : [];
            const usuarioNombre = plan?.usuario
              ? [plan.usuario.nombre, plan.usuario.apellido].filter(Boolean).join(' ').trim() || plan.usuario.correo || 'Sin usuario'
              : 'Sin usuario';

            return (
              <article
                key={planId}
                className="plan-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpenPlan?.(planId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenPlan?.(planId);
                  }
                }}
              >
                <span className="plan-card__eyebrow">Plan</span>
                <h3>{plan.nombre}</h3>
                <p>{plan.descripcion || 'Sin descripcion'}</p>
                <div className="plan-card__meta">
                  <span>{plan.duracionDias || 0} dias</span>
                  <span>{plan.objetivo || 'Sin objetivo'}</span>
                </div>
                <div className="plan-card__footer">
                  <strong>{usuarioNombre}</strong>
                  <span>{dias.length} dias de rutina</span>
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
          }) : (
            <div className="plan-builder-empty">Aun no hay planes creados.</div>
          )}
        </div>
      </article>

      {error && <p className="status error">{error}</p>}
      {success && <p className="status success">{success}</p>}

      <div className="plan-builder-grid">
        <article className="plan-builder-card">
          <h3>Paso 1: Crear plan</h3>
          <form className="form-grid" onSubmit={handleCreatePlan}>
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
            <label>
              Usuario (opcional)
              <select
                value={planForm.usuarioId}
                onChange={(event) => setPlanForm((current) => ({ ...current, usuarioId: event.target.value }))}
              >
                <option value="">Sin usuario</option>
                {(Array.isArray(usuarios) ? usuarios : []).map((usuario) => (
                  <option key={usuario.userId} value={usuario.userId}>
                    {usuario.nombre} {usuario.apellido}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>Crear plan</button>
          </form>
        </article>

        <article className="plan-builder-card">
          <h3>Paso 2: Agregar dias</h3>
          <label className="plan-builder-inline-label">
            Plan de trabajo
            <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
              <option value="">Selecciona un plan</option>
              {planOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <form className="form-grid" onSubmit={handleCreateDia}>
            <label>
              Numero de dia
              <input
                type="number"
                min="1"
                value={diaForm.numeroDia}
                onChange={(event) => setDiaForm((current) => ({ ...current, numeroDia: event.target.value }))}
              />
            </label>
            <label>
              Nombre del dia
              <input
                value={diaForm.nombre}
                onChange={(event) => setDiaForm((current) => ({ ...current, nombre: event.target.value }))}
              />
            </label>
            <label>
              Descripcion del dia
              <input
                value={diaForm.descripcion}
                onChange={(event) => setDiaForm((current) => ({ ...current, descripcion: event.target.value }))}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>Agregar dia</button>
          </form>

          <div className="plan-builder-list">
            <strong>Dias del plan seleccionado</strong>
            {rutinaDiasDelPlan.length ? rutinaDiasDelPlan.map((dia) => {
              const diaId = String(dia.rutinaDiaId);
              return (
                <button
                  key={diaId}
                  type="button"
                  className={`plan-builder-list-item ${selectedRutinaDiaId === diaId ? 'active' : ''}`}
                  onClick={() => setSelectedRutinaDiaId(diaId)}
                >
                  Dia {dia.numeroDia}: {dia.nombre}
                </button>
              );
            }) : <span className="plan-builder-empty">Aun no hay dias para este plan.</span>}
          </div>
        </article>

        <article className="plan-builder-card">
          <h3>Paso 3: Asignar ejercicios</h3>
          <label className="plan-builder-inline-label">
            Dia de rutina
            <select value={selectedRutinaDiaId} onChange={(event) => setSelectedRutinaDiaId(event.target.value)}>
              <option value="">Selecciona un dia</option>
              {rutinaDiasDelPlan.map((dia) => (
                <option key={dia.rutinaDiaId} value={dia.rutinaDiaId}>
                  Dia {dia.numeroDia}: {dia.nombre}
                </option>
              ))}
            </select>
          </label>

          <form className="form-grid" onSubmit={handleCreateRutinaEjercicio}>
            <label>
              Ejercicio
              <select
                value={rutinaEjercicioForm.ejercicioId}
                onChange={(event) => setRutinaEjercicioForm((current) => ({ ...current, ejercicioId: event.target.value }))}
              >
                <option value="">Selecciona un ejercicio</option>
                {(Array.isArray(ejercicios) ? ejercicios : []).map((ejercicio) => (
                  <option key={ejercicio.ejercicioId} value={ejercicio.ejercicioId}>{ejercicio.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              Orden
              <input
                type="number"
                min="1"
                value={rutinaEjercicioForm.orden}
                onChange={(event) => setRutinaEjercicioForm((current) => ({ ...current, orden: event.target.value }))}
              />
            </label>
            <label>
              Series
              <input
                type="number"
                min="1"
                value={rutinaEjercicioForm.series}
                onChange={(event) => setRutinaEjercicioForm((current) => ({ ...current, series: event.target.value }))}
              />
            </label>
            <label>
              Repeticiones
              <input
                type="number"
                min="1"
                value={rutinaEjercicioForm.repeticiones}
                onChange={(event) => setRutinaEjercicioForm((current) => ({ ...current, repeticiones: event.target.value }))}
              />
            </label>
            <label>
              Carga
              <input
                value={rutinaEjercicioForm.carga}
                onChange={(event) => setRutinaEjercicioForm((current) => ({ ...current, carga: event.target.value }))}
              />
            </label>
            <label>
              Notas
              <input
                value={rutinaEjercicioForm.notasEspecificas}
                onChange={(event) => setRutinaEjercicioForm((current) => ({ ...current, notasEspecificas: event.target.value }))}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>Agregar ejercicio</button>
          </form>

          <div className="plan-builder-list">
            <strong>Ejercicios del dia seleccionado</strong>
            {ejerciciosPorDia.length ? ejerciciosPorDia.map((item) => {
              const id = item.rutinaEjercicioId || `${item.orden}-${item.ejercicioId}`;
              const ejercicioNombre = item?.ejercicio?.nombre
                || (Array.isArray(ejercicios) ? ejercicios.find((ej) => String(ej.ejercicioId) === String(item.ejercicioId))?.nombre : '')
                || `Ejercicio ${resolveId(item.ejercicioId)}`;

              return (
                <div key={id} className="plan-builder-list-item static">
                  #{item.orden || '-'} · {ejercicioNombre} · {item.series || '-'}x{item.repeticiones || '-'}
                </div>
              );
            }) : <span className="plan-builder-empty">Aun no hay ejercicios para este dia.</span>}
          </div>
        </article>
      </div>
    </section>
  );
}

export default PlanBuilderScreen;
