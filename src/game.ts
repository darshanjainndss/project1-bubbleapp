import { Vector2, GridBubble } from './types';

// ═══════════════════════════════════════════════════════════════
// GAME CONSTANTS - Balanced for engaging gameplay
// ═══════════════════════════════════════════════════════════════

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;
export const BUBBLE_RADIUS = 14;
export const SHOOTER_Y_OFFSET = 250;
export const WALL_PADDING = 10;
export const BUBBLE_SPEED = 140;

// Color palette - Enhanced with more vibrant colors
export const BUBBLE_COLORS = [
  '#22c55e', // Vibrant Green
  '#3b82f6', // Vibrant Blue
  '#eab308', // Vivid Yellow
  '#ec4899', // Hot Pink
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#ef4444', // Red
];

// Grid Settings
const BUBBLE_SPACING = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = BUBBLE_SPACING * 0.866;

// Scoring System
export const SCORING = {
  BASE_MATCH_3: 10,
  BASE_MATCH_4: 25,
  BASE_MATCH_5_PLUS: 50,
  COMBO_MULTIPLIER: 0.1,
  BOUNCE_BONUS: 15,
  FLOATING_BONUS: 5,
};

// Level Configuration - 100 levels with different patterns
export const LEVEL_CONFIG: Record<number, { bubblesToClear: number; maxMoves: number; pattern: PatternType }> = {
  // Levels 1-10: Star Pattern
  1: { bubblesToClear: 20, maxMoves: 20, pattern: 'star' },
  2: { bubblesToClear: 25, maxMoves: 22, pattern: 'star' },
  3: { bubblesToClear: 30, maxMoves: 24, pattern: 'star' },
  4: { bubblesToClear: 35, maxMoves: 26, pattern: 'star' },
  5: { bubblesToClear: 40, maxMoves: 28, pattern: 'star' },
  6: { bubblesToClear: 45, maxMoves: 30, pattern: 'star' },
  7: { bubblesToClear: 50, maxMoves: 32, pattern: 'star' },
  8: { bubblesToClear: 55, maxMoves: 34, pattern: 'star' },
  9: { bubblesToClear: 60, maxMoves: 36, pattern: 'star' },
  10: { bubblesToClear: 65, maxMoves: 38, pattern: 'star' },
  
  // Levels 11-20: Rectangle Pattern
  11: { bubblesToClear: 30, maxMoves: 22, pattern: 'rectangle' },
  12: { bubblesToClear: 35, maxMoves: 24, pattern: 'rectangle' },
  13: { bubblesToClear: 40, maxMoves: 26, pattern: 'rectangle' },
  14: { bubblesToClear: 45, maxMoves: 28, pattern: 'rectangle' },
  15: { bubblesToClear: 50, maxMoves: 30, pattern: 'rectangle' },
  16: { bubblesToClear: 55, maxMoves: 32, pattern: 'rectangle' },
  17: { bubblesToClear: 60, maxMoves: 34, pattern: 'rectangle' },
  18: { bubblesToClear: 65, maxMoves: 36, pattern: 'rectangle' },
  19: { bubblesToClear: 70, maxMoves: 38, pattern: 'rectangle' },
  20: { bubblesToClear: 75, maxMoves: 40, pattern: 'rectangle' },
  
  // Levels 21-30: Diamond Pattern
  21: { bubblesToClear: 35, maxMoves: 24, pattern: 'diamond' },
  22: { bubblesToClear: 40, maxMoves: 26, pattern: 'diamond' },
  23: { bubblesToClear: 45, maxMoves: 28, pattern: 'diamond' },
  24: { bubblesToClear: 50, maxMoves: 30, pattern: 'diamond' },
  25: { bubblesToClear: 55, maxMoves: 32, pattern: 'diamond' },
  26: { bubblesToClear: 60, maxMoves: 34, pattern: 'diamond' },
  27: { bubblesToClear: 65, maxMoves: 36, pattern: 'diamond' },
  28: { bubblesToClear: 70, maxMoves: 38, pattern: 'diamond' },
  29: { bubblesToClear: 75, maxMoves: 40, pattern: 'diamond' },
  30: { bubblesToClear: 80, maxMoves: 42, pattern: 'diamond' },
  
  // Levels 31-40: Spiral Pattern
  31: { bubblesToClear: 40, maxMoves: 26, pattern: 'spiral' },
  32: { bubblesToClear: 45, maxMoves: 28, pattern: 'spiral' },
  33: { bubblesToClear: 50, maxMoves: 30, pattern: 'spiral' },
  34: { bubblesToClear: 55, maxMoves: 32, pattern: 'spiral' },
  35: { bubblesToClear: 60, maxMoves: 34, pattern: 'spiral' },
  36: { bubblesToClear: 65, maxMoves: 36, pattern: 'spiral' },
  37: { bubblesToClear: 70, maxMoves: 38, pattern: 'spiral' },
  38: { bubblesToClear: 75, maxMoves: 40, pattern: 'spiral' },
  39: { bubblesToClear: 80, maxMoves: 42, pattern: 'spiral' },
  40: { bubblesToClear: 85, maxMoves: 44, pattern: 'spiral' },
  
  // Levels 41-50: Pyramid Pattern
  41: { bubblesToClear: 45, maxMoves: 28, pattern: 'pyramid' },
  42: { bubblesToClear: 50, maxMoves: 30, pattern: 'pyramid' },
  43: { bubblesToClear: 55, maxMoves: 32, pattern: 'pyramid' },
  44: { bubblesToClear: 60, maxMoves: 34, pattern: 'pyramid' },
  45: { bubblesToClear: 65, maxMoves: 36, pattern: 'pyramid' },
  46: { bubblesToClear: 70, maxMoves: 38, pattern: 'pyramid' },
  47: { bubblesToClear: 75, maxMoves: 40, pattern: 'pyramid' },
  48: { bubblesToClear: 80, maxMoves: 42, pattern: 'pyramid' },
  49: { bubblesToClear: 85, maxMoves: 44, pattern: 'pyramid' },
  50: { bubblesToClear: 90, maxMoves: 46, pattern: 'pyramid' },
  
  // Levels 51-60: Cross Pattern
  51: { bubblesToClear: 50, maxMoves: 30, pattern: 'cross' },
  52: { bubblesToClear: 55, maxMoves: 32, pattern: 'cross' },
  53: { bubblesToClear: 60, maxMoves: 34, pattern: 'cross' },
  54: { bubblesToClear: 65, maxMoves: 36, pattern: 'cross' },
  55: { bubblesToClear: 70, maxMoves: 38, pattern: 'cross' },
  56: { bubblesToClear: 75, maxMoves: 40, pattern: 'cross' },
  57: { bubblesToClear: 80, maxMoves: 42, pattern: 'cross' },
  58: { bubblesToClear: 85, maxMoves: 44, pattern: 'cross' },
  59: { bubblesToClear: 90, maxMoves: 46, pattern: 'cross' },
  60: { bubblesToClear: 95, maxMoves: 48, pattern: 'cross' },
  
  // Levels 61-70: Hexagonal Pattern
  61: { bubblesToClear: 55, maxMoves: 32, pattern: 'hexagonal' },
  62: { bubblesToClear: 60, maxMoves: 34, pattern: 'hexagonal' },
  63: { bubblesToClear: 65, maxMoves: 36, pattern: 'hexagonal' },
  64: { bubblesToClear: 70, maxMoves: 38, pattern: 'hexagonal' },
  65: { bubblesToClear: 75, maxMoves: 40, pattern: 'hexagonal' },
  66: { bubblesToClear: 80, maxMoves: 42, pattern: 'hexagonal' },
  67: { bubblesToClear: 85, maxMoves: 44, pattern: 'hexagonal' },
  68: { bubblesToClear: 90, maxMoves: 46, pattern: 'hexagonal' },
  69: { bubblesToClear: 95, maxMoves: 48, pattern: 'hexagonal' },
  70: { bubblesToClear: 100, maxMoves: 50, pattern: 'hexagonal' },
  
  // Levels 71-80: Checkerboard Pattern
  71: { bubblesToClear: 60, maxMoves: 34, pattern: 'checkerboard' },
  72: { bubblesToClear: 65, maxMoves: 36, pattern: 'checkerboard' },
  73: { bubblesToClear: 70, maxMoves: 38, pattern: 'checkerboard' },
  74: { bubblesToClear: 75, maxMoves: 40, pattern: 'checkerboard' },
  75: { bubblesToClear: 80, maxMoves: 42, pattern: 'checkerboard' },
  76: { bubblesToClear: 85, maxMoves: 44, pattern: 'checkerboard' },
  77: { bubblesToClear: 90, maxMoves: 46, pattern: 'checkerboard' },
  78: { bubblesToClear: 95, maxMoves: 48, pattern: 'checkerboard' },
  79: { bubblesToClear: 100, maxMoves: 50, pattern: 'checkerboard' },
  80: { bubblesToClear: 105, maxMoves: 52, pattern: 'checkerboard' },
  
  // Levels 81-90: Wave Pattern
  81: { bubblesToClear: 65, maxMoves: 36, pattern: 'wave' },
  82: { bubblesToClear: 70, maxMoves: 38, pattern: 'wave' },
  83: { bubblesToClear: 75, maxMoves: 40, pattern: 'wave' },
  84: { bubblesToClear: 80, maxMoves: 42, pattern: 'wave' },
  85: { bubblesToClear: 85, maxMoves: 44, pattern: 'wave' },
  86: { bubblesToClear: 90, maxMoves: 46, pattern: 'wave' },
  87: { bubblesToClear: 95, maxMoves: 48, pattern: 'wave' },
  88: { bubblesToClear: 100, maxMoves: 50, pattern: 'wave' },
  89: { bubblesToClear: 105, maxMoves: 52, pattern: 'wave' },
  90: { bubblesToClear: 110, maxMoves: 54, pattern: 'wave' },
  
  // Levels 91-100: Random Mixed Pattern
  91: { bubblesToClear: 70, maxMoves: 38, pattern: 'random' },
  92: { bubblesToClear: 75, maxMoves: 40, pattern: 'random' },
  93: { bubblesToClear: 80, maxMoves: 42, pattern: 'random' },
  94: { bubblesToClear: 85, maxMoves: 44, pattern: 'random' },
  95: { bubblesToClear: 90, maxMoves: 46, pattern: 'random' },
  96: { bubblesToClear: 95, maxMoves: 48, pattern: 'random' },
  97: { bubblesToClear: 100, maxMoves: 50, pattern: 'random' },
  98: { bubblesToClear: 105, maxMoves: 52, pattern: 'random' },
  99: { bubblesToClear: 110, maxMoves: 54, pattern: 'random' },
  100: { bubblesToClear: 120, maxMoves: 56, pattern: 'random' },
};

