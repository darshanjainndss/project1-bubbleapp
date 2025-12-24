// src/utils/gameLogic.ts

import { Bubble, BubbleColor, Position, PowerUpType, Velocity, ShotBubble } from '../types/index';
import { BUBBLE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT, gridToPosition, positionToGrid, findNearestEmptyPosition, getNeighborPositions } from './patterns';

// Physics constants
export const GRAVITY = 0.3;
export const BOUNCE_DAMPING = 0.8;
export const SHOT_SPEED = 12;
export const COLLISION_DISTANCE = BUBBLE_SIZE * 0.9;

/**
 * Check collision between shot bubble and grid bubbles
 */
export const checkCollision = (shotBubble: ShotBubble, gridBubbles: Bubble[]): Bubble | null => {
  for (const bubble of gridBubbles) {
    const dx = shotBubble.position.x - bubble.position.x;
    const dy = shotBubble.position.y - bubble.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < COLLISION_DISTANCE) {
      return bubble;
    }
  }
  return null;
};

/**
 * Update shot bubble physics
 */
export const updateShotBubble = (shotBubble: ShotBubble): ShotBubble => {
  const newPosition = {
    x: shotBubble.position.x + shotBubble.velocity.x,
    y: shotBubble.position.y + shotBubble.velocity.y,
  };

  let newVelocity = { ...shotBubble.velocity };

  // Wall bouncing
  if (newPosition.x <= BUBBLE_SIZE / 2 || newPosition.x >= SCREEN_WIDTH - BUBBLE_SIZE / 2) {
    newVelocity.x *= -BOUNCE_DAMPING;
    newPosition.x = Math.max(BUBBLE_SIZE / 2, Math.min(SCREEN_WIDTH - BUBBLE_SIZE / 2, newPosition.x));
  }

  // Top boundary
  if (newPosition.y <= BUBBLE_SIZE / 2) {
    newPosition.y = BUBBLE_SIZE / 2;
    newVelocity.y = 0;
  }

  return {
    ...shotBubble,
    position: newPosition,
    velocity: newVelocity,
  };
};

/**
 * Create trajectory points for aiming
 */
export const calculateTrajectory = (
  startPos: Position,
  angle: number,
  gridBubbles: Bubble[],
  maxSteps: number = 50
): Position[] => {
  const points: Position[] = [];
  const velocity = {
    x: Math.cos(angle) * SHOT_SPEED,
    y: Math.sin(angle) * SHOT_SPEED,
  };

  let pos = { ...startPos };
  let vel = { ...velocity };

  for (let i = 0; i < maxSteps; i++) {
    pos.x += vel.x;
    pos.y += vel.y;

    // Wall collision
    if (pos.x <= BUBBLE_SIZE / 2 || pos.x >= SCREEN_WIDTH - BUBBLE_SIZE / 2) {
      vel.x *= -1;
      pos.x = Math.max(BUBBLE_SIZE / 2, Math.min(SCREEN_WIDTH - BUBBLE_SIZE / 2, pos.x));
    }

    // Top boundary
    if (pos.y <= BUBBLE_SIZE / 2) {
      break;
    }

    // Check collision with grid bubbles
    let collision = false;
    for (const bubble of gridBubbles) {
      const dx = pos.x - bubble.position.x;
      const dy = pos.y - bubble.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < COLLISION_DISTANCE) {
        collision = true;
        break;
      }
    }

    if (collision) break;

    if (i % 3 === 0) { // Add every 3rd point for smoother trajectory
      points.push({ ...pos });
    }
  }

  return points;
};

/**
 * Attach shot bubble to grid
 */
export const attachBubbleToGrid = (
  shotBubble: ShotBubble,
  gridBubbles: Bubble[]
): Bubble => {
  const { row, col } = findNearestEmptyPosition(shotBubble.position, gridBubbles);
  const position = gridToPosition(row, col);

  return {
    id: shotBubble.id,
    color: shotBubble.color,
    position,
    row,
    col,
  };
};

/**
 * Find matching bubbles using flood fill
 */
