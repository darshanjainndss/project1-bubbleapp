/**
 * Type Definitions for Bubble Shooter Game
 * All game entities and state structures are defined here
 */

// ═══════════════════════════════════════════════════════════════
// VECTOR & POSITION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * 2D vector for positions, velocities, and directions
 */
export type Vector2 = {
  x: number;
  y: number;
};

/**
 * Position with velocity for physics calculations
 */
export type PhysicsBody = Vector2 & {
  velocity: Vector2;
};

// ═══════════════════════════════════════════════════════════════
// BUBBLE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Base bubble properties
 * Used for both shot bubbles and grid bubbles
 */
export type Bubble = {
  /** Unique identifier for the bubble */
  id: string;
  
  /** Current position in game world (0-400 width, 0-700 height) */
  position: Vector2;
  
  /** Current velocity (units per second) */
  velocity: Vector2;
  
  /** Collision radius in game units */
  radius: number;
  
  /** Color hex code (#RRGGBB) */
  color: string;
  
  /** Whether this bubble is still active/visible */
  isActive: boolean;
};

/**
 * Grid bubble extends Bubble with hexagonal grid information
 * These are stationary bubbles placed on the grid
 */
export type GridBubble = Bubble & {
  /** Row position in hexagonal grid (0-10) */
  row: number;
  
  /** Column position in hexagonal grid (0-13) */
  col: number;
  
  /** Discriminator: marks this as a grid bubble */
  isGridBubble: boolean;
};

/**
 * Type guard to check if a bubble is a grid bubble
 */
export const isGridBubble = (bubble: Bubble | GridBubble): bubble is GridBubble => {
  return 'isGridBubble' in bubble && bubble.isGridBubble;
};

// ═══════════════════════════════════════════════════════════════
// GAME STATE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Complete game state
 * This represents the entire state of the game at any moment
 */
export type GameState = {
  /** Array of all bubbles (both grid and shot) */
  bubbles: (Bubble | GridBubble)[];
  
  /** Position of the shooter/cannon */
  shooterPosition: Vector2;
  
  /** Array of points representing the aiming path */
  aimPath: Vector2[];
  
  /** Current player score */
  score: number;
  
  /** Remaining moves for this level */
  moves: number;
  
  /** Current combo multiplier (0 = no combo) */
  combo: number;
  
  /** Whether the game is over */
  gameOver: boolean;
  
  /** Current level (1-5+) */
  level: number;
  
  /** Color of the bubble currently being aimed */
  currentBubbleColor: string;
  
  /** Color of the next bubble to be shot */
  nextBubbleColor: string;
  
  /** Target position for aiming (null when not aiming) */
  aimTarget: Vector2 | null;
};

// ═══════════════════════════════════════════════════════════════
// GAME STATISTICS TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Match statistics when bubbles are cleared
 */
export type MatchEvent = {
  /** Number of bubbles matched */
  matchCount: number;
  
  /** Number of floating bubbles cleared */
  floatingCount: number;
  
  /** Points earned from this match */
  pointsEarned: number;
  
  /** Current combo level after this match */
  newCombo: number;
};

/**
 * Level configuration
 */
export type LevelConfig = {
  /** Number of bubbles that must be cleared to win */
  bubblesToClear: number;
  
  /** Maximum number of shots allowed */
  maxMoves: number;
};

/**
 * Game statistics for analytics or leaderboards
 */
export type GameStats = {
  finalScore: number;
  levelReached: number;
  movesUsed: number;
  highestCombo: number;
  totalMatches: number;
  playDuration: number;
};

// ═══════════════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Touch input event data
 */
export type TouchInput = {
  /** Screen coordinates of touch */
  locationX: number;
  locationY: number;
  
  /** Touch identifier for multi-touch */
  identifier?: number;
};

/**
 * Gesture responder callbacks
 */
export type GestureCallbacks = {
  onTouchStart?: (input: TouchInput) => void;
  onTouchMove?: (input: TouchInput) => void;
  onTouchEnd?: (input: TouchInput) => void;
  onTouchCancel?: () => void;
};

// ═══════════════════════════════════════════════════════════════
// PHYSICS TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Collision information between two objects
 */
export type Collision = {
  /** First object involved */
  objectA: Bubble | GridBubble;
  
  /** Second object involved */
  objectB: Bubble | GridBubble;
  
  /** Distance between centers */
  distance: number;
  
  /** Collision normal direction */
  normal: Vector2;
  
  /** Penetration depth */
  penetration: number;
};

/**
 * Ray cast result for trajectory calculations
 */
export type RayCastResult = {
  /** Did the ray hit something? */
  hit: boolean;
  
  /** Point of impact if hit */
  point?: Vector2;
  
  /** Object that was hit */
  object?: Bubble | GridBubble;
  
  /** Distance to impact */
  distance?: number;
};

// ═══════════════════════════════════════════════════════════════
// UI STATE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Game screen states
 */
export type GameScreenState = 'playing' | 'paused' | 'gameOver' | 'levelComplete';

/**
 * UI overlay states
 */
export type UIOverlayState = 'none' | 'menu' | 'gameOver' | 'pause' | 'settings';

/**
 * Toast/notification types
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
};

// ═══════════════════════════════════════════════════════════════
// ANIMATION TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Animation configuration
 */
export type AnimationConfig = {
  duration: number;
  delay?: number;
  easing?: (t: number) => number;
};

/**
 * Particle for visual effects
 */
export type Particle = {
  id: string;
  position: Vector2;
  velocity: Vector2;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: string;
  opacity: number;
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new Vector2
 */
export const vec2 = (x: number, y: number): Vector2 => ({ x, y });

/**
 * Zero vector
 */
export const ZERO_VEC2: Vector2 = { x: 0, y: 0 };

/**
 * Check if a value is a valid Vector2
 */
export const isVector2 = (v: any): v is Vector2 => {
  return (
    v &&
    typeof v === 'object' &&
    typeof v.x === 'number' &&
    typeof v.y === 'number'
  );
};

/**
 * Check if a value is a valid Bubble
 */
export const isBubble = (obj: any): obj is Bubble => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    isVector2(obj.position) &&
    isVector2(obj.velocity) &&
    typeof obj.radius === 'number' &&
    typeof obj.color === 'string' &&
    typeof obj.isActive === 'boolean'
  );
};

/**
 * Type-safe bubble array filtering
 */
export const filterGridBubbles = (bubbles: (Bubble | GridBubble)[]): GridBubble[] => {
  return bubbles.filter(isGridBubble) as GridBubble[];
};

export const filterShotBubbles = (bubbles: (Bubble | GridBubble)[]): Bubble[] => {
  return bubbles.filter((b) => !isGridBubble(b)) as Bubble[];
};

/**
 * Filter active bubbles
 */
export const filterActiveBubbles = (bubbles: (Bubble | GridBubble)[]): (Bubble | GridBubble)[] => {
  return bubbles.filter((b) => b.isActive);
};

export default {
  vec2,
  ZERO_VEC2,
  isVector2,
  isBubble,
  isGridBubble,
  filterGridBubbles,
  filterShotBubbles,
  filterActiveBubbles,
};