// Pattern type definition
export type PatternType = 'star' | 'rectangle' | 'hexagonal' | 'diamond' | 'spiral' | 'pyramid' | 'cross' | 'hexagon' | 'checkerboard' | 'wave' | 'random';

// ═══════════════════════════════════════════════════════════════
// PATTERN GENERATION SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Generate bubbles in a proper star pattern
 */
const generateStarPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 180 };
  const points: { x: number; y: number }[] = [];
  const arms = 5;
  const innerRadius = 50;
  const outerRadius = 100;

  // Create star points with proper geometry
  for (let arm = 0; arm < arms; arm++) {
    const outerAngle = (arm * Math.PI * 2) / arms - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / arms;
    
    // Outer star point
    points.push({
      x: center.x + outerRadius * Math.cos(outerAngle),
      y: center.y + outerRadius * Math.sin(outerAngle),
    });
    
    // Inner star point
    points.push({
      x: center.x + innerRadius * Math.cos(innerAngle),
      y: center.y + innerRadius * Math.sin(innerAngle),
    });
  }

  // Add center point
  points.push(center);

  // Fill in the star arms with more bubbles
  for (let arm = 0; arm < arms; arm++) {
    const outerAngle = (arm * Math.PI * 2) / arms - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / arms;
    
    // Add intermediate points along each arm
    for (let i = 1; i <= 2; i++) {
      const radius = innerRadius + (outerRadius - innerRadius) * (i / 3);
      points.push({
        x: center.x + radius * Math.cos(outerAngle),
        y: center.y + radius * Math.sin(outerAngle),
      });
    }
  }
  
  return points;
};

