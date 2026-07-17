import { forwardRef, useImperativeHandle, useRef } from 'react';
import Model from 'react-body-highlighter';

// IDs = strings reales que usa react-body-highlighter (ver su MuscleType).
// Ojo: en la librería la constante ABDUCTOR (singular) vale 'adductor' y
// ABDUCTORS (plural) vale 'abductors' — están cruzadas, por eso acá se usan
// los strings literales en vez de confiar en nombres de constantes.
export const MUSCLE_GROUPS = [
  { id: 'trapezius', label: 'Trapecio' },
  { id: 'upper-back', label: 'Espalda alta' },
  { id: 'lower-back', label: 'Espalda baja' },
  { id: 'chest', label: 'Pectoral' },
  { id: 'front-deltoids', label: 'Deltoides (frontal)' },
  { id: 'back-deltoids', label: 'Deltoides (posterior)' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'forearm', label: 'Antebrazo' },
  { id: 'abs', label: 'Abdomen' },
  { id: 'obliques', label: 'Oblicuos' },
  { id: 'gluteal', label: 'Gluteos' },
  { id: 'adductor', label: 'Aductores' },
  { id: 'abductors', label: 'Abductores' },
  { id: 'quadriceps', label: 'Cuadriceps' },
  { id: 'hamstring', label: 'Femorales' },
  { id: 'calves', label: 'Gemelos' },
  { id: 'left-soleus', label: 'Soleo izquierdo' },
  { id: 'right-soleus', label: 'Soleo derecho' },
  { id: 'knees', label: 'Rodillas' },
  { id: 'neck', label: 'Cuello' },
  { id: 'head', label: 'Cabeza' },
];

const BODY_COLOR = '#3a3a3a';
const HIGHLIGHT_COLOR = '#ff3b3b';

const MuscleSelector = forwardRef(({ selectedMuscles = [], onToggleMuscle }, ref) => {
  const frontContainerRef = useRef(null);
  const backContainerRef = useRef(null);

  // El componente padre (ModuleScreen) necesita los <svg> reales para
  // rasterizarlos y subir la imagen de activacion muscular a Cloudinary,
  // igual que hacia antes con el <svg> unico de la version anterior.
  useImperativeHandle(ref, () => ({
    getSvgElements: () => ({
      front: frontContainerRef.current?.querySelector('svg.rbh') ?? null,
      back: backContainerRef.current?.querySelector('svg.rbh') ?? null,
    }),
  }), []);

  const data = [{ name: 'Activacion muscular', muscles: selectedMuscles }];
  const handleClick = ({ muscle }) => onToggleMuscle(muscle);

  return (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', background: '#1a1a1a', borderRadius: '12px', padding: '16px' }}>
      <div ref={frontContainerRef}>
        <Model
          type="anterior"
          data={data}
          onClick={handleClick}
          bodyColor={BODY_COLOR}
          highlightedColors={[HIGHLIGHT_COLOR]}
          style={{ width: '220px' }}
        />
      </div>
      <div ref={backContainerRef}>
        <Model
          type="posterior"
          data={data}
          onClick={handleClick}
          bodyColor={BODY_COLOR}
          highlightedColors={[HIGHLIGHT_COLOR]}
          style={{ width: '220px' }}
        />
      </div>
    </div>
  );
});

export default MuscleSelector;
