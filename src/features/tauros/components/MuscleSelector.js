import { forwardRef } from 'react';
import muscleBackground from '../utils/pictures/Musculos.jpg';

export const MUSCLE_GROUPS = [
  { id: 'trapecio', label: 'Trapecio' },
  { id: 'deltoides', label: 'Deltoides' },
  { id: 'pectoral', label: 'Pectoral' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'oblicuos', label: 'Oblicuos' },
  { id: 'dorsal', label: 'Dorsal' },
  { id: 'gluteos', label: 'Gluteos' },
  { id: 'cuadriceps', label: 'Cuadriceps' },
  { id: 'femorales', label: 'Femorales' },
  { id: 'gemelos', label: 'Gemelos' },
];

const MUSCLE_SEGMENTS = [
  // --- VISTA FRONTAL ---
  { id: 'deltoides', x: 72, y: 125, w: 32, h: 32 }, 
  { id: 'deltoides', x: 190, y: 125, w: 32, h: 32 }, 
  { id: 'pectoral', x: 112, y: 137, w: 74, h: 26 },
  { id: 'abdomen', x: 123, y: 187, w: 50, h: 81 },
  { id: 'biceps', x: 65, y: 170, w: 23, h: 37 },
  { id: 'biceps', x: 202, y: 168, w: 27, h: 39 },
  { id: 'oblicuos', x: 98, y: 204, w: 23, h: 64 },
  { id: 'oblicuos', x: 176, y: 204, w: 18, h: 68 },
  { id: 'cuadriceps', x: 95, y: 284, w: 36, h: 117 },
  { id: 'cuadriceps', x: 160, y: 286, w: 40, h: 107 },

  // --- VISTA TRASERA ---
  // TRAPECIO MEJORADO: Usamos puntos para darle forma de diamante real
  { id: 'trapecio', points: "395,145 442,120 490,145 442,195" }, 
  { id: 'deltoides', x: 358, y: 120, w: 48, h: 35 }, 
  { id: 'deltoides', x: 470, y: 120, w: 48, h: 35 }, 
  { id: 'triceps', x: 357, y: 164, w: 27, h: 48 },
  { id: 'triceps', x: 493, y: 163, w: 32, h: 44 },
  { id: 'dorsal', x: 395, y: 204, w: 41, h: 59 },
  { id: 'dorsal', x: 448, y: 206, w: 40, h: 64 },
  { id: 'gluteos', x: 390, y: 273, w: 105, h: 38 },
  { id: 'femorales', x: 393, y: 319, w: 36, h: 84 },
  { id: 'femorales', x: 450, y: 321, w: 42, h: 80 },
  { id: 'gemelos', x: 391, y: 426, w: 29, h: 76 },
  { id: 'gemelos', x: 462, y: 431, w: 31, h: 81 },
];

const MuscleSelector = forwardRef(({ selectedMuscles = [], onToggleMuscle }, ref) => {
  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: 'auto', background: '#1a1a1a', borderRadius: '12px', padding: '10px' }}>
      <svg viewBox="0 0 600 600" style={{ width: '100%', height: 'auto' }}>
        <image href={muscleBackground} width="600" height="600" />

        {MUSCLE_SEGMENTS.map((segment, index) => {
          const active = selectedMuscles.includes(segment.id);
          const commonProps = {
            key: `${segment.id}-${index}`,
            onClick: (e) => {
              e.stopPropagation();
              onToggleMuscle(segment.id);
            },
            style: {
              cursor: 'pointer',
              fill: active ? 'rgba(255, 0, 0, 0.5)' : 'transparent',
              stroke: active ? 'red' : 'transparent',
              strokeWidth: 1.5,
              transition: 'all 0.2s'
            }
          };

          // Si el segmento tiene 'points', renderiza polígono (Trapecio)
          if (segment.points) {
            return <polygon {...commonProps} points={segment.points} />;
          }

          // Si no, renderiza el rectángulo redondeado
          return (
            <rect {...commonProps} x={segment.x} y={segment.y} width={segment.w} height={segment.h} rx={8} />
          );
        })}
      </svg>
    </div>
  );
});

export default MuscleSelector;