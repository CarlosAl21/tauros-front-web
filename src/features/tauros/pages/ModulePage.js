import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ModuleScreen from '../components/ModuleScreen';
import PlanBuilderScreen from '../components/PlanBuilderScreen';

function ModulePage({
  modules,
  activeModule,
  setActiveModuleKey,
  searchTerm,
  setSearchTerm,
  token,
  user,
  usuariosCatalog,
  catalogs,
  onLogout,
  filteredRecords,
  selectedId,
  setSelectedId,
  loading,
  selectedRecord,
  reloadModule,
  handleDelete,
  createForm,
  formMode,
  setCreateForm,
  handleCreate,
  openCreateForm,
  openEditForm,
  closeForm,
  getOptionsForField,
  error,
  success,
  moduleMessage,
  refreshCatalogs,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    setActiveModuleKey(activeModule.key);
  }, [activeModule.key, setActiveModuleKey]);

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
      {moduleMessage && <p className="status">Respuesta backend: {moduleMessage}</p>}
      {activeModule.key === 'ejercicio' && (
        <div className="module-links-strip">
          <button type="button" className="btn-action" onClick={() => navigate('/categorias')}>
            Gestionar categorias
          </button>
          <button type="button" className="btn-action" onClick={() => navigate('/tipos')}>
            Gestionar tipos
          </button>
        </div>
      )}
      {activeModule.key === 'plan-entrenamiento' ? (
        <PlanBuilderScreen
          token={token}
          plans={filteredRecords}
          rutinaDias={catalogs?.rutinaDias || []}
          rutinaEjercicios={catalogs?.rutinaEjercicios || []}
          ejercicios={catalogs?.ejercicios || []}
          usuarios={usuariosCatalog}
          onOpenPlan={(planId) => navigate(`/planes/${planId}`)}
          onRefresh={async () => {
            await reloadModule();
            await refreshCatalogs();
          }}
        />
      ) : (
        <ModuleScreen
          activeModule={activeModule}
          user={user}
          usuariosCatalog={usuariosCatalog}
          filteredRecords={filteredRecords}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          loading={loading}
          selectedRecord={selectedRecord}
          reloadModule={reloadModule}
          handleDelete={handleDelete}
          createForm={createForm}
          formMode={formMode}
          setCreateForm={setCreateForm}
          handleCreate={handleCreate}
          openCreateForm={openCreateForm}
          openEditForm={openEditForm}
          closeForm={closeForm}
          getOptionsForField={getOptionsForField}
        />
      )}
    </MainLayout>
  );
}

export default ModulePage;