/**
 * Generate bubbles in a proper rectangle pattern
 */
const generateRectanglePattern = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const rows = 6;
  const cols = 8;
  const startX = GAME_WIDTH / 2 - (cols / 2) * 35;
  const startY = 120;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: startX + col * 35,
        y: startY + row * 35,
      });
    }
  }

  return points;
};

/**
 * Generate bubbles in a proper hexagonal pattern
 */
const generateHexagonPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 180 };
  const points: { x: number; y: number }[] = [];
  const rings = 4;

  // Center point
  points.push(center);

  for (let ring = 1; ring <= rings; ring++) {
    const radius = ring * 35;
    const bubblesInRing = 6 * ring;

    for (let i = 0; i < bubblesInRing; i++) {
      const angle = (i * Math.PI * 2) / bubblesInRing;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }
  }

  return points;
};

/**
 * Generate bubbles in a diamond pattern
 */
const generateDiamondPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 200 };
  const points: { x: number; y: number }[] = [];
  const size = 8;

  for (let row = 0; row < size; row++) {
    const offset = Math.abs(row - size / 2);
    const bubblesInRow = size - Math.ceil(offset);
    const y = center.y - (size / 2 - row) * 35;

    for (let col = 0; col < bubblesInRow; col++) {
      const x = center.x - ((bubblesInRow - 1) / 2 - col) * 35;
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Generate bubbles in a spiral pattern
 */
const generateSpiralPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 200 };
  const points: { x: number; y: number }[] = [];
  const turns = 3;
  const totalPoints = 40;

  for (let i = 0; i < totalPoints; i++) {
    const angle = (i / totalPoints) * turns * Math.PI * 2;
    const radius = (i / totalPoints) * 120;

    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  return points;
};

/**
 * Generate bubbles in a pyramid pattern
 */
const generatePyramidPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 100 };
  const points: { x: number; y: number }[] = [];
  const rows = 8;

  for (let row = 0; row < rows; row++) {
    const bubblesInRow = row + 1;
    const y = center.y + row * 35;

    for (let col = 0; col < bubblesInRow; col++) {
      const x = center.x - ((bubblesInRow - 1) / 2 - col) * 35;
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Generate bubbles in a cross pattern
 */
const generateCrossPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 200 };
  const points: { x: number; y: number }[] = [];
  const length = 6;

  // Vertical line
  for (let i = 0; i < length; i++) {
    points.push({
      x: center.x,
      y: center.y - (length / 2 - i) * 35,
    });
  }

  // Horizontal line (skip center)
  for (let i = 0; i < length; i++) {
    if (i !== length / 2) {
      points.push({
        x: center.x - (length / 2 - i) * 35,
        y: center.y,
      });
    }
  }

  return points;
};

