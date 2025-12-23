import { Vector2, Bubble, GridBubble } from './types';

// Export GridBubble for external use
export type { GridBubble } from './types';

// Game Constants
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;
export const BUBBLE_RADIUS = 14;
export const SHOOTER_Y_OFFSET = 80;
export const WALL_PADDING = 10;
export const BUBBLE_SPEED = 120;
export const BUBBLE_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#f97316'];

// Grid Settings
const BUBBLE_SPACING = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = BUBBLE_SPACING * 0.866; // Hexagonal grid spacing

// Math utilities
export const add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

// Create initial bubble grid
export const createInitialBubbles = (): GridBubble[] => {
  const rows = 8;
  const bubbles: GridBubble[] = [];

  for (let row = 0; row < rows; row++) {
    const colsInRow = row % 2 === 0 ? 14 : 13;
    const offsetX = row % 2 === 0 ? 0 : BUBBLE_RADIUS;

    for (let col = 0; col < colsInRow; col++) {
      const x = offsetX + col * BUBBLE_SPACING + BUBBLE_RADIUS;
      const y = row * ROW_HEIGHT + BUBBLE_RADIUS + 20;

      if (row > 4 && Math.random() > 0.7) continue;

      const id = `grid-${row}-${col}`;
      const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      
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

// Find nearest grid position for bubble placement
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

// Check bubble collision
export const checkBubbleCollision = (bubble1: Bubble | GridBubble, bubble2: Bubble | GridBubble): boolean => {
  const dx = bubble1.position.x - bubble2.position.x;
  const dy = bubble1.position.y - bubble2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (bubble1.radius + bubble2.radius) * 0.95;
};

// Get hexagonal grid neighbors
export const getNeighbors = (bubbles: GridBubble[], bubble: GridBubble): GridBubble[] => {
  const { row, col } = bubble;
  const neighbors: GridBubble[] = [];
  
  const evenRowOffsets = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  const oddRowOffsets = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;
  
  for (const [rowOffset, colOffset] of offsets) {
    const neighborRow = row + rowOffset;
    const neighborCol = col + colOffset;
    
    const neighbor = bubbles.find(b => 
      b.isGridBubble && b.row === neighborRow && b.col === neighborCol && b.isActive
    );
    
    if (neighbor) neighbors.push(neighbor);
  }
  
  return neighbors;
};

// Find connected bubbles of same color
export const findConnectedBubbles = (bubbles: GridBubble[], startBubble: GridBubble): GridBubble[] => {
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
      if (!visited.has(neighbor.id) && neighbor.color === startBubble.color && neighbor.isGridBubble) {
        queue.push(neighbor);
      }
    }
  }

  return connected;
};

// Find floating bubbles (not connected to top)
export const findFloatingBubbles = (bubbles: GridBubble[]): GridBubble[] => {
  const gridBubbles = bubbles.filter(b => b.isGridBubble && b.isActive);
  const topRowBubbles = gridBubbles.filter(b => b.row === 0);
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
  
  return gridBubbles.filter(b => !connected.has(b.id));
};

// Calculate aim path with wall bounces
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

  const maxSteps = 150;
  let bounces = 0;

  for (let i = 0; i < maxSteps && bounces <= maxBounces; i++) {
    const nextPos = {
      x: currentPos.x + currentDir.x * step,
      y: currentPos.y + currentDir.y * step,
    };

    // Check collision with grid bubbles
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

    // Check wall collisions
    if (nextPos.x <= WALL_PADDING + BUBBLE_RADIUS) {
      nextPos.x = WALL_PADDING + BUBBLE_RADIUS;
      currentDir = { x: Math.abs(currentDir.x), y: currentDir.y };
      bounces++;
      points.push({ ...nextPos });
    } else if (nextPos.x >= GAME_WIDTH - WALL_PADDING - BUBBLE_RADIUS) {
      nextPos.x = GAME_WIDTH - WALL_PADDING - BUBBLE_RADIUS;
      currentDir = { x: -Math.abs(currentDir.x), y: currentDir.y };
      bounces++;
      points.push({ ...nextPos });
    } else if (nextPos.y <= WALL_PADDING + BUBBLE_RADIUS) {
      nextPos.y = WALL_PADDING + BUBBLE_RADIUS;
      points.push({ ...nextPos });
      break;
    } else if (nextPos.y > GAME_HEIGHT) {
      points.push({ ...nextPos });
      break;
    } else {
      points.push({ ...nextPos });
    }

    currentPos = nextPos;
  }

  return points;
};

// Calculate launch velocity
export const launchVelocityFromAim = (origin: Vector2, target: Vector2, speed: number): Vector2 => {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: 0, y: -speed };
  
  const dir = { x: dx / distance, y: dy / distance };
  return { x: dir.x * speed, y: dir.y * speed };
};

// Update bubble positions and handle collisions
export const updateBubblePositions = (
  bubbles: (Bubble | GridBubble)[],
  dt: number
): (Bubble | GridBubble)[] => {
  const gridBubbles = bubbles.filter(b => 'isGridBubble' in b && b.isGridBubble) as GridBubble[];
  const shotBubbles = bubbles.filter(b => !('isGridBubble' in b) || !b.isGridBubble) as Bubble[];
  
  let updatedBubbles: (Bubble | GridBubble)[] = [...gridBubbles];

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

    // Wall collisions
    if (position.x - bubble.radius <= WALL_PADDING) {
      position.x = WALL_PADDING + bubble.radius;
      velocity.x = Math.abs(velocity.x);
    }
    if (position.x + bubble.radius >= GAME_WIDTH - WALL_PADDING) {
      position.x = GAME_WIDTH - WALL_PADDING - bubble.radius;
      velocity.x = -Math.abs(velocity.x);
    }

    // Top wall or bubble collision
    if (position.y - bubble.radius <= WALL_PADDING) {
      shouldSnapToGrid = true;
    }

    for (const gridBubble of gridBubbles) {
      if (gridBubble.isActive && checkBubbleCollision({ ...bubble, position }, gridBubble)) {
        shouldSnapToGrid = true;
        break;
      }
    }

    // Snap to grid
    if (shouldSnapToGrid) {
      const gridPos = findNearestGridPosition(position.x, position.y);
      
      const isOccupied = gridBubbles.some(gb => 
        gb.isActive && gb.row === gridPos.row && gb.col === gridPos.col
      );
      
      if (!isOccupied) {
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
        
        // Check for matches
        const connectedBubbles = findConnectedBubbles([...gridBubbles, newGridBubble], newGridBubble);
        
        if (connectedBubbles.length >= 3) {
          // Remove connected bubbles of same color
          const idsToRemove = new Set(connectedBubbles.map(b => b.id));
          updatedBubbles = updatedBubbles.filter(b => !idsToRemove.has(b.id));
          
          // Remove floating bubbles
          const remainingGridBubbles = updatedBubbles.filter(b => 'isGridBubble' in b && b.isGridBubble) as GridBubble[];
          const floatingBubbles = findFloatingBubbles(remainingGridBubbles);
          const floatingIds = new Set(floatingBubbles.map(b => b.id));
          updatedBubbles = updatedBubbles.filter(b => !floatingIds.has(b.id));
        }
      }
      
      continue;
    }

    // Remove if below screen
    if (position.y > GAME_HEIGHT + 50) {
      updatedBubbles.push({ ...bubble, isActive: false });
      continue;
    }

    // Update position
    updatedBubbles.push({ ...bubble, position, velocity });
  }

  return updatedBubbles;
};