import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Bubble as BubbleComponent } from '../components/Bubble';
import { Shooter } from '../components/Shooter';
import { PowerUp } from '../components/PowerUp';
import {
  Bubble,
  BubbleColor,
  Position,
  PowerUpType,
  ShotBubble,
  Velocity,
} from '../types/index';
import { 
  createPattern, 
  BUBBLE_SIZE, 
  SCREEN_WIDTH, 
  SCREEN_HEIGHT,
  gridToPosition,
  positionToGrid,
} from '../utils/patterns';
import {
  calculateScore,
  getRandomBubbleColor,
  applyPowerUp,
} from '../utils/gameLogic';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const SHOOTER_Y = SCREEN_HEIGHT - 120;
const SHOOTER_X = SCREEN_WIDTH / 2;
const SHOT_SPEED = 15;

type GameScreenProps = StackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { level } = route.params;

  // Game state
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [shotBubble, setShotBubble] = useState<ShotBubble | null>(null);
  const [currentColor, setCurrentColor] = useState<BubbleColor>('red');
  const [nextColor, setNextColor] = useState<BubbleColor>('blue');
  const [shooterAngle, setShooterAngle] = useState(-Math.PI / 2);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [trajectoryPoints, setTrajectoryPoints] = useState<Position[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUps, setPowerUps] = useState([
    { type: 'fireball' as PowerUpType, count: 2 },
    { type: 'bomb' as PowerUpType, count: 2 },
    { type: 'rainbow' as PowerUpType, count: 2 },
  ]);

  const gameLoopRef = useRef<number | null>(null);
  const shooterPosition = { x: SHOOTER_X, y: SHOOTER_Y };

  // Initialize level with proper pattern
  useEffect(() => {
    const initialBubbles = createPattern(level.pattern, level.colors);
    setBubbles(initialBubbles);
    setCurrentColor(getRandomBubbleColor(level.colors));
    setNextColor(getRandomBubbleColor(level.colors));
  }, [level]);

  // Calculate trajectory for aiming
  const calculateTrajectory = useCallback((angle: number): Position[] => {
    const points: Position[] = [];
    const step = 8;
    let pos = { ...shooterPosition };
    let vel = {
      x: Math.cos(angle) * step,
      y: Math.sin(angle) * step,
    };

    for (let i = 0; i < 50; i++) {
      pos.x += vel.x;
      pos.y += vel.y;

      // Wall bouncing
      if (pos.x <= BUBBLE_SIZE / 2 || pos.x >= SCREEN_WIDTH - BUBBLE_SIZE / 2) {
        vel.x *= -1;
        pos.x = Math.max(BUBBLE_SIZE / 2, Math.min(SCREEN_WIDTH - BUBBLE_SIZE / 2, pos.x));
      }

      // Top boundary
      if (pos.y <= 100) break;

      // Check collision with existing bubbles
      let collision = false;
      for (const bubble of bubbles) {
        const dx = pos.x - bubble.position.x;
        const dy = pos.y - bubble.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < BUBBLE_SIZE * 0.9) {
          collision = true;
          break;
        }
      }

      if (collision) break;

      if (i % 2 === 0) {
        points.push({ ...pos });
      }
    }

    return points;
  }, [bubbles, shooterPosition]);

  // Update trajectory when angle changes
  useEffect(() => {
    if (!shotBubble) {
      const points = calculateTrajectory(shooterAngle);
      setTrajectoryPoints(points);
    }
  }, [shooterAngle, bubbles, shotBubble, calculateTrajectory]);

  // Game physics loop
  useEffect(() => {
    if (shotBubble) {
      gameLoopRef.current = setInterval(() => {
        setShotBubble(prevShot => {
          if (!prevShot) return null;

          const newPos = {
            x: prevShot.position.x + prevShot.velocity.x,
            y: prevShot.position.y + prevShot.velocity.y,
          };

          let newVel = { ...prevShot.velocity };

          // Wall bouncing
          if (newPos.x <= BUBBLE_SIZE / 2 || newPos.x >= SCREEN_WIDTH - BUBBLE_SIZE / 2) {
            newVel.x *= -1;
            newPos.x = Math.max(BUBBLE_SIZE / 2, Math.min(SCREEN_WIDTH - BUBBLE_SIZE / 2, newPos.x));
          }

          // Check collision with grid bubbles
          for (const bubble of bubbles) {
            const dx = newPos.x - bubble.position.x;
            const dy = newPos.y - bubble.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < BUBBLE_SIZE * 0.9) {
              attachBubble(prevShot, newPos);
              return null;
            }
          }

          // Check if reached top
          if (newPos.y <= 100) {
            attachBubble(prevShot, newPos);
            return null;
          }

          return {
            ...prevShot,
            position: newPos,
            velocity: newVel,
          };
        });
      }, 16);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [shotBubble, bubbles]);

  // Attach bubble to grid
  const attachBubble = useCallback((shot: ShotBubble, position: Position) => {
    const gridPos = positionToGrid(position);
    
    // Find nearest empty position
    const occupied = new Set(bubbles.map(b => `${b.row},${b.col}`));
    let finalRow = gridPos.row;
    let finalCol = gridPos.col;

    // Simple collision resolution - find nearest empty spot
    for (let radius = 0; radius <= 2; radius++) {
      let found = false;
      for (let r = Math.max(0, gridPos.row - radius); r <= gridPos.row + radius && !found; r++) {
        for (let c = Math.max(0, gridPos.col - radius); c <= gridPos.col + radius && !found; c++) {
          if (!occupied.has(`${r},${c}`)) {
            finalRow = r;
            finalCol = c;
            found = true;
          }
        }
      }
      if (found) break;
    }

    const finalPosition = gridToPosition(finalRow, finalCol);
    
    const newBubble: Bubble = {
      id: shot.id,
      color: shot.color,
      position: finalPosition,
      row: finalRow,
      col: finalCol,
    };

    setBubbles(prev => [...prev, newBubble]);
    
    // Process matches
    setTimeout(() => {
      processMatches(newBubble);
    }, 50);
  }, [bubbles]);

  // Process bubble matches
  const processMatches = useCallback((newBubble: Bubble) => {
    setBubbles(prevBubbles => {
      let toRemove: Bubble[] = [];

      if (activePowerUp) {
        toRemove = applyPowerUp(activePowerUp, newBubble, prevBubbles);
        setPowerUps(prev =>
          prev.map(p =>
            p.type === activePowerUp ? { ...p, count: p.count - 1 } : p
          )
        );
        setActivePowerUp(null);
      } else {
        // Find matching bubbles (flood fill)
        const matches = findMatches(newBubble, prevBubbles);
        if (matches.length >= 3) {
          toRemove = matches;
        }
      }

      if (toRemove.length > 0) {
        // Mark as popping
        const bubblesWithPopping = prevBubbles.map(b =>
          toRemove.find(r => r.id === b.id) ? { ...b, isPopping: true } : b
        );

        // Remove after animation
        setTimeout(() => {
          setBubbles(current => {
            const remaining = current.filter(b => !toRemove.find(r => r.id === b.id));
            
            // Find floating bubbles
            const floating = findFloatingBubbles(remaining);
            const finalBubbles = remaining.filter(b => !floating.find(f => f.id === b.id));
            
            // Update score
            const earnedScore = calculateScore(toRemove.length, floating.length, 1);
            setScore(prev => prev + earnedScore);
            
            // Check win condition
            if (finalBubbles.length === 0) {
              Alert.alert('🎉 Level Complete!', `Score: ${score + earnedScore}`, [
                { text: 'Next Level', onPress: () => navigation.goBack() },
              ]);
            }
            
            return finalBubbles;
          });
        }, 300);

        return bubblesWithPopping;
      }

      return prevBubbles;
    });

    // Prepare next shot
    setCurrentColor(nextColor);
    setNextColor(getRandomBubbleColor(level.colors));
  }, [activePowerUp, nextColor, level.colors, score, navigation]);

  // Find matching bubbles using flood fill
  const findMatches = (targetBubble: Bubble, allBubbles: Bubble[]): Bubble[] => {
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

      // Check neighbors (hexagonal grid)
      const neighbors = getNeighbors(current.row, current.col);
      for (const [nr, nc] of neighbors) {
        const neighbor = allBubbles.find(b => b.row === nr && b.col === nc);
        if (neighbor && !visited.has(`${nr},${nc}`) && neighbor.color === targetBubble.color) {
          queue.push(neighbor);
        }
      }
    }

    return matches;
  };

  // Get hexagonal neighbors
  const getNeighbors = (row: number, col: number): number[][] => {
    const isEvenRow = row % 2 === 0;
    return [
      [row - 1, col - (isEvenRow ? 1 : 0)],
      [row - 1, col + (isEvenRow ? 0 : 1)],
      [row, col - 1],
      [row, col + 1],
      [row + 1, col - (isEvenRow ? 1 : 0)],
      [row + 1, col + (isEvenRow ? 0 : 1)],
    ].filter(([r, c]) => r >= 0 && c >= 0);
  };

  // Find floating bubbles
  const findFloatingBubbles = (bubbles: Bubble[]): Bubble[] => {
    const connected = new Set<string>();
    const queue: Bubble[] = [];

    // Start with top row
    for (const bubble of bubbles) {
      if (bubble.row === 0) {
        queue.push(bubble);
        connected.add(`${bubble.row},${bubble.col}`);
      }
    }

    // BFS to find connected bubbles
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getNeighbors(current.row, current.col);

      for (const [nr, nc] of neighbors) {
        const neighbor = bubbles.find(b => b.row === nr && b.col === nc);
        const key = `${nr},${nc}`;
        
        if (neighbor && !connected.has(key)) {
          connected.add(key);
          queue.push(neighbor);
        }
      }
    }

    return bubbles.filter(b => !connected.has(`${b.row},${b.col}`));
  };

  // Handle touch for aiming and shooting
  const handleTouch = useCallback((event: any) => {
    if (shotBubble) return;

    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - shooterPosition.x;
    const dy = locationY - shooterPosition.y;
    
    // Only allow upward shots
    if (dy >= 0) return;
    
    const angle = Math.atan2(dy, dx);
    const clampedAngle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, angle));
    setShooterAngle(clampedAngle);
  }, [shotBubble, shooterPosition]);

  // Shoot bubble
  const shoot = useCallback(() => {
    if (shotBubble || movesLeft <= 0) return;

    const velocity: Velocity = {
      x: Math.cos(shooterAngle) * SHOT_SPEED,
      y: Math.sin(shooterAngle) * SHOT_SPEED,
    };

    const newShotBubble: ShotBubble = {
      id: Math.random().toString(),
      color: currentColor,
      position: { ...shooterPosition },
      velocity,
      row: -1,
      col: -1,
      isShooting: true,
    };

    setShotBubble(newShotBubble);
    setMovesLeft(prev => prev - 1);
    setTrajectoryPoints([]);
  }, [shotBubble, movesLeft, shooterAngle, currentColor, shooterPosition]);

  // Handle power-up selection
  const handlePowerUpPress = useCallback((type: PowerUpType) => {
    if (activePowerUp === type) {
      setActivePowerUp(null);
    } else {
      const powerUp = powerUps.find(p => p.type === type);
      if (powerUp && powerUp.count > 0) {
        setActivePowerUp(type);
      }
    }
  }, [activePowerUp, powerUps]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1e3c72', '#2a5298', '#7e22ce']}
        style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Exit</Text>
          </TouchableOpacity>

          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>Level {level.id}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
        </View>

        {/* Moves Counter */}
        <View style={styles.movesContainer}>
          <Text style={styles.movesText}>Moves: {movesLeft}</Text>
        </View>

        {/* Game Area */}
        <View 
          style={styles.gameArea}
          onTouchMove={handleTouch}
          onTouchEnd={shoot}>
          
          {/* Grid bubbles */}
          {bubbles.map((bubble) => (
            <View
              key={bubble.id}
              style={[
                styles.bubbleContainer,
                {
                  left: bubble.position.x - BUBBLE_SIZE / 2,
                  top: bubble.position.y - BUBBLE_SIZE / 2,
                },
              ]}>
              <BubbleComponent
                color={bubble.color}
                isPopping={bubble.isPopping}
              />
            </View>
          ))}

          {/* Shot bubble */}
          {shotBubble && (
            <View
              style={[
                styles.bubbleContainer,
                {
                  left: shotBubble.position.x - BUBBLE_SIZE / 2,
                  top: shotBubble.position.y - BUBBLE_SIZE / 2,
                },
              ]}>
              <BubbleComponent color={shotBubble.color} />
            </View>
          )}

          {/* Shooter */}
          <Shooter
            currentBubble={currentColor}
            nextBubble={nextColor}
            angle={shooterAngle}
            trajectoryPoints={trajectoryPoints}
            position={shooterPosition}
            activePowerUp={activePowerUp}
            onAngleChange={setShooterAngle}
          />
        </View>

        {/* Power-ups */}
        <View style={styles.powerUpsContainer}>
          {powerUps.map((powerUp) => (
            <PowerUp
              key={powerUp.type}
              type={powerUp.type}
              count={powerUp.count}
              active={activePowerUp === powerUp.type}
              onPress={() => handlePowerUpPress(powerUp.type)}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  levelInfo: {
    alignItems: 'center',
  },
  levelText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  scoreLabel: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.9,
  },
  scoreValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  movesContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  movesText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  bubbleContainer: {
    position: 'absolute',
  },
  powerUpsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});