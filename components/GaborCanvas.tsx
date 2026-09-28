import { useEffect, useRef } from 'react';
import { renderGabor } from '../lib/gabor';

type GaborCanvasProps = {
  angleDeg: number;
  contrast: number;
};

export function GaborCanvas({ angleDeg, contrast }: GaborCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;

    renderGabor(context, {
      size: 220,
      angleDeg,
      sigma: 42,
      frequency: 0.045,
      phase: 0,
      contrast,
    });
  }, [angleDeg, contrast]);

  return <canvas ref={canvasRef} className="gabor-canvas" width={220} height={220} role="img" aria-label="Gabor pattern" />;
}
