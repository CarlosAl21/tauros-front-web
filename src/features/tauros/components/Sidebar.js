import { NavLink } from 'react-router-dom';
import Logo from './Logo';

function Sidebar({ modules, onLogout }) {
  const visibleModules = modules.filter(
    (module) => module.key !== 'categoria'
      && module.key !== 'tipo'
      && module.key !== 'rutina-dia'
      && module.key !== 'rutina-ejercicio',
  );

  return (
    <aside className="sidebar">
      <Logo size="medium" className="sidebar-logo" />
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
