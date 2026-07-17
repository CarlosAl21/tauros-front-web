import { createRef } from 'react';
import { render } from '@testing-library/react';
import { MuscleType } from 'react-body-highlighter';
import MuscleSelector, { MUSCLE_GROUPS } from './MuscleSelector';

test('todos los ids de MUSCLE_GROUPS son valores reales soportados por react-body-highlighter', () => {
  const validIds = new Set(Object.values(MuscleType));
  MUSCLE_GROUPS.forEach((group) => {
    expect(validIds.has(group.id)).toBe(true);
  });
});

test('no hay ids duplicados en MUSCLE_GROUPS', () => {
  const ids = MUSCLE_GROUPS.map((group) => group.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('renderiza dos svg (frente y espalda) con la clase real de la libreria', () => {
  const { container } = render(
    <MuscleSelector selectedMuscles={[]} onToggleMuscle={() => {}} />,
  );

  const svgs = container.querySelectorAll('svg.rbh');
  expect(svgs).toHaveLength(2);
});

test('el ref expone los dos <svg> reales via getSvgElements (usado para exportar la imagen AM)', () => {
  const ref = createRef();
  render(<MuscleSelector ref={ref} selectedMuscles={[]} onToggleMuscle={() => {}} />);

  const { front, back } = ref.current.getSvgElements();
  expect(front?.tagName.toLowerCase()).toBe('svg');
  expect(back?.tagName.toLowerCase()).toBe('svg');
  expect(front).not.toBe(back);
});

test('click en un musculo del cuerpo llama a onToggleMuscle con el id real de la libreria', () => {
  const onToggleMuscle = jest.fn();
  const { container } = render(
    <MuscleSelector selectedMuscles={[]} onToggleMuscle={onToggleMuscle} />,
  );

  const frontSvg = container.querySelectorAll('svg.rbh')[0];
  const firstPolygon = frontSvg.querySelector('polygon');
  firstPolygon.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  expect(onToggleMuscle).toHaveBeenCalledTimes(1);
  const calledWith = onToggleMuscle.mock.calls[0][0];
  expect(Object.values(MuscleType)).toContain(calledWith);
});
