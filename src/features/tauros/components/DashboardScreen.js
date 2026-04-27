function DashboardScreen({ metrics, dashboardData, insights }) {
  return (
    <section className="dashboard-grid">
      {metrics.map((item) => (
        <article className="metric-card" key={item.label}>
          <h2>{item.label}</h2>
          <strong>{item.value}</strong>
        </article>
      ))}

      {insights && (
        <>
          <article className="insights-card">
            <h2>Resumen de Rendimiento</h2>
            <div className="insights-metrics">
              <div className="insight-metric">
                <span className="insight-label">Usuarios Activos</span>
                <span className="insight-value">{insights.resumen.usuariosActivos}</span>
              </div>
              <div className="insight-metric">
                <span className="insight-label">Cobertura de Planes</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${insights.resumen.coberturaPlanes}%` }}
                  ></div>
                </div>
                <span className="insight-value">{insights.resumen.coberturaPlanes}%</span>
              </div>
              <div className="insight-metric">
                <span className="insight-label">Eventos Próximos</span>
                <span className="insight-value">{insights.resumen.eventosProximos}</span>
              </div>
              <div className="insight-metric">
                <span className="insight-label">Con Mejora</span>
                <span className="insight-value success">{insights.resumen.usuariosConMejora}</span>
              </div>
              <div className="insight-metric">
                <span className="insight-label">Sin Cambios</span>
                <span className="insight-value">{insights.resumen.usuariosSinCambio}</span>
              </div>
            </div>
          </article>

          <article className="opportunities-card">
            <h2>Oportunidades de Mejora</h2>
            <div className="opportunities-list">
              {insights.oportunidades.length > 0 ? (
                insights.oportunidades.map((oportunidad, idx) => (
                  <div key={idx} className="opportunity-item">
                    <span className="opportunity-icon">⚠️</span>
                    <span className="opportunity-text">{oportunidad}</span>
                  </div>
                ))
              ) : (
                <p>Todo está optimizado. ¡Excelente trabajo!</p>
              )}
            </div>
          </article>
        </>
      )}

      {insights?.ejerciciosPopulares && (
        <>
          <article className="stats-card top-ejercicios">
            <h2>Top 10 Ejercicios Más Usados</h2>
            <div className="stats-list">
              {Array.isArray(insights.ejerciciosPopulares.ejercicios) && insights.ejerciciosPopulares.ejercicios.slice(0, 10).map((ejercicio, idx) => (
                <div key={idx} className="stat-row">
                  <span className="stat-rank">{idx + 1}</span>
                  <span className="stat-name">{ejercicio.nombre}</span>
                  <span className="stat-count">{ejercicio.cantidad}x</span>
                </div>
              ))}
            </div>
          </article>

          <article className="stats-card categorias">
            <h2>Categorías Populares</h2>
            <div className="stats-list">
              {Array.isArray(insights.ejerciciosPopulares.categorias) && insights.ejerciciosPopulares.categorias.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="stat-row">
                  <span className="stat-rank">{idx + 1}</span>
                  <span className="stat-name">{cat.nombre}</span>
                  <span className="stat-count">{cat.cantidad}x</span>
                </div>
              ))}
            </div>
          </article>

          <article className="stats-card tipos">
            <h2>Tipos de Ejercicio</h2>
            <div className="stats-list">
              {Array.isArray(insights.ejerciciosPopulares.tipos) && insights.ejerciciosPopulares.tipos.slice(0, 5).map((tipo, idx) => (
                <div key={idx} className="stat-row">
                  <span className="stat-rank">{idx + 1}</span>
                  <span className="stat-name">{tipo.nombre}</span>
                  <span className="stat-count">{tipo.cantidad}x</span>
                </div>
              ))}
            </div>
          </article>

          <article className="stats-card completadas">
            <h2>Estado de Completadas</h2>
            <div className="completed-stats">
              <div className="stat-item">
                <span className="stat-label">Total</span>
                <span className="stat-value">{insights.ejerciciosPopulares.estadisticas?.total || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completadas</span>
                <span className="stat-value success">{insights.ejerciciosPopulares.estadisticas?.completados || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">% Completadas</span>
                <span className="stat-value">{insights.ejerciciosPopulares.estadisticas?.porcentaje || 0}%</span>
              </div>
            </div>
          </article>
        </>
      )}

      <article className="activity-card">
        <h2>Eventos recientes</h2>
        <div className="list">
          {dashboardData.eventos.slice(0, 8).map((item) => (
            <div className="list-row" key={item.eventoId}>
              <strong>{item.nombre}</strong>
              <span>{new Date(item.fechaHora).toLocaleString()}</span>
            </div>
          ))}
          {!dashboardData.eventos.length && <p>No hay eventos cargados.</p>}
        </div>
      </article>

      <article className="activity-card">
        <h2>Usuarios recientes</h2>
        <div className="list">
          {dashboardData.usuarios.slice(0, 8).map((item) => (
            <div className="list-row" key={item.userId}>
              <strong>{item.nombre} {item.apellido}</strong>
              <span>{item.correo}</span>
            </div>
          ))}
          {!dashboardData.usuarios.length && <p>No hay usuarios visibles para tu rol.</p>}
        </div>
      </article>
    </section>
  );
}

export default DashboardScreen;
