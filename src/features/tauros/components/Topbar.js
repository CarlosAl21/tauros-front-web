function Topbar({ moduleTitle, moduleSubtitle, activeModuleKey, searchTerm, setSearchTerm, user }) {
  return (
    <header className="topbar">
      <div>
        <h1>{moduleTitle}</h1>
        <p>{moduleSubtitle}</p>
      </div>

      <div className="topbar-right">
        {activeModuleKey !== 'dashboard' && (
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        )}

        <div className="user-pill">
          <strong>{user?.nombre || 'Usuario'}</strong>
          <span>{user?.rol || 'sin rol'}</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
