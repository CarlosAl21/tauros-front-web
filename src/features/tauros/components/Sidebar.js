import { NavLink } from 'react-router-dom';

function Sidebar({ modules, onLogout }) {
  const visibleModules = modules.filter((module) => module.key !== 'categoria' && module.key !== 'tipo');

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Tauros</div>
      <nav>
        {visibleModules.map((module) => (
          <NavLink
            key={module.key}
            to={module.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {module.title}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="btn-logout" onClick={onLogout}>Cerrar sesion</button>
    </aside>
  );
}

export default Sidebar;
