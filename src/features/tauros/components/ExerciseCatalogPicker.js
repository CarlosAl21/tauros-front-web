import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import exerciseCatalog from '../data/exerciseCatalog.json';

// Cuantos items se agregan al grid por tanda. Renderizar los 1324 <video
// autoPlay> del catalogo de una sola vez tira abajo el proceso de render del
// navegador (demasiados decoders de video en simultaneo) -- ver el scroll
// infinito mas abajo, que solo monta esta cantidad y suma de a tandas.
const PAGE_SIZE = 20;

// Modal de seleccion para el catalogo de ejercicios pre-cargado en
// Cloudinary (ver tauros-backend/scripts/migrate-exercise-catalog.js). No
// importa nada de ModuleScreen a proposito -- ModuleScreen es quien renderiza
// este componente, asi que importar de vuelta crearia un ciclo.
function ExerciseCatalogPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  const bodyParts = useMemo(() => {
    const labels = new Set(exerciseCatalog.map((item) => item.tipoLabel).filter(Boolean));
    return Array.from(labels).sort();
  }, []);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();

    return exerciseCatalog.filter((item) => {
      const matchesBodyPart = !bodyPartFilter || item.tipoLabel === bodyPartFilter;
      const matchesSearch = !term
        || item.name.toLowerCase().includes(term)
        || (item.nameEs || '').toLowerCase().includes(term);
      return matchesBodyPart && matchesSearch;
    });
  }, [bodyPartFilter, search]);

  // Cada vez que cambia el filtro/busqueda, la lista de resultados es otra:
  // volvemos a arrancar en la primera tanda.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, bodyPartFilter]);

  const visibleResults = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || visibleCount >= results.length) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, results.length));
      }
    }, { root, rootMargin: '200px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [results.length, visibleCount]);

  if (!exerciseCatalog.length) {
    return (
      <div className="catalog-picker-overlay" onClick={onClose}>
        <article className="catalog-picker" onClick={(event) => event.stopPropagation()}>
          <div className="catalog-picker__header">
            <h2>Catalogo de ejercicios</h2>
            <button type="button" onClick={onClose}>Cerrar</button>
          </div>
          <p>
            Todavia no se corrio la migracion del catalogo. Corre
            {' '}
            <code>node --env-file=.env scripts/migrate-exercise-catalog.js</code>
            {' '}
            en tauros-backend.
          </p>
        </article>
      </div>
    );
  }

  return (
    <div className="catalog-picker-overlay" onClick={onClose}>
      <article ref={scrollRef} className="catalog-picker" onClick={(event) => event.stopPropagation()}>
        <div className="catalog-picker__header">
          <h2>Catalogo de ejercicios</h2>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>

        <div className="catalog-picker__filters">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={bodyPartFilter} onChange={(event) => setBodyPartFilter(event.target.value)}>
            <option value="">Todas las categorias</option>
            {bodyParts.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>

        <p className="catalog-picker__count">
          {visibleResults.length} de {results.length} ejercicios
        </p>

        <div className="catalog-picker__grid">
          {visibleResults.map((item) => (
            <button
              key={item.id}
              type="button"
              className="catalog-picker__item"
              onClick={() => onSelect(item)}
            >
              <video
                src={item.videoUrl}
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                className="catalog-picker__video"
              />
              <span className="catalog-picker__name">{item.nameEs || item.name}</span>
              <span className="catalog-picker__meta">{item.tipoLabel} · {item.categoriaLabel}</span>
            </button>
          ))}
        </div>

        {visibleCount < results.length && (
          <div ref={sentinelRef} className="catalog-picker__sentinel" aria-hidden="true" />
        )}
      </article>
    </div>
  );
}

export default ExerciseCatalogPicker;
