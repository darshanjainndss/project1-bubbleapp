import { Bubble, Vector2 } from '../types/gameTypes';
import { GAME_WIDTH, BUBBLE_RADIUS } from './constants';

// Grid bubble type for proper bubble shooter mechanics
export type GridBubble = {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  isActive: boolean;
  row: number;
  col: number;
  isGridBubble: boolean;
};

const BUBBLE_SPACING = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = BUBBLE_SPACING * 0.866; // Hexagonal grid spacing

export const createInitialBubbles = (): GridBubble[] => {
  const rows = 8;
  const colors = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#f97316'];
  const bubbles: GridBubble[] = [];

  for (let row = 0; row < rows; row++) {
    const colsInRow = row % 2 === 0 ? 14 : 13; // Alternating row lengths for hexagonal grid
    const offsetX = row % 2 === 0 ? 0 : BUBBLE_RADIUS;

    for (let col = 0; col < colsInRow; col++) {
      const x = offsetX + col * BUBBLE_SPACING + BUBBLE_RADIUS;
      const y = row * ROW_HEIGHT + BUBBLE_RADIUS + 20; // Add top margin

      // Skip some bubbles to create gaps
      if (row > 4 && Math.random() > 0.7) continue;

      const id = `grid-${row}-${col}`;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      bubbles.push({
        id,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        radius: BUBBLE_RADIUS,
        color,
        isActive: true,
        row,
        col,
        isGridBubble: true,
      });
    }
  }

  return bubbles;
};

// Find the nearest grid position for a bubble
export const findNearestGridPosition = (x: number, y: number): { row: number; col: number; position: Vector2 } => {
  const row = Math.round((y - BUBBLE_RADIUS - 20) / ROW_HEIGHT);
  const offsetX = row % 2 === 0 ? 0 : BUBBLE_RADIUS;
  const col = Math.round((x - offsetX - BUBBLE_RADIUS) / BUBBLE_SPACING);
  
  const gridX = offsetX + col * BUBBLE_SPACING + BUBBLE_RADIUS;
  const gridY = row * ROW_HEIGHT + BUBBLE_RADIUS + 20;
  
  return {
    row: Math.max(0, row),
    col: Math.max(0, col),
    position: { x: gridX, y: gridY }
  };
};

// Check if two bubbles are colliding
export const checkBubbleCollision = (bubble1: Bubble | GridBubble, bubble2: Bubble | GridBubble): boolean => {
  const dx = bubble1.position.x - bubble2.position.x;
  const dy = bubble1.position.y - bubble2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (bubble1.radius + bubble2.radius) * 0.9; // Slightly smaller for better gameplay
};

// Find connected bubbles of the same color
export const findConnectedBubbles = (bubbles: GridBubble[], startBubble: GridBubble): GridBubble[] => {
  const connected: GridBubble[] = [];
  const visited = new Set<string>();
  const queue = [startBubble];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id) || !current.isGridBubble) continue;

    visited.add(current.id);
    connected.push(current);

    // Find neighbors
    const neighbors = getNeighbors(bubbles, current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.id) && neighbor.color === startBubble.color && neighbor.isGridBubble) {
        queue.push(neighbor);
      }
    }
  }

  return connected;
};

// Get neighboring bubbles in hexagonal grid
export const getNeighbors = (bubbles: GridBubble[], bubble: GridBubble): GridBubble[] => {
  const { row, col } = bubble;
  const neighbors: GridBubble[] = [];
  
  // Hexagonal grid neighbor offsets
  const evenRowOffsets = [
    [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
  ];
  const oddRowOffsets = [
    [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
  ];
  
  const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;
  
  for (const [rowOffset, colOffset] of offsets) {
    const neighborRow = row + rowOffset;
    const neighborCol = col + colOffset;
    
    const neighbor = bubbles.find(b => 
      b.isGridBubble && b.row === neighborRow && b.col === neighborCol && b.isActive
    );
    
    if (neighbor) {
      neighbors.push(neighbor);
    }
  }
  
  return neighbors;
};

// Find floating bubbles (not connected to top)
export const findFloatingBubbles = (bubbles: GridBubble[]): GridBubble[] => {
  const gridBubbles = bubbles.filter(b => b.isGridBubble && b.isActive);
  const topRowBubbles = gridBubbles.filter(b => b.row === 0);
  const connected = new Set<string>();
  
  // Find all bubbles connected to top row
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
  
  return gridBubbles.filter(b => !connected.has(b.id));
};
