export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function easeOutCubic(value: number): number {
  const progress = clamp(value);
  return 1 - (1 - progress) ** 3;
}

export function easeInOutCubic(value: number): number {
  const progress = clamp(value);
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

export function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp(progress);
}
