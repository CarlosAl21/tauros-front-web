function PlanDetailScreen({ plan, loading }) {
  if (loading) {
    return <div className="plan-detail-empty">Cargando plan...</div>;
  }

  if (!plan) {
    return <div className="plan-detail-empty">No se encontró el plan solicitado.</div>;
  }

  const dias = Array.isArray(plan.rutinasDia) ? plan.rutinasDia : [];
  const usuarioNombre = plan?.usuario
    ? [plan.usuario.nombre, plan.usuario.apellido].filter(Boolean).join(' ').trim() || plan.usuario.correo || 'Sin usuario'
    : 'Sin usuario';

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
            <span>Usuario</span>
            <strong>{usuarioNombre}</strong>
          </div>
          <div>
            <span>Dias configurados</span>
            <strong>{dias.length}</strong>
          </div>
        </div>
      </article>

      <div className="plan-detail-days">
        {dias.length ? dias.map((dia) => {
          const ejercicios = Array.isArray(dia.rutinasEjercicio) ? dia.rutinasEjercicio : [];

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

                  return (
                    <div key={item.rutinaEjercicioId} className="plan-day-exercise">
                      <strong>#{item.orden || '-'} {ejercicioNombre}</strong>
                      <span>{item.series || '-'} x {item.repeticiones || '-'}</span>
                      <span>{item.carga || 'Carga libre'}</span>
                      <p>{item.notasEspecificas || 'Sin notas'}</p>
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