/**
 * Generate bubbles in a proper hexagon pattern (different from hexagonal)
 */
const generateHexPattern = (): { x: number; y: number }[] => {
  const center = { x: GAME_WIDTH / 2, y: 180 };
  const points: { x: number; y: number }[] = [];
  const sideLength = 70;

  // Create hexagon vertices
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    points.push({
      x: center.x + sideLength * Math.cos(angle),
      y: center.y + sideLength * Math.sin(angle),
    });
  }

  // Fill hexagon sides
  for (let i = 0; i < 6; i++) {
    const angle1 = (i * Math.PI) / 3;
    const angle2 = ((i + 1) * Math.PI) / 3;
    
    const x1 = center.x + sideLength * Math.cos(angle1);
    const y1 = center.y + sideLength * Math.sin(angle1);
    const x2 = center.x + sideLength * Math.cos(angle2);
    const y2 = center.y + sideLength * Math.sin(angle2);

    // Add points along each side
    for (let j = 1; j < 3; j++) {
      const t = j / 3;
      points.push({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t,
      });
    }
  }

  // Add center
  points.push(center);

  return points;
};

/**
 * Generate bubbles in a checkerboard pattern
 */
const generateCheckerboardPattern = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const cols = 7;
  const rows = 6;
  const startX = GAME_WIDTH / 2 - (cols / 2) * 35;
  const startY = 100;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 === 0) {
        points.push({
          x: startX + col * 35,
          y: startY + row * 35,
        });
      }
    }
  }

  return points;
};

