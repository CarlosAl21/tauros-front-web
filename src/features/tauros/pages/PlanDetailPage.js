import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import MainLayout from '../layouts/MainLayout';
import PlanDetailScreen from '../components/PlanDetailScreen';

function PlanDetailPage({
  modules,
  activeModule,
  setActiveModuleKey,
  searchTerm,
  setSearchTerm,
  token,
  user,
  onLogout,
}) {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveModuleKey('plan-entrenamiento');
  }, [setActiveModuleKey]);

  useEffect(() => {
    let active = true;

    const loadPlan = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiRequest(`/plan-entrenamiento/${planId}`, token);
        if (active) {
          setPlan(response);
        }
      } catch (err) {
        if (active) {
          setPlan(null);
          setError(err.message || 'No se pudo cargar el plan');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (planId) {
      loadPlan();
    } else {
      setLoading(false);
      setError('Falta el identificador del plan');
    }

    return () => {
      active = false;
    };
  }, [planId, token]);

  const handlePlanUpdate = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/plan-entrenamiento/${planId}`, token);
      setPlan(response);
    } catch (err) {
      setError(err.message || 'No se pudo recargar el plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planId) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await apiRequest(`/plan-entrenamiento/${planId}`, token, {
        method: 'DELETE',
      });
      navigate('/planes');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el plan');
    } finally {
      setDeleting(false);
      setDeletePromptOpen(false);
    }
  };

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
      <div className="module-links-strip">
        <button type="button" className="btn-action" onClick={() => navigate('/planes')}>
          Regresar
        </button>
        <button
          type="button"
          className="btn-action"
          onClick={() => navigate('/planes', { state: { editPlanId: planId } })}
        >
          Editar
        </button>
        <button
          type="button"
          className="btn-action danger"
          onClick={() => setDeletePromptOpen(true)}
          disabled={deleting}
        >
          {deleting ? 'Borrando...' : 'Borrar'}
        </button>
      </div>
      {deletePromptOpen && (
        <div className="confirm-overlay" role="presentation" onClick={() => !deleting && setDeletePromptOpen(false)}>
          <article
            className="confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-plan-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="confirm-delete-plan-title">Confirmar eliminacion</h3>
            <p>
              Este plan de entrenamiento se eliminara de forma permanente. Esta accion no se puede deshacer.
            </p>
            <div className="confirm-card__actions">
              <button
                type="button"
                className="btn-action"
                onClick={() => setDeletePromptOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button type="button" className="btn-action danger" onClick={handleDeletePlan} disabled={deleting}>
                {deleting ? 'Borrando...' : 'Si, borrar plan'}
              </button>
            </div>
          </article>
        </div>
      )}
      {error && <p className="status error">{error}</p>}
      <PlanDetailScreen plan={plan} loading={loading} token={token} onUpdate={handlePlanUpdate} />
    </MainLayout>
  );
}

export default PlanDetailPage;