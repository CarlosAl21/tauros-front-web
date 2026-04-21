import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

function MainLayout({
  modules,
  activeModuleKey,
  moduleTitle,
  moduleSubtitle,
  searchTerm,
  setSearchTerm,
  user,
  onLogout,
  children,
}) {
  return (
    <div className="app-shell">
      <Sidebar modules={modules} onLogout={onLogout} />

      <main className="main-content">
        <Topbar
          moduleTitle={moduleTitle}
          moduleSubtitle={moduleSubtitle}
          activeModuleKey={activeModuleKey}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
        />

        {children}
      </main>
    </div>
  );
}

export default MainLayout;