/**
 * Generate bubbles in a wave pattern
 */
const generateWavePattern = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const waves = 3;
  const waveHeight = 50;
  const startX = 50;
  const startY = 150;
  const pointsPerWave = 20;

  for (let w = 0; w < waves; w++) {
    for (let i = 0; i < pointsPerWave; i++) {
      const x = startX + i * (GAME_WIDTH - 100) / pointsPerWave;
      const y = startY + w * 70 + Math.sin((i / pointsPerWave) * Math.PI) * waveHeight;
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Generate bubbles in a random pattern
 */
const generateRandomPattern = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const count = 50;

  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * (GAME_WIDTH - 100) + 50,
      y: Math.random() * 250 + 80,
    });
  }

  return points;
};

/**
 * Main pattern generator function
 */
export const generateBubblePattern = (pattern: PatternType): { x: number; y: number }[] => {
  switch (pattern) {
    case 'star':
      return generateStarPattern();
    case 'rectangle':
      return generateRectanglePattern();
    case 'hexagonal':
      return generateHexagonPattern();
    case 'diamond':
      return generateDiamondPattern();
    case 'spiral':
      return generateSpiralPattern();
    case 'pyramid':
      return generatePyramidPattern();
    case 'cross':
      return generateCrossPattern();
    case 'hexagon':
      return generateHexPattern();
    case 'checkerboard':
      return generateCheckerboardPattern();
    case 'wave':
      return generateWavePattern();
    case 'random':
      return generateRandomPattern();
    default:
      return generateStarPattern();
  }
};

// ═══════════════════════════════════════════════════════════════
// INITIAL BUBBLE GENERATION WITH PATTERN
// ═══════════════════════════════════════════════════════════════

