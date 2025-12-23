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

export type GameState = {
  bubbles: Bubble[];
  shooterPosition: Vector2;
  aimPath: Vector2[];
  score: number;
  moves: number;
};

export type BubbleColor = string;

export type Position = {
  x: number;
  y: number;
};

// Additional Bubble type for GameLogic compatibility
export type GridBubble = {
  id: string;
  color: BubbleColor;
  x: number;
  y: number;
  row: number;
  col: number;
};