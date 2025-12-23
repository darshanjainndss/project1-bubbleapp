import { Vector2 } from '../types/gameTypes';

export const add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const scale = (v: Vector2, s: number): Vector2 => ({
  x: v.x * s,
  y: v.y * s,
});

export const length = (v: Vector2): number =>
  Math.sqrt(v.x * v.x + v.y * v.y);

export const normalize = (v: Vector2): Vector2 => {
  const len = length(v) || 1;
  return { x: v.x / len, y: v.y / len };
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
