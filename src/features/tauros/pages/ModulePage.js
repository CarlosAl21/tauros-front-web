import { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import ModuleScreen from '../components/ModuleScreen';

function ModulePage({
  modules,
  activeModule,
  setActiveModuleKey,
  searchTerm,
  setSearchTerm,
  user,
  usuariosCatalog,
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
}) {
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
    </MainLayout>
  );
}

export default ModulePage;
