import type { GaborChoice } from '../types';

export type GaborParams = {
  size: number;
  angleDeg: number;
  sigma: number;
  frequency: number;
  phase: number;
  contrast: number;
};

export const GABOR_CHOICES: readonly GaborChoice[] = [
  { angleDeg: 90, symbol: '─', label: '横向き' },
  { angleDeg: 45, symbol: '╱', label: '右上がり' },
  { angleDeg: 0, symbol: '│', label: '縦向き' },
  { angleDeg: 135, symbol: '╲', label: '右下がり' },
];

export function createAngleSequence(random: () => number = Math.random): GaborChoice[] {
  const choices = [...GABOR_CHOICES];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const sample = Math.min(0.999999999, Math.max(0, random()));
    const swapIndex = Math.floor(sample * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }
  return choices.slice(0, 3);
}

export function getCorrectChoiceIndex(angleDeg: number): number {
  return GABOR_CHOICES.findIndex((choice) => choice.angleDeg === angleDeg);
}

export function renderGabor(ctx: CanvasRenderingContext2D, params: GaborParams): void {
  const { size, angleDeg, sigma, frequency, phase, contrast } = params;
  const image = ctx.createImageData(size, size);
  const radians = (angleDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const center = (size - 1) / 2;
  const background = 128;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const rotatedX = dx * cosine + dy * sine;
      const envelope = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      const carrier = Math.cos(2 * Math.PI * frequency * rotatedX + phase);
      const value = Math.round(background + background * contrast * envelope * carrier);
      const offset = (y * size + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = Math.round(255 * envelope);
    }
  }

  ctx.putImageData(image, 0, 0);
}
