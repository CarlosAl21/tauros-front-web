import { useState } from 'react';
import { useLoadProgress } from '../hooks/useLoadProgress';
import LoadProgressView from './LoadProgressView';

// Container: owns data fetching (via hook) and view state (unit, expanded row).
function LoadProgressPanel({ usuarioId }) {
  const { summary, loading, error, reload, histories, loadHistory } = useLoadProgress(usuarioId);
  const [unit, setUnit] = useState('kg');
  const [expandedId, setExpandedId] = useState('');

  const handleToggleExercise = (ejercicioId) => {
    if (expandedId === ejercicioId) {
      setExpandedId('');
      return;
    }

    setExpandedId(ejercicioId);
    loadHistory(ejercicioId);
  };

  return (
    <LoadProgressView
      summary={summary}
      loading={loading}
      error={error}
      unit={unit}
      onUnitChange={setUnit}
      expandedId={expandedId}
      onToggleExercise={handleToggleExercise}
      histories={histories}
      onRetrySummary={reload}
      onRetryHistory={(ejercicioId) => loadHistory(ejercicioId, { force: true })}
    />
  );
}

export default LoadProgressPanel;
