import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLoadHistory, fetchLoadSummary } from '../services/api';

// Loads the per-exercise load summary for a user and, on demand, the history
// of a single exercise. Histories are cached per exercise for the lifetime of
// the hook so collapsing/expanding a row does not refetch.
export function useLoadProgress(usuarioId) {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [histories, setHistories] = useState({});
  const requestIdRef = useRef(0);
  const historiesRef = useRef(histories);
  const usuarioIdRef = useRef(usuarioId);
  historiesRef.current = histories;
  usuarioIdRef.current = usuarioId;

  const loadSummary = useCallback(async () => {
    if (!usuarioId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError('');
      const response = await fetchLoadSummary(usuarioId);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setSummary(Array.isArray(response) ? response : []);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setSummary([]);
      setError(err?.message || 'No se pudo cargar el progreso de carga');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [usuarioId]);

  useEffect(() => {
    setHistories({});
    loadSummary();
  }, [loadSummary]);

  const loadHistory = useCallback(async (ejercicioId, { force = false } = {}) => {
    if (!usuarioId || !ejercicioId) {
      return;
    }

    const existing = historiesRef.current[ejercicioId];
    if (!force && existing && existing.status !== 'error') {
      return;
    }

    setHistories((current) => ({
      ...current,
      [ejercicioId]: { status: 'loading', data: [], error: '' },
    }));

    const ownerId = usuarioId;
    const isStale = () => usuarioIdRef.current !== ownerId;
    try {
      const response = await fetchLoadHistory(ownerId, ejercicioId);
      if (isStale()) {
        return;
      }
      setHistories((current) => ({
        ...current,
        [ejercicioId]: { status: 'ready', data: Array.isArray(response) ? response : [], error: '' },
      }));
    } catch (err) {
      if (isStale()) {
        return;
      }
      setHistories((current) => ({
        ...current,
        [ejercicioId]: {
          status: 'error',
          data: [],
          error: err?.message || 'No se pudo cargar el historial del ejercicio',
        },
      }));
    }
  }, [usuarioId]);

  return {
    summary,
    loading,
    error,
    reload: loadSummary,
    histories,
    loadHistory,
  };
}
