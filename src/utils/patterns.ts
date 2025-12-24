// src/utils/patterns.ts

import { Bubble, BubbleColor, Position } from '../types/index';
import { Dimensions } from 'react-native';

export const BUBBLE_SIZE = 40;
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;
export const GRID_COLS = 8; // Fixed 8 columns for consistent gameplay
export const GRID_ROWS = 15;
export const GRID_OFFSET_X = (SCREEN_WIDTH - (GRID_COLS * BUBBLE_SIZE)) / 2;
export const GRID_START_Y = 100;

// Convert grid position to screen position
export const gridToPosition = (row: number, col: number): Position => {
  const offsetX = (row % 2) * (BUBBLE_SIZE / 2); // Hexagonal offset
  return {
    x: GRID_OFFSET_X + (col * BUBBLE_SIZE) + (BUBBLE_SIZE / 2) + offsetX,
    y: GRID_START_Y + (row * BUBBLE_SIZE * 0.87) + (BUBBLE_SIZE / 2), // 0.87 for hexagonal spacing
  };
};

// Convert screen position to grid position
export const positionToGrid = (position: Position): { row: number; col: number } => {
  const y = position.y - GRID_START_Y;
  const row = Math.round(y / (BUBBLE_SIZE * 0.87));
  
  const offsetX = (row % 2) * (BUBBLE_SIZE / 2);
  const x = position.x - GRID_OFFSET_X - offsetX;
  const col = Math.round(x / BUBBLE_SIZE);
  
  return { row: Math.max(0, row), col: Math.max(0, Math.min(GRID_COLS - 1, col)) };
};

// Find the nearest empty grid position
export const findNearestEmptyPosition = (
  targetPos: Position,
  existingBubbles: Bubble[]
): { row: number; col: number } => {
  const { row, col } = positionToGrid(targetPos);
  const occupied = new Set(existingBubbles.map(b => `${b.row},${b.col}`));
  
  // Check if target position is free
  if (!occupied.has(`${row},${col}`)) {
    return { row, col };
  }
  
  // Search in expanding rings
  for (let radius = 1; radius <= 3; radius++) {
    for (let r = Math.max(0, row - radius); r <= row + radius; r++) {
      for (let c = Math.max(0, col - radius); c <= Math.min(GRID_COLS - 1, col + radius); c++) {
        if (!occupied.has(`${r},${c}`)) {
          return { row: r, col: c };
        }
      }
    }
  }
  
  return { row, col }; // Fallback
};

