import { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import DashboardScreen from '../components/DashboardScreen';

function DashboardPage({
  modules,
  activeModule,
  setActiveModuleKey,
  searchTerm,
  setSearchTerm,
  user,
  onLogout,
  metrics,
  dashboardData,
  dashboardInsights,
  error,
  success,
}) {
  useEffect(() => {
    setActiveModuleKey('dashboard');
  }, [setActiveModuleKey]);

  return (
    <MainLayout
      modules={modules}
      activeModuleKey={activeModule.key}
      moduleTitle={activeModule.title}
      moduleSubtitle={activeModule.subtitle}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      user={user}
      onLogout={onLogout}
    >
      {error && <p className="status error">{error}</p>}
      {success && <p className="status success">{success}</p>}
      <DashboardScreen metrics={metrics} dashboardData={dashboardData} insights={dashboardInsights} />
    </MainLayout>
  );
}

export default DashboardPage;