export const createInitialBubbles = (level: number = 1): GridBubble[] => {
  const config = LEVEL_CONFIG[Math.min(level, 100)] || LEVEL_CONFIG[1];
  const pattern = config.pattern;
  const patternPoints = generateBubblePattern(pattern);

  const bubbles: GridBubble[] = [];
  let id = 0;

  for (const point of patternPoints) {
    const gridPos = findNearestGridPosition(point.x, point.y);
    const color = BUBBLE_COLORS[Math.floor(Math.random() * 6)];

    bubbles.push({
      id: `grid-${level}-${id}`,
      position: gridPos.position,
      velocity: { x: 0, y: 0 },
      radius: BUBBLE_RADIUS,
      color,
      isActive: true,
      row: gridPos.row,
      col: gridPos.col,
      isGridBubble: true,
    });

    id++;
  }

  return bubbles;
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtract = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const magnitude = (v: Vector2): number =>
  Math.sqrt(v.x * v.x + v.y * v.y);

export const normalize = (v: Vector2): Vector2 => {
  const mag = magnitude(v);
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

// ═══════════════════════════════════════════════════════════════
// GRID POSITION CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export const findNearestGridPosition = (
  x: number,
  y: number
): { row: number; col: number; position: Vector2 } => {
  const row = Math.round((y - BUBBLE_RADIUS - 20) / ROW_HEIGHT);
  const offsetX = row % 2 === 0 ? 0 : BUBBLE_RADIUS;
  const col = Math.round((x - offsetX - BUBBLE_RADIUS) / BUBBLE_SPACING);

  const gridX = offsetX + col * BUBBLE_SPACING + BUBBLE_RADIUS;
  const gridY = row * ROW_HEIGHT + BUBBLE_RADIUS + 20;

  return {
    row: Math.max(0, Math.min(row, 10)),
    col: Math.max(0, Math.min(col, 14)),
    position: { x: gridX, y: gridY },
  };
};

export const isGridPositionValid = (row: number, col: number): boolean => {
  const colsInRow = row % 2 === 0 ? 14 : 13;
  return row >= 0 && row < 11 && col >= 0 && col < colsInRow;
};

// ═══════════════════════════════════════════════════════════════
// COLLISION DETECTION
// ═══════════════════════════════════════════════════════════════

export const checkBubbleCollision = (
  bubble1: any,
  bubble2: any
): boolean => {
  const dx = bubble1.position.x - bubble2.position.x;
  const dy = bubble1.position.y - bubble2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = (bubble1.radius + bubble2.radius) * 0.95;
  return distance < minDistance;
};

export const getDistance = (p1: Vector2, p2: Vector2): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// ═══════════════════════════════════════════════════════════════
// HEXAGONAL GRID LOGIC
// ═══════════════════════════════════════════════════════════════

export const getNeighbors = (
  bubbles: GridBubble[],
  bubble: GridBubble
): GridBubble[] => {
  const { row, col } = bubble;
  const neighbors: GridBubble[] = [];

  const evenRowOffsets = [
    [-1, -1],
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
  ];
  const oddRowOffsets = [
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;

  for (const [rowOffset, colOffset] of offsets) {
    const neighborRow = row + rowOffset;
    const neighborCol = col + colOffset;

    if (isGridPositionValid(neighborRow, neighborCol)) {
      const neighbor = bubbles.find(
        (b) =>
          b.isGridBubble &&
          b.row === neighborRow &&
          b.col === neighborCol &&
          b.isActive
      );

      if (neighbor) neighbors.push(neighbor);
    }
  }

  return neighbors;
};

// ═══════════════════════════════════════════════════════════════
// BUBBLE MATCHING & CLEARING
// ═══════════════════════════════════════════════════════════════

export const findConnectedBubbles = (
  bubbles: GridBubble[],
  startBubble: GridBubble
): GridBubble[] => {
  const connected: GridBubble[] = [];
  const visited = new Set<string>();
  const queue = [startBubble];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id) || !current.isGridBubble) continue;

    visited.add(current.id);
    connected.push(current);

    const neighbors = getNeighbors(bubbles, current);
    for (const neighbor of neighbors) {
      if (
        !visited.has(neighbor.id) &&
        neighbor.color === startBubble.color &&
        neighbor.isGridBubble
      ) {
        queue.push(neighbor);
      }
    }
  }

  return connected;
};

export const findFloatingBubbles = (bubbles: GridBubble[]): GridBubble[] => {
  const gridBubbles = bubbles.filter((b) => b.isGridBubble && b.isActive);
  const topRowBubbles = gridBubbles.filter((b) => b.row === 0);
  const connected = new Set<string>();

  const queue = [...topRowBubbles];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (connected.has(current.id)) continue;

    connected.add(current.id);
    const neighbors = getNeighbors(gridBubbles, current);
    for (const neighbor of neighbors) {
      if (!connected.has(neighbor.id)) {
        queue.push(neighbor);
      }
    }
  }

  return gridBubbles.filter((b) => !connected.has(b.id));
};

