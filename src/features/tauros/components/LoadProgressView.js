import {
  LOAD_UNITS,
  buildSparklinePoints,
  convertFromKg,
  formatLoad,
  formatLoadDate,
  formatLoadDelta,
} from '../utils/loadProgress';

const SPARKLINE_WIDTH = 160;
const SPARKLINE_HEIGHT = 36;

function LoadSparkline({ records, unit }) {
  // History arrives newest first; the line must read left (old) to right (new).
  const values = [...records].reverse().map((record) => convertFromKg(record.cargaKg, unit));
  const points = buildSparklinePoints(values, SPARKLINE_WIDTH, SPARKLINE_HEIGHT, 3);

  if (!points) {
    return null;
  }

  return (
    <svg
      className="load-progress__sparkline"
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Tendencia de carga"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function LoadHistory({ history, unit, onRetry }) {
  if (!history || history.status === 'loading') {
    return <p className="empty-message">Cargando historial...</p>;
  }

  if (history.status === 'error') {
    return (
      <div className="load-progress__history-error">
        <p className="status error">{history.error}</p>
        <button type="button" className="btn-action" onClick={onRetry}>Reintentar</button>
      </div>
    );
  }

  if (!history.data.length) {
    return <p className="empty-message">Sin registros para este ejercicio</p>;
  }

  return (
    <div className="load-progress__history">
      <LoadSparkline records={history.data} unit={unit} />
      <ul className="load-progress__history-list">
        {history.data.map((record) => (
          <li key={record.registroCargaId}>
            <span>{formatLoadDate(record.fechaRegistro)}</span>
            <strong>{formatLoad(record.cargaKg, unit)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadProgressView({
  summary,
  loading,
  error,
  unit,
  onUnitChange,
  expandedId,
  onToggleExercise,
  histories,
  onRetrySummary,
  onRetryHistory,
}) {
  return (
    <div className="load-progress">
      <div className="load-progress__head">
        <h4>Progreso de carga</h4>
        <div className="load-progress__units" role="group" aria-label="Unidad de carga">
          {LOAD_UNITS.map((option) => (
            <button
              key={option}
              type="button"
              className={`load-progress__unit ${unit === option ? 'active' : ''}`}
              aria-pressed={unit === option}
              onClick={() => onUnitChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="empty-message">Cargando progreso de carga...</p>}

      {!loading && error && (
        <div className="load-progress__history-error">
          <p className="status error">{error}</p>
          <button type="button" className="btn-action" onClick={onRetrySummary}>Reintentar</button>
        </div>
      )}

      {!loading && !error && !summary.length && (
        <p className="empty-message">Este usuario aún no registró cargas</p>
      )}

      {!loading && !error && summary.length > 0 && (
        <div className="load-progress__list">
          {summary.map((item) => {
            const isExpanded = expandedId === item.ejercicioId;
            const delta = formatLoadDelta(item.primeraCargaKg, item.ultimaCargaKg, unit);
            const panelId = `load-history-${item.ejercicioId}`;

            return (
              <article key={item.ejercicioId} className={`load-progress__item ${isExpanded ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="load-progress__row"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => onToggleExercise(item.ejercicioId)}
                >
                  <strong className="load-progress__name">{item.ejercicioNombre || 'Ejercicio sin nombre'}</strong>
                  <span className="load-progress__range">
                    {formatLoad(item.primeraCargaKg, unit)} → {formatLoad(item.ultimaCargaKg, unit)}
                  </span>
                  <span className={`load-progress__delta load-progress__delta--${delta.trend}`}>{delta.text}</span>
                  <span className="load-progress__meta">
                    {item.registros} {Number(item.registros) === 1 ? 'registro' : 'registros'}
                  </span>
                  <span className="load-progress__meta">Último: {formatLoadDate(item.ultimaFecha)}</span>
                </button>

                {isExpanded && (
                  <div id={panelId} className="load-progress__panel">
                    <LoadHistory
                      history={histories[item.ejercicioId]}
                      unit={unit}
                      onRetry={() => onRetryHistory(item.ejercicioId)}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LoadProgressView;
