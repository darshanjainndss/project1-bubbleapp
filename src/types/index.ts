// src/types/index.ts

export type BubbleColor = 
  | 'red' 
  | 'blue' 
  | 'green' 
  | 'yellow' 
  | 'purple' 
  | 'orange' 
  | 'pink' 
  | 'cyan';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Bubble {
  id: string;
  color: BubbleColor;
  position: Position;
  velocity?: Velocity;
  row: number;
  col: number;
  isPopping?: boolean;
  isFloating?: boolean;
  isShooting?: boolean;
}

export interface ShotBubble extends Bubble {
  velocity: Velocity;
  isShooting: true;
}

export type PowerUpType = 'fireball' | 'bomb' | 'rainbow';

export interface Level {
  id: number;
  pattern: 'honeycomb' | 'pyramid' | 'star' | 'diamond' | 'zigzag' | 'circle';
  colors: BubbleColor[];
  targetScore: number;
  moves: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
}

export interface GameState {
  bubbles: Bubble[];
  shotBubble: ShotBubble | null;
  currentColor: BubbleColor;
  nextColor: BubbleColor;
  score: number;
  moves: number;
  level: Level;
  gameOver: boolean;
  paused: boolean;
}