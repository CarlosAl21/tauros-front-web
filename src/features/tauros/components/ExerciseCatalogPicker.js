import { useMemo, useState } from 'react';
import exerciseCatalog from '../data/exerciseCatalog.json';

// Modal de seleccion para el catalogo de ejercicios pre-cargado en
// Cloudinary (ver tauros-backend/scripts/migrate-exercise-catalog.js). No
// importa nada de ModuleScreen a proposito -- ModuleScreen es quien renderiza
// este componente, asi que importar de vuelta crearia un ciclo.
function ExerciseCatalogPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('');

  const bodyParts = useMemo(() => {
    const labels = new Set(exerciseCatalog.map((item) => item.bodyPartLabel).filter(Boolean));
    return Array.from(labels).sort();
  }, []);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();

    return exerciseCatalog.filter((item) => {
      const matchesBodyPart = !bodyPartFilter || item.bodyPartLabel === bodyPartFilter;
      const matchesSearch = !term || item.name.toLowerCase().includes(term);
      return matchesBodyPart && matchesSearch;
    });
  }, [bodyPartFilter, search]);

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
      <article className="catalog-picker" onClick={(event) => event.stopPropagation()}>
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

        <p className="catalog-picker__count">{results.length} ejercicios</p>

        <div className="catalog-picker__grid">
          {results.map((item) => (
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
                className="catalog-picker__video"
              />
              <span className="catalog-picker__name">{item.name}</span>
              <span className="catalog-picker__meta">{item.bodyPartLabel} · {item.equipment}</span>
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}

export default ExerciseCatalogPicker;