export const createPattern = (
  pattern: 'honeycomb' | 'pyramid' | 'star' | 'diamond' | 'zigzag' | 'circle',
  colors: BubbleColor[]
): Bubble[] => {
  const bubbles: Bubble[] = [];
  let id = 0;

  const createBubble = (row: number, col: number, color: BubbleColor): Bubble => {
    const position = gridToPosition(row, col);
    return {
      id: (id++).toString(),
      color,
      position,
      row,
      col,
    };
  };

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // Use specific colors for each pattern to make them more distinct
  const getPatternColor = (index: number): BubbleColor => {
    const patternColors: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];
    return patternColors[index % patternColors.length];
  };

  console.log(`🎯 Creating pattern: ${pattern}`); // Debug log

  switch (pattern) {
    case 'honeycomb':
      // Create a proper honeycomb pattern from top
      for (let row = 0; row < 6; row++) {
        const colsInRow = row % 2 === 0 ? 8 : 7;
        for (let col = 0; col < colsInRow; col++) {
          bubbles.push(createBubble(row, col, getRandomColor()));
        }
      }
      break;

    case 'pyramid':
      // CLEAR PYRAMID SHAPE - Triangle from top
      for (let row = 0; row < 6; row++) {
        const width = row + 1; // Start with 1 bubble, increase each row
        const startCol = Math.floor((8 - width) / 2);
        for (let col = startCol; col < startCol + width; col++) {
          bubbles.push(createBubble(row, col, getPatternColor(col - startCol)));
        }
      }
      break;

    case 'star':
      // BIG CLEAR 8-POINTED STAR PATTERN
      const centerRow = 3;
      const centerCol = 3;
      
      // CENTER BUBBLE
      bubbles.push(createBubble(centerRow, centerCol, 'red'));
      
      // VERTICAL LINE (up and down from center)
      for (let i = 1; i <= 3; i++) {
        if (centerRow - i >= 0) bubbles.push(createBubble(centerRow - i, centerCol, 'blue'));
        if (centerRow + i < 8) bubbles.push(createBubble(centerRow + i, centerCol, 'blue'));
      }
      
      // HORIZONTAL LINE (left and right from center)
      for (let i = 1; i <= 3; i++) {
        if (centerCol - i >= 0) bubbles.push(createBubble(centerRow, centerCol - i, 'green'));
        if (centerCol + i < 8) bubbles.push(createBubble(centerRow, centerCol + i, 'green'));
      }
      
      // DIAGONAL LINES
      for (let i = 1; i <= 2; i++) {
        // Top-left to bottom-right
        if (centerRow - i >= 0 && centerCol - i >= 0) 
          bubbles.push(createBubble(centerRow - i, centerCol - i, 'yellow'));
        if (centerRow + i < 8 && centerCol + i < 8) 
          bubbles.push(createBubble(centerRow + i, centerCol + i, 'yellow'));
        
        // Top-right to bottom-left
        if (centerRow - i >= 0 && centerCol + i < 8) 
          bubbles.push(createBubble(centerRow - i, centerCol + i, 'purple'));
        if (centerRow + i < 8 && centerCol - i >= 0) 
          bubbles.push(createBubble(centerRow + i, centerCol - i, 'purple'));
      }
      break;

    case 'diamond':
      // CLEAR DIAMOND SHAPE
      const diamondPatterns = [
        { row: 0, cols: [3, 4] }, // Top point
        { row: 1, cols: [2, 3, 4, 5] }, // Second row
        { row: 2, cols: [1, 2, 3, 4, 5, 6] }, // Third row
        { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7] }, // Widest row
        { row: 4, cols: [1, 2, 3, 4, 5, 6] }, // Fifth row
        { row: 5, cols: [2, 3, 4, 5] }, // Sixth row
        { row: 6, cols: [3, 4] }, // Bottom point
      ];
      
      diamondPatterns.forEach(({ row, cols }) => {
        cols.forEach((col, index) => {
          bubbles.push(createBubble(row, col, getPatternColor(index)));
        });
      });
      break;

    case 'zigzag':
      // CLEAR ZIGZAG PATTERN - Alternating sides
      for (let row = 0; row < 8; row++) {
        if (row % 4 === 0) {
          // Far left
          bubbles.push(createBubble(row, 0, 'red'));
          bubbles.push(createBubble(row, 1, 'red'));
        } else if (row % 4 === 1) {
          // Center left
          bubbles.push(createBubble(row, 2, 'blue'));
          bubbles.push(createBubble(row, 3, 'blue'));
        } else if (row % 4 === 2) {
          // Center right
          bubbles.push(createBubble(row, 4, 'green'));
          bubbles.push(createBubble(row, 5, 'green'));
        } else {
          // Far right
          bubbles.push(createBubble(row, 6, 'yellow'));
          bubbles.push(createBubble(row, 7, 'yellow'));
        }
      }
      break;

    case 'circle':
      // CLEAR CIRCLE PATTERN - Ring shape
      const circleCenter = { row: 3, col: 3 };
      const radius = 2.5;
      
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const distance = Math.sqrt(
            Math.pow(row - circleCenter.row, 2) + 
            Math.pow(col - circleCenter.col, 2)
          );
          // Create a ring - bubbles at specific distance
          if (distance >= 1.5 && distance <= radius) {
            const angle = Math.atan2(row - circleCenter.row, col - circleCenter.col);
            const colorIndex = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 4);
            bubbles.push(createBubble(row, col, getPatternColor(colorIndex)));
          }
        }
      }
      break;

    default:
      // Default simple pattern from top
      for (let row = 0; row < 4; row++) {
        const colsInRow = row % 2 === 0 ? 8 : 7;
        for (let col = 0; col < colsInRow; col++) {
          bubbles.push(createBubble(row, col, getRandomColor()));
        }
      }
  }

  console.log(`✅ Pattern ${pattern} created with ${bubbles.length} bubbles`);
  
  // Log first few bubble positions for debugging
  bubbles.slice(0, 5).forEach(bubble => {
    console.log(`Bubble at row:${bubble.row}, col:${bubble.col}, pos:(${Math.round(bubble.position.x)}, ${Math.round(bubble.position.y)})`);
  });
  
  return bubbles;
};

// Get neighboring positions in hexagonal grid
export const getNeighborPositions = (row: number, col: number): Array<{row: number, col: number}> => {
  const isEvenRow = row % 2 === 0;
  const neighbors = [
    { row: row - 1, col: col - (isEvenRow ? 1 : 0) },
    { row: row - 1, col: col + (isEvenRow ? 0 : 1) },
    { row: row, col: col - 1 },
    { row: row, col: col + 1 },
    { row: row + 1, col: col - (isEvenRow ? 1 : 0) },
    { row: row + 1, col: col + (isEvenRow ? 0 : 1) },
  ];
  
  return neighbors.filter(pos => 
    pos.row >= 0 && pos.row < GRID_ROWS && 
    pos.col >= 0 && pos.col < GRID_COLS
  );
};