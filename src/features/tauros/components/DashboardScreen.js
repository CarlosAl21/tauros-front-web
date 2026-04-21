function DashboardScreen({ metrics, dashboardData }) {
  return (
    <section className="dashboard-grid">
      {metrics.map((item) => (
        <article className="metric-card" key={item.label}>
          <h2>{item.label}</h2>
          <strong>{item.value}</strong>
        </article>
      ))}

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
