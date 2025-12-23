// Basic types for the bubble shooter game
export type Vector2 = {
  x: number;
  y: number;
};

export type Bubble = {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  isActive: boolean;
};

// Grid bubble extends regular bubble with grid position
export type GridBubble = Bubble & {
  row: number;
  col: number;
  isGridBubble: boolean;
};

export type GameState = {
  bubbles: (Bubble | GridBubble)[];
  shooterPosition: Vector2;
  aimPath: Vector2[];
  score: number;
  moves: number;
  currentBubbleColor: string;
  nextBubbleColor: string;
  aimTarget: Vector2 | null;
};