export const calculateMatchScore = (
  matchCount: number,
  combo: number
): number => {
  let baseScore = 0;

  if (matchCount === 3) {
    baseScore = SCORING.BASE_MATCH_3;
  } else if (matchCount === 4) {
    baseScore = SCORING.BASE_MATCH_4;
  } else if (matchCount >= 5) {
    baseScore = SCORING.BASE_MATCH_5_PLUS;
  }

  const comboMultiplier = 1 + combo * SCORING.COMBO_MULTIPLIER;
  return Math.floor(baseScore * comboMultiplier);
};

// ═══════════════════════════════════════════════════════════════
// AIM AND TRAJECTORY
// ═══════════════════════════════════════════════════════════════

export const calculateAimPath = (
  origin: Vector2,
  target: Vector2,
  gridBubbles: GridBubble[] = [],
  maxBounces: number = 2,
  step: number = 6
): Vector2[] => {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return [origin];

  const dir = { x: dx / distance, y: dy / distance };
  let currentDir = dir;
  let currentPos = { ...origin };
  const points: Vector2[] = [{ ...origin }];

  const maxSteps = 200;
  let bounces = 0;

  for (let i = 0; i < maxSteps && bounces <= maxBounces; i++) {
    const nextPos = {
      x: currentPos.x + currentDir.x * step,
      y: currentPos.y + currentDir.y * step,
    };

    let hitBubble = false;
    for (const bubble of gridBubbles) {
      if (!bubble.isActive) continue;
      const dx = nextPos.x - bubble.position.x;
      const dy = nextPos.y - bubble.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BUBBLE_RADIUS * 1.8) {
        points.push({ ...nextPos });
        hitBubble = true;
        break;
      }
    }

    if (hitBubble) break;

    let bounced = false;
    if (nextPos.x <= WALL_PADDING + BUBBLE_RADIUS) {
      nextPos.x = WALL_PADDING + BUBBLE_RADIUS;
      currentDir = { x: Math.abs(currentDir.x), y: currentDir.y };
      bounces++;
      bounced = true;
    } else if (nextPos.x >= GAME_WIDTH - WALL_PADDING - BUBBLE_RADIUS) {
      nextPos.x = GAME_WIDTH - WALL_PADDING - BUBBLE_RADIUS;
      currentDir = { x: -Math.abs(currentDir.x), y: currentDir.y };
      bounces++;
      bounced = true;
    }

    if (bounced) points.push({ ...nextPos });
    else if (
      nextPos.y <= WALL_PADDING + BUBBLE_RADIUS ||
      nextPos.y > GAME_HEIGHT
    ) {
      points.push({ ...nextPos });
      break;
    } else {
      points.push({ ...nextPos });
    }

    currentPos = nextPos;
  }

  return points;
};

export const launchVelocityFromAim = (
  origin: Vector2,
  target: Vector2,
  speed: number
): Vector2 => {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return { x: 0, y: -speed };

  const dir = { x: dx / distance, y: dy / distance };
  return { x: dir.x * speed, y: dir.y * speed };
};

// ═══════════════════════════════════════════════════════════════
// PHYSICS & POSITION UPDATES
// ═══════════════════════════════════════════════════════════════

