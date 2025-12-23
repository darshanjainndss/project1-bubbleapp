import { Bubble } from '../types/gameTypes';
import { GridBubble, checkBubbleCollision, findNearestGridPosition, findConnectedBubbles, findFloatingBubbles } from './gridManager';
import { GAME_WIDTH, GAME_HEIGHT, WALL_PADDING } from './constants';
import { add } from './math';

export const updateBubblePositions = (
  bubbles: (Bubble | GridBubble)[],
  dt: number
): (Bubble | GridBubble)[] => {
  const gridBubbles = bubbles.filter(b => 'isGridBubble' in b && b.isGridBubble) as GridBubble[];
  const shotBubbles = bubbles.filter(b => !('isGridBubble' in b) || !b.isGridBubble) as Bubble[];
  
  let updatedBubbles: (Bubble | GridBubble)[] = [...gridBubbles];
  let bubblesPopped = false;
  let newScore = 0;

  // Update shot bubbles
  for (const bubble of shotBubbles) {
    if (!bubble.isActive) {
      updatedBubbles.push(bubble);
      continue;
    }

    // Update position based on velocity
    let position = add(bubble.position, {
      x: bubble.velocity.x * dt,
      y: bubble.velocity.y * dt,
    });

    let velocity = { ...bubble.velocity };
    let shouldSnapToGrid = false;

    // Handle wall collisions (left and right walls)
    if (position.x - bubble.radius <= WALL_PADDING) {
      position.x = WALL_PADDING + bubble.radius;
      velocity.x = Math.abs(velocity.x);
    }
    if (position.x + bubble.radius >= GAME_WIDTH - WALL_PADDING) {
      position.x = GAME_WIDTH - WALL_PADDING - bubble.radius;
      velocity.x = -Math.abs(velocity.x);
    }

    // Handle top wall collision - snap to grid
    if (position.y - bubble.radius <= WALL_PADDING) {
      shouldSnapToGrid = true;
    }

    // Check collision with grid bubbles
    for (const gridBubble of gridBubbles) {
      if (gridBubble.isActive && checkBubbleCollision({ ...bubble, position }, gridBubble)) {
        shouldSnapToGrid = true;
        break;
      }
    }

    // Snap to grid if collision detected
    if (shouldSnapToGrid) {
      const gridPos = findNearestGridPosition(position.x, position.y);
      
      // Check if grid position is already occupied
      const isOccupied = gridBubbles.some(gb => 
        gb.isActive && gb.row === gridPos.row && gb.col === gridPos.col
      );
      
      if (!isOccupied) {
        // Create new grid bubble
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
        
        // Check for matches and remove connected bubbles of same color
        const connectedBubbles = findConnectedBubbles([...gridBubbles, newGridBubble], newGridBubble);
        if (connectedBubbles.length >= 3) {
          // Remove connected bubbles
          const idsToRemove = new Set(connectedBubbles.map(b => b.id));
          updatedBubbles = updatedBubbles.filter(b => !idsToRemove.has(b.id));
          bubblesPopped = true;
          newScore += connectedBubbles.length * 10;
          
          // Remove floating bubbles
          const remainingGridBubbles = updatedBubbles.filter(b => 'isGridBubble' in b && b.isGridBubble) as GridBubble[];
          const floatingBubbles = findFloatingBubbles(remainingGridBubbles);
          const floatingIds = new Set(floatingBubbles.map(b => b.id));
          updatedBubbles = updatedBubbles.filter(b => !floatingIds.has(b.id));
          newScore += floatingBubbles.length * 5;
        }
      }
      
      // Remove the shot bubble
      continue;
    }

    // Remove bubble if it goes below screen
    if (position.y > GAME_HEIGHT + 50) {
      updatedBubbles.push({ ...bubble, isActive: false });
      continue;
    }

    // Update bubble position
    updatedBubbles.push({
      ...bubble,
      position,
      velocity,
    });
  }

  return updatedBubbles;
};
