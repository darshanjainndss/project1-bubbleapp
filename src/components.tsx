import React, { memo } from 'react';
import { View, Dimensions, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Vector2, Bubble, GridBubble } from './types';

// ─────────────────────────────────────────────────────
// AIM TRACKER COMPONENT
// ─────────────────────────────────────────────────────
type AimTrackerProps = {
  path: Vector2[];
};

export const AimTracker: React.FC<AimTrackerProps> = memo(({ path }) => {
  if (path.length < 2) return null;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject]}
    >
      {path.map((point, index) => {
        const screenX = (point.x / 400) * screenWidth;
        const screenY = (point.y / 700) * screenHeight;
        const isEnd = index === path.length - 1;
        const dotSize = isEnd ? 10 : 6;
        const opacity = Math.max(0.4, 1 - index * 0.08);

        return (
          <View
            key={`aim-dot-${index}`}
            style={[
              styles.aimDot,
              {
                left: screenX - dotSize / 2,
                top: screenY - dotSize / 2,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: isEnd ? '#ef4444' : '#06b6d4',
                opacity,
                shadowColor: isEnd ? '#ef4444' : '#06b6d4',
                shadowOpacity: opacity * 0.6,
                shadowRadius: 3,
                elevation: 4,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

AimTracker.displayName = 'AimTracker';

// ─────────────────────────────────────────────────────
// BUBBLE GRID COMPONENT
// ─────────────────────────────────────────────────────
type BubbleGridProps = {
  bubbles: (Bubble | GridBubble)[];
};

export const BubbleGrid: React.FC<BubbleGridProps> = memo(({ bubbles }) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const activeBubbles = bubbles.filter(b => b.isActive);

  return (
    <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
      {activeBubbles.map((bubble) => {
        const screenX = (bubble.position.x / 400) * screenWidth;
        const screenY = (bubble.position.y / 700) * screenHeight;
        const screenRadius = (bubble.radius / 400) * screenWidth;
        const isGrid = 'isGridBubble' in bubble && bubble.isGridBubble;

        return (
          <View
            key={bubble.id}
            style={[
              {
                position: 'absolute',
                width: screenRadius * 2,
                height: screenRadius * 2,
                borderRadius: screenRadius,
                backgroundColor: bubble.color,
                left: screenX - screenRadius,
                top: screenY - screenRadius,
                borderWidth: isGrid ? 1.5 : 2,
                borderColor: isGrid ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                zIndex: isGrid ? 1 : 2,
                shadowColor: bubble.color,
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

BubbleGrid.displayName = 'BubbleGrid';

// ─────────────────────────────────────────────────────
// SHOOTER COMPONENT
// ─────────────────────────────────────────────────────
type ShooterProps = {
  position: Vector2;
  currentBubbleColor?: string;
  nextBubbleColor?: string;
};

export const Shooter: React.FC<ShooterProps> = memo(
  ({
    position,
    currentBubbleColor = '#f97316',
    nextBubbleColor = '#3b82f6',
  }) => {
    const bubbleSize = 32;
    const shooterWidth = 48;
    const shooterHeight = 70;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const screenX = (position.x / 400) * screenWidth;
    const screenY = (position.y / 700) * screenHeight;

    return (
      <View
        style={[
          styles.shooterContainer,
          {
            left: screenX - shooterWidth / 2,
            top: screenY - shooterHeight / 2,
            width: shooterWidth,
            height: shooterHeight,
          },
        ]}
      >
        {/* Shooter Base/Barrel */}
        <View style={[styles.shooterBarrel, {
          width: shooterWidth,
          height: shooterHeight,
        }]} />

        {/* Current Bubble */}
        <View
          style={[
            styles.currentBubble,
            {
              width: bubbleSize,
              height: bubbleSize,
              borderRadius: bubbleSize / 2,
              backgroundColor: currentBubbleColor,
              shadowColor: currentBubbleColor,
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 8,
              top: -16,
            },
          ]}
        />

        {/* Next Bubble Indicator */}
        <View
          style={[
            styles.nextBubbleIndicator,
            {
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: nextBubbleColor,
              shadowColor: nextBubbleColor,
              shadowOpacity: 0.6,
              shadowRadius: 3,
              elevation: 4,
              bottom: 8,
            },
          ]}
        />
      </View>
    );
  }
);

Shooter.displayName = 'Shooter';

// ─────────────────────────────────────────────────────
// HUD COMPONENT - ENHANCED WITH PATTERN NAME & PROGRESS
// ─────────────────────────────────────────────────────
type HUDProps = {
  score: number;
  moves: number;
  combo: number;
  nextBubbleColor: string;
  level: number;
  gameOver?: boolean;
  bubblesCleared?: number;
  bubblesToClear?: number;
  patternName?: string;
};

export const HUD: React.FC<HUDProps> = memo(
  ({
    score,
    moves,
    combo,
    nextBubbleColor,
    level,
    gameOver,
    bubblesCleared = 0,
    bubblesToClear = 20,
    patternName = 'Level',
  }) => {
    const progressPercent = Math.min((bubblesCleared / bubblesToClear) * 100, 100);

    return (
      <View style={styles.hudContainer}>
        {/* Top bar - Pattern name and level */}
        <View style={styles.topBar}>
          <Text style={styles.patternName}>{patternName}</Text>
          <Text style={styles.levelText}>Level {level}/100</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
              },
            ]}
          />
          <Text style={styles.progressText}>
            {bubblesCleared}/{bubblesToClear}
          </Text>
        </View>

        {/* Main HUD stats */}
        <View style={styles.statsRow}>
          {/* Left section - Score */}
          <View style={styles.hudSection}>
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>Score</Text>
              <Text style={styles.hudValueLarge}>{score}</Text>
            </View>
          </View>

          {/* Center section - Next Bubble */}
          <View style={styles.hudCenter}>
            <Text style={styles.hudLabel}>Next</Text>
            <View
              style={[
                styles.nextBubblePreview,
                {
                  backgroundColor: nextBubbleColor,
                  shadowColor: nextBubbleColor,
                },
              ]}
            />
          </View>

          {/* Right section - Combo & Moves */}
          <View style={styles.hudSection}>
            {combo > 0 && (
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>Combo</Text>
                <Text style={[styles.hudValueLarge, { color: '#fbbf24' }]}>
                  x{combo}
                </Text>
              </View>
            )}
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>Moves</Text>
              <Text style={styles.hudValueLarge}>{moves}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

HUD.displayName = 'HUD';

// ─────────────────────────────────────────────────────
// LEVEL COMPLETE MODAL
// ─────────────────────────────────────────────────────
type LevelCompleteProps = {
  level: number;
  score: number;
  bubblesCleared: number;
  patternName: string;
  onContinue: () => void;
};

export const LevelComplete: React.FC<LevelCompleteProps> = memo(
  ({ level, score, bubblesCleared, patternName, onContinue }) => {
    return (
      <View style={styles.gameOverOverlay}>
        <View style={styles.gameOverCard}>
          <Text style={styles.completeTitle}>Level {level} Complete! 🎉</Text>
          <Text style={styles.patternLabel}>{patternName}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Bubbles Cleared</Text>
              <Text style={styles.statValue}>{bubblesCleared}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Level Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next Level →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

LevelComplete.displayName = 'LevelComplete';

// ─────────────────────────────────────────────────────
// GAME OVER MODAL
// ─────────────────────────────────────────────────────
type GameOverProps = {
  score: number;
  level: number;
  onRetry: () => void;
};

export const GameOver: React.FC<GameOverProps> = memo(
  ({ score, level, onRetry }) => {
    return (
      <View style={styles.gameOverOverlay}>
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverTitle}>Game Over</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Final Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Level Reached</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

GameOver.displayName = 'GameOver';

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Aim Tracker
  aimDot: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Shooter
  shooterContainer: {
    position: 'absolute',
    width: 48,
    alignItems: 'center',
    zIndex: 10,
  },
  shooterBarrel: {
    width: 48,
    height: 70,
    backgroundColor: '#64748b',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentBubble: {
    position: 'absolute',
    top: -16,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nextBubbleIndicator: {
    position: 'absolute',
    bottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },

  // HUD
  hudContainer: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 2, // Changed from borderTopWidth to borderBottomWidth
    borderBottomColor: 'rgba(148, 163, 184, 0.3)',
    paddingTop: 10, // Add padding for status bar
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  patternName: {
    color: '#06b6d4',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    height: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#06b6d4',
    opacity: 0.6,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#f1f5f9',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  hudSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  hudItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  hudLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hudValueLarge: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
  },
  nextBubblePreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },

  // Game Over / Level Complete
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#06b6d4',
    marginBottom: 8,
  },
  patternLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    fontWeight: '600',
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  statsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    color: '#06b6d4',
    fontSize: 20,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  retryButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default {
  AimTracker,
  BubbleGrid,
  Shooter,
  HUD,
  GameOver,
  LevelComplete,
};