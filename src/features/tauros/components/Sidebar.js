import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';

// Must match the CSS breakpoint where the sidebar becomes an off-canvas drawer.
const DRAWER_MEDIA_QUERY = '(max-width: 1100px)';
const DRAWER_ID = 'app-sidebar';

function Sidebar({ modules, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  const visibleModules = modules.filter(
    (module) => module.key !== 'categoria'
      && module.key !== 'tipo'
      && module.key !== 'rutina-dia'
      && module.key !== 'rutina-ejercicio',
  );

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  // Escape closes, body scroll is locked, and focus moves into the drawer.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    drawerRef.current?.querySelector('a, button')?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Leaving the drawer breakpoint (rotation/resize) must not leave the page locked.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DRAWER_MEDIA_QUERY);
    const handleChange = (event) => {
      if (!event.matches) {
        setIsOpen(false);
      }
    };

    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <>
      <header className="mobile-topbar">
        <Logo size="small" />
        <button
          ref={toggleRef}
          type="button"
          className={`mobile-topbar__toggle ${isOpen ? 'is-open' : ''}`}
          aria-label={isOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isOpen}
          aria-controls={DRAWER_ID}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="mobile-topbar__bar" aria-hidden="true" />
          <span className="mobile-topbar__bar" aria-hidden="true" />
          <span className="mobile-topbar__bar" aria-hidden="true" />
        </button>
      </header>

      <div
        className={`sidebar-overlay ${isOpen ? 'is-open' : ''}`}
        aria-hidden="true"
        onClick={closeDrawer}
      />

      <aside id={DRAWER_ID} ref={drawerRef} className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <Logo size="medium" className="sidebar-logo" />
        <nav>
          {visibleModules.map((module) => (
            <NavLink
              key={module.key}
              to={module.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeDrawer}
            >
              {module.title}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn-logout" onClick={handleLogout}>Cerrar sesion</button>
      </aside>
    </>
  );
}

export default Sidebar;
