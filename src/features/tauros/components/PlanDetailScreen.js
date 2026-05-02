import { useState } from 'react';
import { apiRequest } from '../services/api';

function PlanDetailScreen({ plan, loading, token, onUpdate }) {
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  if (loading) {
    return <div className="plan-detail-empty">Cargando plan...</div>;
  }

  if (!plan) {
    return <div className="plan-detail-empty">No se encontró el plan solicitado.</div>;
  }

  const dias = (Array.isArray(plan.rutinasDia) ? plan.rutinasDia : [])
    .slice()
    .sort((left, right) => Number(left?.numeroDia || 0) - Number(right?.numeroDia || 0));

  const startEdit = (exercise) => {
    setEditingExerciseId(exercise.rutinaEjercicioId);
    setEditForm({
      series: String(exercise.series || ''),
      repeticiones: exercise.repeticiones ? String(exercise.repeticiones) : '',
      tiempoSegundos: exercise.tiempoSegundos ? String(exercise.tiempoSegundos) : '',
      descansoSegundos: exercise.descansoSegundos ? String(exercise.descansoSegundos) : '',
      carga: String(exercise.carga || ''),
      notasEspecificas: String(exercise.notasEspecificas || ''),
    });
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingExerciseId(null);
    setEditForm({});
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editingExerciseId || !token) {
      return;
    }

    try {
      setEditError('');
      setEditLoading(true);

      const payload = {};
      if (editForm.series) payload.series = Number(editForm.series);
      if (editForm.repeticiones) payload.repeticiones = Number(editForm.repeticiones);
      if (editForm.tiempoSegundos) payload.tiempoSegundos = Number(editForm.tiempoSegundos);
      if (editForm.descansoSegundos) payload.descansoSegundos = Number(editForm.descansoSegundos);
      if (editForm.carga) payload.carga = editForm.carga;
      if (editForm.notasEspecificas) payload.notasEspecificas = editForm.notasEspecificas;

      await apiRequest(`/rutina-ejercicio/${editingExerciseId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setEditingExerciseId(null);
      setEditForm({});
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setEditError(err.message || 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <section className="plan-detail-shell">
      <article className="plan-detail-card">
        <div className="plan-detail-hero">
          <div>
            <span className="plan-card__eyebrow">Plan de entrenamiento</span>
            <h2>{plan.nombre}</h2>
            <p>{plan.descripcion || 'Sin descripcion'}</p>
          </div>
          <div className="plan-detail-badges">
            <span>{plan.duracionDias || 0} dias</span>
            <span>{plan.objetivo || 'Sin objetivo'}</span>
            <span>{plan.esPlantilla ? 'Plantilla' : 'Asignado'}</span>
          </div>
        </div>

        <div className="plan-detail-summary">
          <div>
            <span>Tipo</span>
            <strong>{plan.esPlantilla ? 'Plantilla' : 'Plan asignado'}</strong>
          </div>
          <div>
            <span>Dias configurados</span>
            <strong>{dias.length}</strong>
          </div>
        </div>
      </article>

      <div className="plan-detail-days">
        {dias.length ? dias.map((dia) => {
          const ejercicios = (Array.isArray(dia.rutinasEjercicio) ? dia.rutinasEjercicio : [])
            .slice()
            .sort((left, right) => Number(left?.orden || 0) - Number(right?.orden || 0));

          return (
            <article key={dia.rutinaDiaId} className="plan-day-card">
              <div className="card-head card-head--tight">
                <div>
                  <h2>Dia {dia.numeroDia}: {dia.nombre}</h2>
                  <span>{dia.descripcion || 'Sin descripcion'}</span>
                </div>
              </div>

              <div className="plan-day-exercises">
                {ejercicios.length ? ejercicios.map((item) => {
                  const ejercicioNombre = item?.ejercicio?.nombre || 'Ejercicio sin nombre';
                  const isEditing = editingExerciseId === item.rutinaEjercicioId;

                  return (
                    <div
                      key={item.rutinaEjercicioId}
                      className={`plan-day-exercise ${isEditing ? 'plan-day-exercise--editing' : ''}`}
                    >
                      {isEditing ? (
                        <div className="plan-day-exercise__edit-form">
                          <div className="plan-day-exercise__form-row">
                            <label>
                              Series
                              <input
                                type="number"
                                min="1"
                                value={editForm.series || ''}
                                onChange={(e) => setEditForm({ ...editForm, series: e.target.value })}
                              />
                            </label>
                            <label>
                              Repeticiones
                              <input
                                type="number"
                                min="1"
                                value={editForm.repeticiones || ''}
                                onChange={(e) => setEditForm({ ...editForm, repeticiones: e.target.value })}
                              />
                            </label>
                            <label>
                              Tiempo (seg)
                              <input
                                type="number"
                                min="0"
                                value={editForm.tiempoSegundos || ''}
                                onChange={(e) => setEditForm({ ...editForm, tiempoSegundos: e.target.value })}
                              />
                            </label>
                            <label>
                              Descanso (seg)
                              <input
                                type="number"
                                min="0"
                                value={editForm.descansoSegundos || ''}
                                onChange={(e) => setEditForm({ ...editForm, descansoSegundos: e.target.value })}
                              />
                            </label>
                          </div>
                          <div className="plan-day-exercise__form-row">
                            <label>
                              Carga
                              <input
                                type="text"
                                value={editForm.carga || ''}
                                onChange={(e) => setEditForm({ ...editForm, carga: e.target.value })}
                              />
                            </label>
                            <label>
                              Notas especiales
                              <textarea
                                value={editForm.notasEspecificas || ''}
                                onChange={(e) => setEditForm({ ...editForm, notasEspecificas: e.target.value })}
                              />
                            </label>
                          </div>
                          {editError && <p className="status error">{editError}</p>}
                          <div className="plan-day-exercise__actions">
                            <button
                              type="button"
                              className="btn-action"
                              onClick={saveEdit}
                              disabled={editLoading}
                            >
                              {editLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="btn-action"
                              onClick={cancelEdit}
                              disabled={editLoading}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <strong>#{item.orden || '-'} {ejercicioNombre}</strong>
                          <span>{item.series || '-'} x {item.repeticiones || (item.tiempoSegundos ? `${Math.floor(item.tiempoSegundos / 60)}min` : '-')}</span>
                          <span>{item.carga || 'Carga libre'}</span>
                          <p>{item.notasEspecificas || 'Sin notas'}</p>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => startEdit(item)}
                          >
                            Editar
                          </button>
                        </>
                      )}
                    </div>
                  );
                }) : (
                  <div className="plan-detail-empty">Este dia aun no tiene ejercicios.</div>
                )}
              </div>
            </article>
          );
        }) : (
          <article className="plan-day-card">
            <div className="plan-detail-empty">Este plan aun no tiene dias configurados.</div>
          </article>
        )}
      </div>
    </section>
  );
}

export default PlanDetailScreen;