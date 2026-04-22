import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AuthPage from './features/tauros/pages/AuthPage';
import DashboardPage from './features/tauros/pages/DashboardPage';
import ModulePage from './features/tauros/pages/ModulePage';
import PlanDetailPage from './features/tauros/pages/PlanDetailPage';
import NotFoundPage from './features/tauros/pages/NotFoundPage';
import { MODULES, MODULE_MAP } from './features/tauros/config/modules';
import { useTaurosApp } from './features/tauros/hooks/useTaurosApp';

function RequireAuth({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const app = useTaurosApp();
  const { token } = app;

  const modulePageProps = (moduleKey) => ({
    modules: MODULES,
    activeModule: MODULE_MAP[moduleKey],
    setActiveModuleKey: app.setActiveModuleKey,
    searchTerm: app.searchTerm,
    setSearchTerm: app.setSearchTerm,
    token: app.token,
    user: app.user,
    usuariosCatalog: app.catalogs.usuarios,
    catalogs: app.catalogs,
    onLogout: app.handleLogout,
    filteredRecords: app.filteredRecords,
    selectedId: app.selectedId,
    setSelectedId: app.setSelectedId,
    loading: app.loading,
    selectedRecord: app.selectedRecord,
    reloadModule: app.reloadModule,
    handleDelete: app.handleDelete,
    createForm: app.createForm,
    formMode: app.formMode,
    setCreateForm: app.setCreateForm,
    handleCreate: app.handleCreate,
    openCreateForm: app.openCreateForm,
    openEditForm: app.openEditForm,
    closeForm: app.closeForm,
    getOptionsForField: app.getOptionsForField,
    error: app.error,
    success: app.success,
    moduleMessage: app.moduleMessage,
    refreshCatalogs: app.refreshCatalogs,
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : (
            <AuthPage
              authForm={app.authForm}
              setAuthForm={app.setAuthForm}
              handleAuth={app.handleAuth}
              error={app.error}
              success={app.success}
            />
          )}
        />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth token={token}>
              <DashboardPage
                modules={MODULES}
                activeModule={MODULE_MAP.dashboard}
                setActiveModuleKey={app.setActiveModuleKey}
                searchTerm={app.searchTerm}
                setSearchTerm={app.setSearchTerm}
                user={app.user}
                usuariosCatalog={app.catalogs.usuarios}
                onLogout={app.handleLogout}
                metrics={app.metrics}
                dashboardData={app.dashboardData}
                error={app.error}
                success={app.success}
              />
            </RequireAuth>
          )}
        />
        <Route
          path="/usuarios"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('usuario')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/composicion-corporal"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('composicion-corporal')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/ejercicios"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('ejercicio')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/maquinas"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('maquina')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/categorias"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('categoria')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/tipos"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('tipo')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/planes"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('plan-entrenamiento')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/planes/:planId"
          element={(
            <RequireAuth token={token}>
              <PlanDetailPage
                modules={MODULES}
                activeModule={MODULE_MAP['plan-entrenamiento']}
                setActiveModuleKey={app.setActiveModuleKey}
                searchTerm={app.searchTerm}
                setSearchTerm={app.setSearchTerm}
                token={app.token}
                user={app.user}
                onLogout={app.handleLogout}
              />
            </RequireAuth>
          )}
        />
        <Route
          path="/rutina-dia"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('rutina-dia')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/rutina-ejercicio"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('rutina-ejercicio')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/eventos"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('evento')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/horarios"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('horario')} />
            </RequireAuth>
          )}
        />
        <Route
          path="/sugerencias"
          element={(
            <RequireAuth token={token}>
              <ModulePage {...modulePageProps('sugerencia')} />
            </RequireAuth>
          )}
        />
        <Route path="*" element={<NotFoundPage token={token} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
