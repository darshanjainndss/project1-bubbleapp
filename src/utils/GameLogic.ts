import { GridBubble, BubbleColor, Position } from '../types/gameTypes';
import { BUBBLE_COLORS, GAME_CONFIG } from '../constants/GameConstants';

export class GameLogic {
  static generateRandomColor(): BubbleColor {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
  }

  static createInitialBubbles(): GridBubble[] {
    const bubbles: GridBubble[] = [];
    const { BUBBLE_SIZE, BUBBLE_SPACING, ROWS, COLS } = GAME_CONFIG;
    
    // Create fewer initial rows for easier gameplay
    for (let row = 0; row < 6; row++) {
      const colsInRow = row % 2 === 0 ? COLS : COLS - 1;
      const offsetX = row % 2 === 0 ? 0 : BUBBLE_SPACING / 2;
      
      for (let col = 0; col < colsInRow; col++) {
        const x = offsetX + col * BUBBLE_SPACING + BUBBLE_SIZE;
        const y = row * (BUBBLE_SPACING * 0.87) + BUBBLE_SIZE + 50; // Add top margin
        
        bubbles.push({
          id: `${row}-${col}`,
          color: GameLogic.generateRandomColor(),
          x,
          y,
          row,
          col,
        });
      }
    }
    
    return bubbles;
  }

  static calculateTrajectory(startPos: Position, targetPos: Position): Position {
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: dx / distance,
      y: dy / distance,
    };
  }

  static findNearestGridPosition(x: number, y: number): { row: number; col: number; x: number; y: number } {
    const { BUBBLE_SPACING, BUBBLE_SIZE } = GAME_CONFIG;
    
    // Calculate row based on y position
    const row = Math.round(y / (BUBBLE_SPACING * 0.87));
    
    // Calculate column based on row offset
    const offsetX = row % 2 === 0 ? 0 : BUBBLE_SPACING / 2;
    const col = Math.round((x - offsetX - BUBBLE_SIZE) / BUBBLE_SPACING);
    
    // Ensure valid column range
    const maxCols = row % 2 === 0 ? 8 : 7;
    const clampedCol = Math.max(0, Math.min(maxCols - 1, col));
    
    // Calculate final position
    const gridX = offsetX + clampedCol * BUBBLE_SPACING + BUBBLE_SIZE;
    const gridY = Math.max(BUBBLE_SIZE, row * (BUBBLE_SPACING * 0.87) + BUBBLE_SIZE);
    
    return { row: Math.max(0, row), col: clampedCol, x: gridX, y: gridY };
  }

  static findConnectedBubbles(bubbles: GridBubble[], targetBubble: GridBubble): GridBubble[] {
    const connected: GridBubble[] = [];
    const visited = new Set<string>();
    const queue = [targetBubble];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      
      visited.add(current.id);
      connected.push(current);
      
      const neighbors = GameLogic.getNeighbors(bubbles, current);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id) && neighbor.color === targetBubble.color) {
          queue.push(neighbor);
        }
      }
    }
    
    return connected;
  }

  static getNeighbors(bubbles: GridBubble[], bubble: GridBubble): GridBubble[] {
    const neighbors: GridBubble[] = [];
    const { row, col } = bubble;
    
    const neighborPositions = row % 2 === 0 
      ? [
          [row - 1, col - 1], [row - 1, col],
          [row, col - 1], [row, col + 1],
          [row + 1, col - 1], [row + 1, col]
        ]
      : [
          [row - 1, col], [row - 1, col + 1],
          [row, col - 1], [row, col + 1],
          [row + 1, col], [row + 1, col + 1]
        ];
    
    for (const [r, c] of neighborPositions) {
      const neighbor = bubbles.find(b => b.row === r && b.col === c);
      if (neighbor) neighbors.push(neighbor);
    }
    
    return neighbors;
  }

  static findFloatingBubbles(bubbles: GridBubble[]): GridBubble[] {
    const topRowBubbles = bubbles.filter(b => b.row === 0);
    const connected = new Set<string>();
    
    // Find all bubbles connected to top row
    const queue = [...topRowBubbles];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (connected.has(current.id)) continue;
      
      connected.add(current.id);
      const neighbors = GameLogic.getNeighbors(bubbles, current);
      for (const neighbor of neighbors) {
        if (!connected.has(neighbor.id)) {
          queue.push(neighbor);
        }
      }
    }
    
    return bubbles.filter(b => !connected.has(b.id));
  }
}