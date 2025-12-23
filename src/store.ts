import { create } from 'zustand';
import { GameState, Vector2, Bubble } from './types';
import { 
  createInitialBubbles, 
  updateBubblePositions, 
  calculateAimPath, 
  launchVelocityFromAim,
  GAME_HEIGHT, 
  GAME_WIDTH, 
  SHOOTER_Y_OFFSET,
  BUBBLE_SPEED,
  BUBBLE_COLORS,
  GridBubble
} from './game';

type GameStore = GameState & {
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
      aimTarget: null,
    });
  },
}));