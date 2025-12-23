import { Vector2 } from '../types/gameTypes';
import { GAME_HEIGHT, GAME_WIDTH, WALL_PADDING, BUBBLE_RADIUS } from './constants';
import { GridBubble } from './gridManager';

// Simple ray with wall bounces: returns points representing full path
export const calculateAimPath = (
  origin: Vector2,
  target: Vector2,
  gridBubbles: GridBubble[] = [],
  maxBounces: number = 2,
  step: number = 8
): Vector2[] => {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return [origin];
  
  const dir = { x: dx / distance, y: dy / distance };
  let currentDir = dir;
  let currentPos = { ...origin };
  const points: Vector2[] = [{ ...origin }];

  const maxSteps = 100;
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
      if (dist < BUBBLE_RADIUS * 2) {
        points.push({ ...nextPos });
        hitBubble = true;
        break;
      }
    }
    
    if (hitBubble) break;

    // Check wall collisions - match the physics exactly
    if (nextPos.x <= WALL_PADDING) {
      // Hit left wall
      nextPos.x = WALL_PADDING;
      currentDir = { x: Math.abs(currentDir.x), y: currentDir.y }; // Always bounce right
      bounces++;
      points.push({ ...nextPos });
    } else if (nextPos.x >= GAME_WIDTH - WALL_PADDING) {
      // Hit right wall
      nextPos.x = GAME_WIDTH - WALL_PADDING;
      currentDir = { x: -Math.abs(currentDir.x), y: currentDir.y }; // Always bounce left
      bounces++;
      points.push({ ...nextPos });
    } else if (nextPos.y <= WALL_PADDING) {
      // Hit top wall - stop here
      nextPos.y = WALL_PADDING;
      points.push({ ...nextPos });
      break;
    } else if (nextPos.y > GAME_HEIGHT) {
      // Hit bottom - stop here
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
  
  if (distance === 0) {
    return { x: 0, y: -speed }; // Default to shooting up
  }
  
  // Normalize direction and apply speed
  const dir = {
    x: dx / distance,
    y: dy / distance,
  };
  
  return {
    x: dir.x * speed,
    y: dir.y * speed,
  };
};