export const findMatchingBubbles = (
  targetBubble: Bubble,
  allBubbles: Bubble[]
): Bubble[] => {
  const matches: Bubble[] = [];
  const visited = new Set<string>();
  const queue = [targetBubble];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.row},${current.col}`;

    if (visited.has(key) || current.color !== targetBubble.color) {
      continue;
    }

    visited.add(key);
    matches.push(current);

    // Check neighbors
    const neighborPositions = getNeighborPositions(current.row, current.col);
    for (const pos of neighborPositions) {
      const neighbor = allBubbles.find(b => b.row === pos.row && b.col === pos.col);
      if (neighbor && !visited.has(`${pos.row},${pos.col}`) && neighbor.color === targetBubble.color) {
        queue.push(neighbor);
      }
    }
  }

  return matches;
};

/**
 * Find floating bubbles (not connected to top)
 */
export const findFloatingBubbles = (bubbles: Bubble[]): Bubble[] => {
  const connected = new Set<string>();
  const queue: Bubble[] = [];

  // Start with top row bubbles
  for (const bubble of bubbles) {
    if (bubble.row === 0) {
      queue.push(bubble);
      connected.add(`${bubble.row},${bubble.col}`);
    }
  }

  // BFS to find all connected bubbles
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighborPositions = getNeighborPositions(current.row, current.col);

    for (const pos of neighborPositions) {
      const neighbor = bubbles.find(b => b.row === pos.row && b.col === pos.col);
      const key = `${pos.row},${pos.col}`;
      
      if (neighbor && !connected.has(key)) {
        connected.add(key);
        queue.push(neighbor);
      }
    }
  }

  // Return bubbles that are not connected
  return bubbles.filter(bubble => !connected.has(`${bubble.row},${bubble.col}`));
};

/**
 * Apply gravity to floating bubbles
 */
export const applyGravityToBubbles = (bubbles: Bubble[]): Bubble[] => {
  return bubbles.map(bubble => {
    if (bubble.isFloating) {
      return {
        ...bubble,
        velocity: bubble.velocity ? 
          { x: bubble.velocity.x, y: bubble.velocity.y + GRAVITY } :
          { x: 0, y: GRAVITY },
        position: {
          x: bubble.position.x + (bubble.velocity?.x || 0),
          y: bubble.position.y + (bubble.velocity?.y || 0),
        }
      };
    }
    return bubble;
  });
};

/**
 * Calculate score
 */
export const calculateScore = (
  matchCount: number,
  floatingCount: number,
  comboMultiplier: number = 1
): number => {
  const baseScore = matchCount * 100;
  const floatingBonus = floatingCount * 50;
  const comboBonus = comboMultiplier > 1 ? (comboMultiplier - 1) * 200 : 0;
  
  return (baseScore + floatingBonus + comboBonus) * comboMultiplier;
};

/**
 * Get random bubble color
 */
export const getRandomBubbleColor = (availableColors: BubbleColor[]): BubbleColor => {
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

/**
 * Apply power-up effects
 */
export const applyPowerUp = (
  powerUpType: PowerUpType,
  targetBubble: Bubble,
  allBubbles: Bubble[]
): Bubble[] => {
  switch (powerUpType) {
    case 'fireball':
      // Remove all bubbles of the same color
      return allBubbles.filter(b => b.color === targetBubble.color);
      
    case 'bomb':
      // Remove bubbles in a 2-bubble radius
      const bombRadius = BUBBLE_SIZE * 2.5;
      return allBubbles.filter(bubble => {
        const dx = bubble.position.x - targetBubble.position.x;
        const dy = bubble.position.y - targetBubble.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= bombRadius;
      });
      
    case 'rainbow':
      // Acts as any color - find the best match
      const neighborPositions = getNeighborPositions(targetBubble.row, targetBubble.col);
      const colorCounts: Record<BubbleColor, number> = {
        red: 0, blue: 0, green: 0, yellow: 0, 
        purple: 0, orange: 0, pink: 0, cyan: 0
      };
      
      // Count adjacent colors
      for (const pos of neighborPositions) {
        const neighbor = allBubbles.find(b => b.row === pos.row && b.col === pos.col);
        if (neighbor) {
          colorCounts[neighbor.color]++;
        }
      }
      
      // Find the most common adjacent color
      let bestColor: BubbleColor = 'red';
      let maxCount = 0;
      for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          bestColor = color as BubbleColor;
        }
      }
      
      // Create a temporary bubble with the best color for matching
      const tempBubble = { ...targetBubble, color: bestColor };
      return findMatchingBubbles(tempBubble, allBubbles);
      
    default:
      return [];
  }
};

/**
 * Check if game is won (no bubbles left)
 */
export const isGameWon = (bubbles: Bubble[]): boolean => {
  return bubbles.length === 0;
};

/**
 * Check if game is lost (bubbles reached bottom)
 */
export const isGameLost = (bubbles: Bubble[]): boolean => {
  const bottomThreshold = SCREEN_HEIGHT - 200; // Leave space for shooter
  return bubbles.some(bubble => bubble.position.y > bottomThreshold);
};