export const updateBubblePositions = (
  bubbles: (any | GridBubble)[],
  dt: number
): (any | GridBubble)[] => {
  const gridBubbles = bubbles.filter(
    (b) => 'isGridBubble' in b && b.isGridBubble
  ) as GridBubble[];
  const shotBubbles = bubbles.filter(
    (b) => !('isGridBubble' in b) || !b.isGridBubble
  ) as any[];

  let updatedBubbles: (any | GridBubble)[] = [...gridBubbles];

  for (const bubble of shotBubbles) {
    if (!bubble.isActive) {
      updatedBubbles.push(bubble);
      continue;
    }

    let position = add(bubble.position, {
      x: bubble.velocity.x * dt,
      y: bubble.velocity.y * dt,
    });

    let velocity = { ...bubble.velocity };
    let shouldSnapToGrid = false;

    if (position.x - bubble.radius <= WALL_PADDING) {
      position.x = WALL_PADDING + bubble.radius;
      velocity.x = Math.abs(velocity.x) * 0.95;
    }
    if (position.x + bubble.radius >= GAME_WIDTH - WALL_PADDING) {
      position.x = GAME_WIDTH - WALL_PADDING - bubble.radius;
      velocity.x = -Math.abs(velocity.x) * 0.95;
    }

    if (position.y - bubble.radius <= WALL_PADDING) {
      shouldSnapToGrid = true;
    }

    for (const gridBubble of gridBubbles) {
      if (
        gridBubble.isActive &&
        checkBubbleCollision({ ...bubble, position }, gridBubble)
      ) {
        shouldSnapToGrid = true;
        break;
      }
    }

    if (shouldSnapToGrid) {
      const gridPos = findNearestGridPosition(position.x, position.y);

      const isOccupied = gridBubbles.some(
        (gb) =>
          gb.isActive &&
          gb.row === gridPos.row &&
          gb.col === gridPos.col
      );

      if (!isOccupied && isGridPositionValid(gridPos.row, gridPos.col)) {
        const newGridBubble: GridBubble = {
          id: `grid-${gridPos.row}-${gridPos.col}-${Date.now()}`,
          position: gridPos.position,
          velocity: { x: 0, y: 0 },
          radius: bubble.radius,
          color: bubble.color,
          isActive: true,
          row: gridPos.row,
          col: gridPos.col,
          isGridBubble: true,
        };

        updatedBubbles.push(newGridBubble);

        const connectedBubbles = findConnectedBubbles(
          [...gridBubbles, newGridBubble],
          newGridBubble
        );

        if (connectedBubbles.length >= 3) {
          const idsToRemove = new Set(connectedBubbles.map((b) => b.id));
          updatedBubbles = updatedBubbles.filter(
            (b) => !idsToRemove.has(b.id)
          );

          const remainingGridBubbles = updatedBubbles.filter(
            (b) => 'isGridBubble' in b && b.isGridBubble
          ) as GridBubble[];
          const floatingBubbles = findFloatingBubbles(remainingGridBubbles);
          const floatingIds = new Set(floatingBubbles.map((b) => b.id));
          updatedBubbles = updatedBubbles.filter(
            (b) => !floatingIds.has(b.id)
          );
        }
      }

      continue;
    }

    if (position.y > GAME_HEIGHT + 50) {
      updatedBubbles.push({ ...bubble, isActive: false });
      continue;
    }

    updatedBubbles.push({ ...bubble, position, velocity });
  }

  return updatedBubbles;
};

// ═══════════════════════════════════════════════════════════════
// GAME STATE HELPERS
// ═══════════════════════════════════════════════════════════════

export const countRemainingBubbles = (bubbles: (any | GridBubble)[]): number => {
  return bubbles.filter(
    (b) => ('isGridBubble' in b && b.isGridBubble) || b.isActive
  ).length;
};

export const getRandomColor = (): string => {
  return BUBBLE_COLORS[Math.floor(Math.random() * 6)];
};

export const getPatternName = (pattern: PatternType): string => {
  const names: Record<PatternType, string> = {
    star: 'Star ⭐',
    rectangle: 'Rectangle ▭',
    hexagonal: 'Hexagonal ⬢',
    diamond: 'Diamond 💎',
    spiral: 'Spiral 🌀',
    pyramid: 'Pyramid 🔺',
    cross: 'Cross ✚',
    hexagon: 'Hexagon ⬡',
    checkerboard: 'Checkerboard ⬜',
    wave: 'Wave 〰️',
    random: 'Random 🎲',
  };
  return names[pattern] || 'Unknown';
};