import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { uploadDirectlyToCloudinary } from '../services/cloudinary';

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (_err) {
    return '-';
  }
}

function PlanNutricionalScreen({
  usuarioId,
  token,
  onRefresh,
}) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedFileToDelete, setSelectedFileToDelete] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const orderedPlans = useMemo(
    () => (Array.isArray(planes) ? [...planes].sort((left, right) => {
      const leftTime = new Date(left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.createdAt || 0).getTime();
      return rightTime - leftTime;
    }) : []),
    [planes],
  );

  const selectedPlan = useMemo(() => {
    if (!orderedPlans.length) {
      return null;
    }

    return orderedPlans.find((plan) => String(plan.planNutricionalId) === String(selectedPlanId)) || orderedPlans[0];
  }, [orderedPlans, selectedPlanId]);

  const selectedPlanIndex = useMemo(() => {
    if (!selectedPlan) {
      return -1;
    }

    return orderedPlans.findIndex((plan) => String(plan.planNutricionalId) === String(selectedPlan.planNutricionalId));
  }, [orderedPlans, selectedPlan]);

    const selectedPlanNumber = selectedPlanIndex >= 0 ? orderedPlans.length - selectedPlanIndex : 1;
  const selectedPlanPreviewUrl = selectedPlan?.previewUrl || '';

  const loadPlanes = useCallback(async () => {
    if (!usuarioId || !token) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiRequest(`/plan-nutricional/usuario/${usuarioId}`, token);
      const normalizedPlans = Array.isArray(response) ? response : [];
      setPlanes(normalizedPlans);
      setSelectedPlanId((current) => {
        if (current && normalizedPlans.some((plan) => String(plan.planNutricionalId) === String(current))) {
          return current;
        }

        return normalizedPlans[0]?.planNutricionalId ? String(normalizedPlans[0].planNutricionalId) : '';
      });
    } catch (err) {
      setError(err.message || 'No se pudo cargar los planes nutricionales');
      setPlanes([]);
      setSelectedPlanId('');
    } finally {
      setLoading(false);
    }
  }, [token, usuarioId]);

  useEffect(() => {
    loadPlanes();
  }, [loadPlanes]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.includes('pdf')) {
      setError('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar 10 MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const cloudinaryUrl = await uploadDirectlyToCloudinary({
        token,
        file,
        folder: 'tauros/planes-nutricionales',
        resourceType: 'raw',
        fallbackName: file.name || `plan-${Date.now()}.pdf`,
      });

      await apiRequest('/plan-nutricional', token, {
        method: 'POST',
        body: JSON.stringify({
          linkPdf: cloudinaryUrl,
          usuarioId,
        }),
      });

      setSuccess('Plan nutricional subido correctamente');
      await loadPlanes();
      if (onRefresh) {
        onRefresh();
      }

      event.target.value = '';
    } catch (err) {
      setError(err.message || 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const openDeleteConfirm = (plan) => {
    setSelectedFileToDelete(plan);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setSelectedFileToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedFileToDelete?.planNutricionalId || !token) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await apiRequest(`/plan-nutricional/${selectedFileToDelete.planNutricionalId}`, token, {
        method: 'DELETE',
      });

      setSuccess('Plan nutricional eliminado');
      await loadPlanes();
      if (onRefresh) {
        onRefresh();
      }
      closeDeleteConfirm();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el plan');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="plan-nutricional-shell">
      <article className="plan-nutricional-card">
        <div className="card-head">
          <h2>Planes Nutricionales ({orderedPlans.length})</h2>
          <span>{loading ? 'Cargando...' : 'Conectado'}</span>
        </div>

        {error && <p className="status error">{error}</p>}
        {success && <p className="status success">{success}</p>}

        <div className="plan-nutricional-upload">
          <label className="upload-label">
            <span className="upload-label__text">
              {uploading ? 'Subiendo PDF...' : 'Subir plan nutricional (PDF)'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              disabled={uploading || loading}
              aria-label="Subir plan nutricional en PDF"
            />
          </label>
        </div>

        <div className="plan-nutricional-content">
          {loading ? (
            <div className="plan-nutricional-empty">Cargando planes...</div>
          ) : orderedPlans.length > 0 ? (
            <>
              <section className="plan-nutricional-preview">
                <div className="plan-nutricional-preview__head">
                  <div>
                    <span className="plan-nutricional-preview__eyebrow">Plan actual</span>
                    <h3>
                      Plan {selectedPlanNumber} · {formatDate(selectedPlan?.createdAt)}
                    </h3>
                  </div>

                  <div className="plan-nutricional-preview__actions">
                    {selectedPlan && (
                      <>
                        <a
                          href={selectedPlan.downloadUrl || selectedPlan.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-action"
                          download
                        >
                          Descargar
                        </a>
                        <button
                          type="button"
                          className="btn-action danger"
                          onClick={() => openDeleteConfirm(selectedPlan)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedPlan?.planNutricionalId ? (
                  <div>
                    <div className="plan-nutricional-preview__page-container">
                      {selectedPlanPreviewUrl ? (
                        <object
                          className="plan-nutricional-preview__frame"
                          data={selectedPlanPreviewUrl}
                          type="application/pdf"
                          aria-label={`Vista previa PDF - Plan ${selectedPlanNumber}`}
                        >
                          <div className="plan-nutricional-empty">
                            No se puede mostrar la vista previa del PDF.
                            <a href={selectedPlan.downloadUrl} target="_blank" rel="noopener noreferrer">
                              Descargar aquí
                            </a>
                          </div>
                        </object>
                      ) : (
                        <div className="plan-nutricional-empty">
                          No se puede cargar la vista previa del PDF.
                          <a href={selectedPlan.downloadUrl} target="_blank" rel="noopener noreferrer">
                            Descargar aquí
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="plan-nutricional-empty">
                    No hay plan seleccionado.
                  </div>
                )}
              </section>

              <section className="plan-nutricional-history">
                <div className="plan-nutricional-history__head">
                  <strong>Historial</strong>
                  <span>El plan más reciente se muestra primero.</span>
                </div>

                <div className="plan-nutricional-list">
                  {orderedPlans.map((plan, index) => {
                    const isSelected = String(plan.planNutricionalId) === String(selectedPlan?.planNutricionalId);

                    return (
                      <button
                        key={plan.planNutricionalId}
                        type="button"
                        className={`plan-nutricional-item plan-nutricional-item--button ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedPlanId(String(plan.planNutricionalId))}
                      >
                        <div className="plan-nutricional-item__info">
                          <div>
                              <strong>Plan {orderedPlans.length - index}</strong>
                            <span>{formatDate(plan.createdAt)}</span>
                          </div>
                        </div>

                        <span className="plan-nutricional-item__cta">
                          {isSelected ? 'Abierto' : 'Seleccionar'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <div className="plan-nutricional-empty">
              No hay planes nutricionales. Sube el primer plan.
            </div>
          )}
        </div>
      </article>

      {deleteConfirmOpen && (
        <div className="confirm-overlay" onClick={closeDeleteConfirm}>
          <article
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-card__body">
              <p>¿Deseas eliminar este plan nutricional?</p>
            </div>
            <div className="confirm-card__actions">
              <button
                type="button"
                className="btn-action"
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-action danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default PlanNutricionalScreen;
