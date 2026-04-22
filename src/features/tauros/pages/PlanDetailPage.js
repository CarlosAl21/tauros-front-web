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
      </div>
      {error && <p className="status error">{error}</p>}
      <PlanDetailScreen plan={plan} loading={loading} />
    </MainLayout>
  );
}

export default PlanDetailPage;