import { create } from 'zustand';
import { GameState, Vector2, Bubble } from './gameTypes';
import { createInitialBubbles, GridBubble } from '../utils/gridManager';
import { updateBubblePositions } from '../utils/bubblePhysics';
import { calculateAimPath, launchVelocityFromAim } from '../utils/aimCalculator';
import { GAME_HEIGHT, GAME_WIDTH, SHOOTER_Y_OFFSET } from '../utils/constants';
import { BUBBLE_SPEED } from '../config/gameConfig';
import { BUBBLE_COLORS } from '../constants/GameConstants';

type GameStore = {
  bubbles: (Bubble | GridBubble)[];
  shooterPosition: Vector2;
  aimPath: Vector2[];
  score: number;
  moves: number;
  currentBubbleColor: string;
  nextBubbleColor: string;
  aimTarget: Vector2 | null;
  update: (dt: number) => void;
  setAimTargetFromTouch: (target: Vector2) => void;
  fireBubble: () => void;
};

const shooterOrigin: Vector2 = {
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT - SHOOTER_Y_OFFSET,
};

const getRandomBubbleColor = () => {
  return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
};

export const useGameStore = create<GameStore>((set, get) => ({
  bubbles: createInitialBubbles(),
  shooterPosition: shooterOrigin,
  aimPath: [],
  score: 0,
  moves: 0,
  currentBubbleColor: getRandomBubbleColor(),
  nextBubbleColor: getRandomBubbleColor(),
  aimTarget: null,

  update: (dt: number) => {
    const { bubbles, score } = get();
    const updated = updateBubblePositions(bubbles, dt);
    
    // Calculate score increase from bubble popping (this is a simplified approach)
    // In a real implementation, you'd return the score from updateBubblePositions
    const activeBubblesBefore = bubbles.filter(b => b.isActive).length;
    const activeBubblesAfter = updated.filter(b => b.isActive).length;
    const bubblesRemoved = activeBubblesBefore - activeBubblesAfter;
    const scoreIncrease = bubblesRemoved > 1 ? bubblesRemoved * 10 : 0;
    
    set({ 
      bubbles: updated,
      score: score + scoreIncrease
    });
  },

  setAimTargetFromTouch: (target: Vector2) => {
    const { bubbles } = get();
    const gridBubbles = bubbles.filter(b => 'isGridBubble' in b && b.isGridBubble) as GridBubble[];
    const path = calculateAimPath(shooterOrigin, target, gridBubbles);
    set({ aimPath: path, aimTarget: target });
  },

  fireBubble: () => {
    const { aimTarget, bubbles, moves, currentBubbleColor, nextBubbleColor } = get();
    if (!aimTarget) return;

    // Use the aim target directly for velocity calculation
    const velocity = launchVelocityFromAim(shooterOrigin, aimTarget, BUBBLE_SPEED);

    const newBubble: Bubble = {
      id: `shot-${Date.now()}`,
      position: { ...shooterOrigin },
      velocity,
      radius: 14,
      color: currentBubbleColor,
      isActive: true,
    };

    set({
      bubbles: [...bubbles, newBubble],
      moves: moves + 1,
      currentBubbleColor: nextBubbleColor,
      nextBubbleColor: getRandomBubbleColor(),
      aimTarget: null, // Clear aim target after shooting
    });
  },
}));
