import { useState, useRef, useEffect } from 'react';

function MachineSelector({ options = [], value, onChange }) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Filtrar opciones según el texto de búsqueda
  const filteredOptions = searchText.trim() === ''
    ? options
    : options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
      );

  // Obtener la etiqueta de la opción seleccionada
  const selectedLabel = options.find((opt) => String(opt.value) === String(value))?.label || 'Sin maquina';

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setSearchText('');
    setIsOpen(false);
  };

  return (
    <div className="machine-selector-container" ref={containerRef}>
      <div className="machine-selector-input-wrapper">
        <input
          type="text"
          className="machine-selector-input"
          placeholder="Buscar maquina..."
          value={isOpen ? searchText : selectedLabel}
          onChange={(e) => {
            setSearchText(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <span className="machine-selector-icon">▼</span>
      </div>

      {isOpen && (
        <div className="machine-selector-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`machine-selector-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
                onClick={() => handleSelectOption(opt.value)}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className="machine-selector-no-results">
              No se encontraron máquinas
            </div>
          )}
          {options.length > 0 && value && (
            <button
              type="button"
              className="machine-selector-option machine-selector-clear"
              onClick={() => handleSelectOption('')}
            >
              Limpiar selección
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MachineSelector;
