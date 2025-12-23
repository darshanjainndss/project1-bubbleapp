import { create } from 'zustand';
import { Vector2, Bubble, GridBubble, GameState } from './types';
import {
  createInitialBubbles,
  launchVelocityFromAim,
  calculateAimPath,
  updateBubblePositions,
  countRemainingBubbles,
  getRandomColor,
  findConnectedBubbles,
  findFloatingBubbles,
  calculateMatchScore,
  BUBBLE_SPEED,
  GAME_HEIGHT,
  GAME_WIDTH,
  SHOOTER_Y_OFFSET,
  LEVEL_CONFIG,
  BUBBLE_COLORS,
  getPatternName,
} from './game';

type GameStore = GameState & {
  // State getters
  bubblesCleared: number;
  patternName: string;
  
  // State setters
  setAimTargetFromTouch: (target: Vector2) => void;
  setAimTarget: (target: Vector2 | null) => void;
  fireBubble: () => void;
  update: (dt: number) => void;
  resetGame: () => void;
  nextLevel: () => void;
  
  // Internal
  _addScore: (points: number) => void;
  _handleBubbleMatch: (newBubbles: (Bubble | GridBubble)[]) => void;
};

const INITIAL_SHOOTER_POSITION: Vector2 = {
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT - SHOOTER_Y_OFFSET,
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  bubbles: createInitialBubbles(1),
  shooterPosition: INITIAL_SHOOTER_POSITION,
  aimPath: [],
  score: 0,
  moves: LEVEL_CONFIG[1].maxMoves, // Use level config for initial moves
  combo: 0,
  gameOver: false,
  level: 1,
  currentBubbleColor: BUBBLE_COLORS[0],
  nextBubbleColor: BUBBLE_COLORS[1],
  aimTarget: null,
  bubblesCleared: 0,
  patternName: getPatternName(LEVEL_CONFIG[1].pattern),

  // Aim control
  setAimTargetFromTouch: (target: Vector2) => {
    set((state) => {
      const newPath = calculateAimPath(
        state.shooterPosition,
        target,
        state.bubbles.filter(
          (b) => ('isGridBubble' in b && b.isGridBubble) || b.isActive
        ) as GridBubble[]
      );

      return {
        aimTarget: target,
        aimPath: newPath,
      };
    });
  },

  setAimTarget: (target: Vector2 | null) => {
    set({ aimTarget: target });
  },

  // Fire bubble
  fireBubble: () => {
    const state = get();
    if (!state.aimTarget || state.gameOver) return;

    // Check if we have moves left
    const levelConfig = LEVEL_CONFIG[Math.min(state.level, 100)] || LEVEL_CONFIG[1];
    if (state.moves <= 0) {
      set({ gameOver: true });
      return;
    }

    const velocity = launchVelocityFromAim(
      state.shooterPosition,
      state.aimTarget,
      BUBBLE_SPEED
    );

    const newBubble: Bubble = {
      id: `shot-${Date.now()}-${Math.random()}`,
      position: { 
        x: state.shooterPosition.x, 
        y: state.shooterPosition.y - 20 // Start slightly above shooter
      },
      velocity,
      radius: 14,
      color: state.currentBubbleColor,
      isActive: true,
    };

    set((state) => ({
      bubbles: [...state.bubbles, newBubble],
      moves: Math.max(0, state.moves - 1),
      aimTarget: null,
      aimPath: [],
      currentBubbleColor: state.nextBubbleColor,
      nextBubbleColor: getRandomColor(),
    }));
  },

  // Game update loop (called 60 times per second)
  update: (dt: number) => {
    const state = get();

    if (state.gameOver || state.moves <= 0) return;

    // Update bubble positions with physics
    const updatedBubbles = updateBubblePositions(state.bubbles, dt);

    // Check if any shot bubbles were placed
    const shotBubbles = state.bubbles.filter(
      (b) => !('isGridBubble' in b) || !b.isGridBubble
    );
    const newShotBubbles = updatedBubbles.filter(
      (b) => !('isGridBubble' in b) || !b.isGridBubble
    );

    // If a shot bubble was converted to grid bubble, handle matching
    if (newShotBubbles.length < shotBubbles.length) {
      get()._handleBubbleMatch(updatedBubbles);
      return;
    }

    // Check win condition - all bubbles cleared
    const gridBubbles = updatedBubbles.filter(
      (b) => ('isGridBubble' in b && b.isGridBubble) && b.isActive
    );

    const levelConfig = LEVEL_CONFIG[Math.min(state.level, 100)] || LEVEL_CONFIG[1];
    const bubblesClearedCount = state.bubbles.filter(
      (b) => 'isGridBubble' in b && b.isGridBubble && b.isActive
    ).length - gridBubbles.length;
    const totalInitialBubbles = state.bubbles.filter(
      (b) => 'isGridBubble' in b && b.isGridBubble
    ).length;

    const cleared = totalInitialBubbles - gridBubbles.length;

    // Level complete - all bubbles cleared or target reached
    if (cleared >= levelConfig.bubblesToClear) {
      set({
        bubbles: updatedBubbles,
        bubblesCleared: cleared,
      });
      
      // Auto move to next level after showing completion
      setTimeout(() => {
        get().nextLevel();
      }, 1500);
      return;
    }

    // Check if game over (bubbles reached bottom or no moves)
    const gameOverCondition = gridBubbles.some(
      (b) => 'row' in b && b.row && b.row > 9
    ) || state.moves <= 0;

    set({
      bubbles: updatedBubbles,
      gameOver: gameOverCondition,
      bubblesCleared: cleared,
    });
  },

  _handleBubbleMatch: (newBubbles: (Bubble | GridBubble)[]) => {
    const state = get();
    const gridBubbles = newBubbles.filter(
      (b) => ('isGridBubble' in b && b.isGridBubble) && b.isActive
    ) as GridBubble[];

    // Find newly placed bubble (latest grid bubble)
    let latestPlacedBubble: GridBubble | null = null;
    let latestTimestamp = 0;

    for (const bubble of gridBubbles) {
      const timestamp = parseInt(bubble.id.split('-').pop() || '0');
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestPlacedBubble = bubble;
      }
    }

    if (!latestPlacedBubble) {
      set({ bubbles: newBubbles });
      return;
    }

    // Check for matches
    const connectedBubbles = findConnectedBubbles(gridBubbles, latestPlacedBubble);
    const matchCount = connectedBubbles.length;

    if (matchCount >= 3) {
      // Calculate score with combo
      const score = calculateMatchScore(matchCount, state.combo);

      // Remove matched bubbles
      const idsToRemove = new Set(connectedBubbles.map((b) => b.id));
      let resultBubbles = newBubbles.filter((b) => !idsToRemove.has(b.id));

      // Find and remove floating bubbles
      const remainingGridBubbles = resultBubbles.filter(
        (b) => ('isGridBubble' in b && b.isGridBubble) && b.isActive
      ) as GridBubble[];

      const floatingBubbles = findFloatingBubbles(remainingGridBubbles);
      const floatingIds = new Set(floatingBubbles.map((b) => b.id));
      resultBubbles = resultBubbles.filter((b) => !floatingIds.has(b.id));

      const newCombo = state.combo + 1;
      const floatingBonus = floatingBubbles.length * 3;

      // Check if level complete after this match
      const levelConfig = LEVEL_CONFIG[Math.min(state.level, 100)] || LEVEL_CONFIG[1];
      const gridBubblesLeft = resultBubbles.filter(
        (b) => 'isGridBubble' in b && b.isGridBubble && b.isActive
      ) as GridBubble[];
      const initialGridBubbles = state.bubbles.filter(
        (b) => 'isGridBubble' in b && b.isGridBubble
      ).length;
      const cleared = initialGridBubbles - gridBubblesLeft.length;

      const levelComplete = cleared >= levelConfig.bubblesToClear;

      set({
        bubbles: resultBubbles,
        score: state.score + score + floatingBonus,
        combo: newCombo,
        bubblesCleared: cleared,
        gameOver: levelComplete, // Signal level completion
      });

      if (levelComplete) {
        // Auto move to next level
        setTimeout(() => {
          get().nextLevel();
        }, 1500);
      }
    } else {
      // No match, reset combo
      const levelConfig = LEVEL_CONFIG[Math.min(state.level, 100)] || LEVEL_CONFIG[1];
      const gridBubblesLeft = newBubbles.filter(
        (b) => 'isGridBubble' in b && b.isGridBubble && b.isActive
      ) as GridBubble[];
      const initialGridBubbles = state.bubbles.filter(
        (b) => 'isGridBubble' in b && b.isGridBubble
      ).length;
      const cleared = initialGridBubbles - gridBubblesLeft.length;

      set({
        bubbles: newBubbles,
        combo: 0,
        bubblesCleared: cleared,
      });
    }
  },

  // Reset game
  resetGame: () => {
    const initialBubbles = createInitialBubbles(1);
    const levelConfig = LEVEL_CONFIG[1];
    
    set({
      bubbles: initialBubbles,
      shooterPosition: INITIAL_SHOOTER_POSITION,
      aimPath: [],
      score: 0,
      moves: levelConfig.maxMoves,
      combo: 0,
      gameOver: false,
      level: 1,
      currentBubbleColor: BUBBLE_COLORS[0],
      nextBubbleColor: BUBBLE_COLORS[1],
      aimTarget: null,
      bubblesCleared: 0,
      patternName: getPatternName(levelConfig.pattern),
    });
  },

  // Move to next level
  nextLevel: () => {
    const state = get();
    const nextLevelNum = Math.min(state.level + 1, 100);
    const levelConfig = LEVEL_CONFIG[nextLevelNum];

    if (!levelConfig) {
      // Game complete - all 100 levels done!
      set({ gameOver: true });
      return;
    }

    const initialBubbles = createInitialBubbles(nextLevelNum);

    set({
      bubbles: initialBubbles,
      shooterPosition: INITIAL_SHOOTER_POSITION,
      aimPath: [],
      moves: levelConfig.maxMoves,
      combo: 0,
      gameOver: false,
      level: nextLevelNum,
      currentBubbleColor: BUBBLE_COLORS[0],
      nextBubbleColor: BUBBLE_COLORS[1],
      aimTarget: null,
      bubblesCleared: 0,
      patternName: getPatternName(levelConfig.pattern),
    });
  },

  _addScore: (points: number) => {
    set((state) => ({
      score: state.score + points,
    }));
  },
}));

export default useGameStore;