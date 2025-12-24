// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  PanResponder,
  StatusBar,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BUBBLE_SIZE = 35;
const BUBBLE_SPACING = BUBBLE_SIZE + 2;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
const INITIAL_MOVES = 30;

// Theme configuration
const THEMES = {
  dark: {
    background: '#0a0a0a',
    surface: '#1a1a2e',
    surfaceVariant: '#16213e',
    primary: '#e94560',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#333333',
    success: '#4CAF50',
  },
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f0f0f0',
    primary: '#2196F3',
    text: '#212121',
    textSecondary: '#757575',
    border: '#e0e0e0',
    success: '#4CAF50',
  },
  neon: {
    background: '#0d1117',
    surface: '#161b22',
    surfaceVariant: '#21262d',
    primary: '#00d4aa',
    text: '#f0f6fc',
    textSecondary: '#8b949e',
    border: '#30363d',
    success: '#00d4aa',
  },
};

type ThemeType = keyof typeof THEMES;

type Bubble = {
  id: string;
  color: string;
  row: number;
  col: number;
  x: number;
  y: number;
};

type Pattern = 'hexagonal' | 'pyramid' | 'star' | 'circle' | 'diamond' | 'spiral' | 'heart' | 'flower';

const App = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [shooterBubble, setShooterBubble] = useState<string>(COLORS[0]);
  const [nextBubble, setNextBubble] = useState<string>(COLORS[1]);
  const [angle, setAngle] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [pattern, setPattern] = useState<Pattern>('hexagonal');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [tracerPath, setTracerPath] = useState<{x: number, y: number}[]>([]);
  const [isShooting, setIsShooting] = useState(false);
  const [shootingBubble, setShootingBubble] = useState<{x: number, y: number, color: string} | null>(null);
  
  const theme = THEMES[currentTheme];
  const shooterPos = { x: width / 2, y: height - 100 };

  useEffect(() => {
    initializeGame();
  }, [pattern]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score]);

  const calculateTracerPath = (shootAngle: number): {x: number, y: number}[] => {
    const path: {x: number, y: number}[] = [];
    const radians = (shootAngle * Math.PI) / 180;
    let dirX = Math.sin(radians);
    let dirY = -Math.cos(radians);
    
    let x = shooterPos.x;
    let y = shooterPos.y;
    const step = 15;
    let bounces = 0;
    
    while (y > 50 && bounces <= 2 && path.length < 40) {
      x += dirX * step;
      y += dirY * step;
      
      if (x <= BUBBLE_SIZE / 2) {
        x = BUBBLE_SIZE / 2;
        dirX = Math.abs(dirX);
        bounces++;
      } else if (x >= width - BUBBLE_SIZE / 2) {
        x = width - BUBBLE_SIZE / 2;
        dirX = -Math.abs(dirX);
        bounces++;
      }
      
      const hitBubble = bubbles.find(b => 
        Math.sqrt(Math.pow(x - (b.x + BUBBLE_SIZE / 2), 2) + Math.pow(y - (b.y + BUBBLE_SIZE / 2), 2)) < BUBBLE_SIZE * 0.7
      );
      
      if (hitBubble) break;
      
      path.push({ x, y });
    }
    
    return path;
  };

  useEffect(() => {
    if (!isShooting) {
      setTracerPath(calculateTracerPath(angle));
    }
  }, [angle, bubbles, isShooting]);

  const getRandomColor = () => {
    const existingColors = bubbles.map(b => b.color);
    const uniqueColors = [...new Set(existingColors)];
    if (uniqueColors.length > 0) {
      return uniqueColors[Math.floor(Math.random() * uniqueColors.length)];
    }
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const createHexagonalPattern = (rows: number): Bubble[] => {
    const bubbles: Bubble[] = [];
    const cols = 7;
    let id = 0;
    const startX = (width - (cols * BUBBLE_SPACING)) / 2;

    for (let row = 0; row < rows; row++) {
      const colCount = row % 2 === 0 ? cols : cols - 1;
      const offsetX = row % 2 === 0 ? 0 : BUBBLE_SPACING / 2;

      for (let col = 0; col < colCount; col++) {
        const x = startX + col * BUBBLE_SPACING + offsetX;
        const y = row * BUBBLE_SPACING * 0.866 + 60;
        
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row,
          col,
          x,
          y,
        });
      }
    }
    return bubbles;
  };

  const createPyramidPattern = (rows: number): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;

    for (let row = 0; row < rows; row++) {
      const colCount = rows - row;
      const offsetX = (width - colCount * BUBBLE_SPACING) / 2;

      for (let col = 0; col < colCount; col++) {
        const x = col * BUBBLE_SPACING + offsetX;
        const y = row * BUBBLE_SPACING * 0.866 + 60;
        
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row,
          col,
          x,
          y,
        });
      }
    }
    return bubbles;
  };

  const createStarPattern = (): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;
    const centerX = width / 2 - BUBBLE_SIZE / 2;
    const centerY = 180;
    const points = 5;
    const outerRadius = BUBBLE_SIZE * 3.5;
    const innerRadius = BUBBLE_SIZE * 1.7;
    
    bubbles.push({
      id: `bubble-${id++}`,
      color: getRandomColor(),
      row: 0,
      col: 0,
      x: centerX,
      y: centerY,
    });
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 2 * Math.PI) / points - Math.PI / 2;
      
      const outerX = centerX + Math.cos(angle) * outerRadius;
      const outerY = centerY + Math.sin(angle) * outerRadius;
      bubbles.push({
        id: `bubble-${id++}`,
        color: getRandomColor(),
        row: 1,
        col: i,
        x: outerX,
        y: outerY,
      });
      
      const midAngle = angle + Math.PI / points;
      const midX = centerX + Math.cos(midAngle) * innerRadius;
      const midY = centerY + Math.sin(midAngle) * innerRadius;
      bubbles.push({
        id: `bubble-${id++}`,
        color: getRandomColor(),
        row: 2,
        col: i,
        x: midX,
        y: midY,
      });
      
      const innerAngle = angle;
      const innerMidRadius = (outerRadius + innerRadius) / 2;
      const innerMidX = centerX + Math.cos(innerAngle) * innerMidRadius;
      const innerMidY = centerY + Math.sin(innerAngle) * innerMidRadius;
      bubbles.push({
        id: `bubble-${id++}`,
        color: getRandomColor(),
        row: 3,
        col: i,
        x: innerMidX,
        y: innerMidY,
      });
    }
    
    return bubbles;
  };

  const createCirclePattern = (): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;
    const centerX = width / 2 - BUBBLE_SIZE / 2;
    const centerY = 200;
    
    bubbles.push({
      id: `bubble-${id++}`,
      color: getRandomColor(),
      row: 0,
      col: 0,
      x: centerX,
      y: centerY,
    });
    
    const rings = [
      { radius: BUBBLE_SIZE * 1.2, count: 6 },
      { radius: BUBBLE_SIZE * 2.4, count: 12 },
      { radius: BUBBLE_SIZE * 3.6, count: 18 },
    ];
    
    rings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i * 2 * Math.PI) / ring.count;
        const x = centerX + Math.cos(angle) * ring.radius;
        const y = centerY + Math.sin(angle) * ring.radius;
        
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row: ringIndex + 1,
          col: i,
          x,
          y,
        });
      }
    });
    
    return bubbles;
  };

  const createDiamondPattern = (): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;
    const centerX = width / 2;
    const startY = 80;
    const size = 5;
    
    for (let row = 0; row < size * 2 - 1; row++) {
      let colCount = row < size ? row + 1 : size * 2 - 1 - row;
      const offsetX = centerX - (colCount * BUBBLE_SPACING) / 2;
      const y = startY + row * BUBBLE_SPACING * 0.866;
      
      for (let col = 0; col < colCount; col++) {
        const x = offsetX + col * BUBBLE_SPACING;
        
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row,
          col,
          x,
          y,
        });
      }
    }
    
    return bubbles;
  };

  const createSpiralPattern = (): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;
    const centerX = width / 2 - BUBBLE_SIZE / 2;
    const centerY = 200;
    
    let angle = 0;
    let radius = 0;
    const angleStep = 0.4;
    const radiusStep = BUBBLE_SIZE * 0.15;
    
    for (let i = 0; i < 45; i++) {
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (x >= 0 && x <= width - BUBBLE_SIZE && y >= 50 && y <= height - 200) {
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row: Math.floor(i / 10),
          col: i % 10,
          x,
          y,
        });
      }
      
      angle += angleStep;
      radius += radiusStep;
    }
    
    return bubbles;
  };

  const createHeartPattern = (): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;
    const centerX = width / 2;
    const centerY = 220;
    const scale = BUBBLE_SIZE * 0.38;
    
    const heartPoints: {x: number, y: number}[] = [];
    
    for (let t = 0; t <= 2 * Math.PI; t += 0.15) {
      const x = scale * 16 * Math.pow(Math.sin(t), 3);
      const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      heartPoints.push({ x: centerX + x, y: centerY + y });
    }
    
    const minDistance = BUBBLE_SIZE * 0.85;
    const filteredPoints: {x: number, y: number}[] = [heartPoints[0]];
    
    heartPoints.forEach(point => {
      const lastPoint = filteredPoints[filteredPoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
      );
      if (distance >= minDistance) {
        filteredPoints.push(point);
      }
    });
    
    filteredPoints.forEach((point, index) => {
      if (point.y >= 60 && point.y <= height - 200) {
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row: Math.floor(index / 8),
          col: index % 8,
          x: point.x - BUBBLE_SIZE / 2,
          y: point.y - BUBBLE_SIZE / 2,
        });
      }
    });
    
    return bubbles;
  };

  const createFlowerPattern = (): Bubble[] => {
    const bubbles: Bubble[] = [];
    let id = 0;
    const centerX = width / 2 - BUBBLE_SIZE / 2;
    const centerY = 200;
    const petals = 6;
    
    bubbles.push({
      id: `bubble-${id++}`,
      color: getRandomColor(),
      row: 0,
      col: 0,
      x: centerX,
      y: centerY,
    });
    
    for (let petal = 0; petal < petals; petal++) {
      const petalAngle = (petal * 2 * Math.PI) / petals;
      
      for (let distance = 1; distance <= 3; distance++) {
        const radius = distance * BUBBLE_SIZE * 1.2;
        const x = centerX + Math.cos(petalAngle) * radius;
        const y = centerY + Math.sin(petalAngle) * radius;
        
        bubbles.push({
          id: `bubble-${id++}`,
          color: getRandomColor(),
          row: petal + 1,
          col: distance,
          x,
          y,
        });
        
        if (distance === 2) {
          const sideOffset = Math.PI / 10;
          const sideRadius = radius * 0.75;
          
          const sideX1 = centerX + Math.cos(petalAngle + sideOffset) * sideRadius;
          const sideY1 = centerY + Math.sin(petalAngle + sideOffset) * sideRadius;
          const sideX2 = centerX + Math.cos(petalAngle - sideOffset) * sideRadius;
          const sideY2 = centerY + Math.sin(petalAngle - sideOffset) * sideRadius;
          
          bubbles.push({
            id: `bubble-${id++}`,
            color: getRandomColor(),
            row: petal + 7,
            col: distance,
            x: sideX1,
            y: sideY1,
          });
          
          bubbles.push({
            id: `bubble-${id++}`,
            color: getRandomColor(),
            row: petal + 13,
            col: distance,
            x: sideX2,
            y: sideY2,
          });
        }
      }
    }
    
    return bubbles;
  };

  const initializeGame = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      let initialBubbles: Bubble[];
      
      switch (pattern) {
        case 'pyramid':
          initialBubbles = createPyramidPattern(6);
          break;
        case 'star':
          initialBubbles = createStarPattern();
          break;
        case 'circle':
          initialBubbles = createCirclePattern();
          break;
        case 'diamond':
          initialBubbles = createDiamondPattern();
          break;
        case 'spiral':
          initialBubbles = createSpiralPattern();
          break;
        case 'heart':
          initialBubbles = createHeartPattern();
          break;
        case 'flower':
          initialBubbles = createFlowerPattern();
          break;
        default:
          initialBubbles = createHexagonalPattern(6);
      }

      setBubbles(initialBubbles);
      setShooterBubble(getRandomColor());
      setNextBubble(getRandomColor());
      setMoves(INITIAL_MOVES);
      setScore(0);
      setGameOver(false);
      setIsLoading(false);
      setShootingBubble(null);
    }, 300);
  };

  const findNearestGridPosition = (x: number, y: number) => {
    let nearest = { row: -1, col: -1, x: 0, y: 0, distance: Infinity };
    const cols = 7;
    const startX = (width - (cols * BUBBLE_SPACING)) / 2;

    for (let row = 0; row < 20; row++) {
      const colCount = row % 2 === 0 ? cols : cols - 1;
      const offsetX = row % 2 === 0 ? 0 : BUBBLE_SPACING / 2;

      for (let col = 0; col < colCount; col++) {
        const posX = startX + col * BUBBLE_SPACING + offsetX;
        const posY = row * BUBBLE_SPACING * 0.866 + 60;
        const distance = Math.sqrt(Math.pow(x - (posX + BUBBLE_SIZE / 2), 2) + Math.pow(y - (posY + BUBBLE_SIZE / 2), 2));

        if (distance < nearest.distance) {
          const occupied = bubbles.some(b => Math.abs(b.x - posX) < 5 && Math.abs(b.y - posY) < 5);
          if (!occupied) {
            nearest = { row, col, x: posX, y: posY, distance };
          }
        }
      }
    }

    return nearest;
  };

  const findConnectedBubbles = (targetBubble: Bubble, color: string): Bubble[] => {
    const connected: Bubble[] = [];
    const visited = new Set<string>();
    const queue: Bubble[] = [targetBubble];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = current.id;

      if (visited.has(key)) continue;
      visited.add(key);

      if (current.color === color) {
        connected.push(current);
        const neighbors = getNeighbors(current);
        queue.push(...neighbors.filter(n => !visited.has(n.id)));
      }
    }

    return connected;
  };

  const getNeighbors = (bubble: Bubble): Bubble[] => {
    const neighbors: Bubble[] = [];
    const searchRadius = BUBBLE_SIZE * 1.3;

    bubbles.forEach(b => {
      if (b.id !== bubble.id) {
        const distance = Math.sqrt(
          Math.pow(b.x - bubble.x, 2) + Math.pow(b.y - bubble.y, 2)
        );
        if (distance < searchRadius) {
          neighbors.push(b);
        }
      }
    });

    return neighbors;
  };

  const removeFloatingBubbles = (currentBubbles: Bubble[]): Bubble[] => {
    const connected = new Set<string>();
    const queue: Bubble[] = [];

    currentBubbles.filter(b => b.row === 0 || b.y < 80).forEach(bubble => {
      queue.push(bubble);
      connected.add(bubble.id);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getNeighborsFromBubbles(current, currentBubbles);
      
      neighbors.forEach(neighbor => {
        if (!connected.has(neighbor.id)) {
          connected.add(neighbor.id);
          queue.push(neighbor);
        }
      });
    }

    return currentBubbles.filter(b => connected.has(b.id));
  };

  const getNeighborsFromBubbles = (bubble: Bubble, bubbleList: Bubble[]): Bubble[] => {
    const neighbors: Bubble[] = [];
    const searchRadius = BUBBLE_SIZE * 1.3;

    bubbleList.forEach(b => {
      if (b.id !== bubble.id) {
        const distance = Math.sqrt(
          Math.pow(b.x - bubble.x, 2) + Math.pow(b.y - bubble.y, 2)
        );
        if (distance < searchRadius) {
          neighbors.push(b);
        }
      }
    });

    return neighbors;
  };

  const shoot = () => {
    if (gameOver || isLoading || isShooting) return;

    setIsShooting(true);
    setTracerPath([]);

    const radians = (angle * Math.PI) / 180;
    let dirX = Math.sin(radians);
    let dirY = -Math.cos(radians);

    let x = shooterPos.x;
    let y = shooterPos.y;
    const step = 15;
    let bounces = 0;

    const animationInterval = setInterval(() => {
      x += dirX * step;
      y += dirY * step;

      if (x <= BUBBLE_SIZE / 2) {
        x = BUBBLE_SIZE / 2;
        dirX = Math.abs(dirX);
        bounces++;
      } else if (x >= width - BUBBLE_SIZE / 2) {
        x = width - BUBBLE_SIZE / 2;
        dirX = -Math.abs(dirX);
        bounces++;
      }

      setShootingBubble({ x: x - BUBBLE_SIZE / 2, y: y - BUBBLE_SIZE / 2, color: shooterBubble });

      const hitBubble = bubbles.find(b => 
        Math.sqrt(Math.pow(x - (b.x + BUBBLE_SIZE / 2), 2) + Math.pow(y - (b.y + BUBBLE_SIZE / 2), 2)) < BUBBLE_SIZE * 0.8
      );

      if (hitBubble || y <= 60 || bounces > 2) {
        clearInterval(animationInterval);
        setIsShooting(false);
        setShootingBubble(null);
        
        const nearest = findNearestGridPosition(x, y);
        
        if (nearest.row >= 0) {
          const newBubble: Bubble = {
            id: `bubble-${Date.now()}`,
            color: shooterBubble,
            row: nearest.row,
            col: nearest.col,
            x: nearest.x,
            y: nearest.y,
          };

          const updatedBubbles = [...bubbles, newBubble];
          const connected = findConnectedBubbles(newBubble, shooterBubble);

          if (connected.length >= 3) {
            const remainingBubbles = updatedBubbles.filter(
              b => !connected.some(c => c.id === b.id)
            );
            
            const finalBubbles = removeFloatingBubbles(remainingBubbles);
            setBubbles(finalBubbles);
            
            const totalRemoved = updatedBubbles.length - finalBubbles.length;
            const bonus = connected.length >= 5 ? 50 : 0;
            setScore(prev => prev + totalRemoved * 10 + bonus);
            
            if (finalBubbles.length === 0) {
              setScore(prev => prev + 200);
              setGameOver(true);
            }
          } else {
            setBubbles(updatedBubbles);
          }

          setShooterBubble(nextBubble);
          setNextBubble(getRandomColor());
          
          const newMoves = moves - 1;
          setMoves(newMoves);
          
          if (newMoves <= 0 && bubbles.length > 0) {
            setGameOver(true);
          }
        }
      }
    }, 16);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isShooting,
      onMoveShouldSetPanResponder: () => !isShooting,
      onPanResponderMove: (_, gestureState) => {
        if (isShooting) return;
        const dx = gestureState.moveX - shooterPos.x;
        const dy = gestureState.moveY - shooterPos.y;
        let newAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
        newAngle = Math.max(-70, Math.min(70, newAngle));
        setAngle(newAngle);
      },
      onPanResponderRelease: () => {
        if (!isShooting) shoot();
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={currentTheme === 'light' ? 'dark-content' : 'light-content'} 
        backgroundColor={theme.surface} 
      />
      
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.headerText, { color: theme.text }]}>Score: {score}</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>Best: {highScore}</Text>
        </View>
        <Text style={[styles.headerText, { color: theme.text }]}>Moves: {moves}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.patternScrollView}
          contentContainerStyle={styles.patternButtons}
        >
          {(['hexagonal', 'pyramid', 'star', 'circle', 'diamond', 'spiral', 'heart', 'flower'] as Pattern[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.patternBtn, 
                { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
                pattern === p && { backgroundColor: theme.primary }
              ]}
              onPress={() => setPattern(p)}
            >
              <Text style={[styles.patternText, { color: theme.text }]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.themeButtons}>
          <TouchableOpacity
            style={[
              styles.themeBtn, 
              { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
              currentTheme === 'dark' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setCurrentTheme('dark')}
          >
            <Text style={styles.themeBtnText}>🌙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeBtn, 
              { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
              currentTheme === 'light' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setCurrentTheme('light')}
          >
            <Text style={styles.themeBtnText}>☀️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeBtn, 
              { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
              currentTheme === 'neon' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setCurrentTheme('neon')}
          >
            <Text style={styles.themeBtnText}>⚡</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {bubbles.map(bubble => (
          <View
            key={bubble.id}
            style={[
              styles.bubble,
              {
                backgroundColor: bubble.color,
                left: bubble.x,
                top: bubble.y,
                borderColor: theme.border,
              },
            ]}
          />
        ))}

        {shootingBubble && (
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: shootingBubble.color,
                left: shootingBubble.x,
                top: shootingBubble.y,
                borderColor: theme.text,
              },
            ]}
          />
        )}

        {!isShooting && tracerPath.map((point, index) => (
          <View
            key={`tracer-${index}`}
            style={[
              styles.tracerDot,
              {
                left: point.x - 2,
                top: point.y - 2,
                backgroundColor: theme.primary,
                opacity: Math.max(0.2, 1 - (index * 0.03)),
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.aimLine,
            {
              left: shooterPos.x - 1,
              top: shooterPos.y - 120,
              transform: [{ rotate: `${angle}deg` }],
              backgroundColor: `${theme.primary}40`,
            },
          ]}
        />

        <View
          style={[
            styles.shooter,
            { 
              backgroundColor: shooterBubble, 
              left: shooterPos.x - BUBBLE_SIZE / 2,
              borderColor: theme.text,
            },
          ]}
        />

        <View
          style={[
            styles.nextBubble,
            { 
              backgroundColor: nextBubble, 
              left: shooterPos.x + BUBBLE_SIZE * 0.8,
              borderColor: theme.text,
            },
          ]}
        />
      </View>

      {gameOver && (
        <View style={[styles.gameOverModal, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
          <Text style={[styles.gameOverText, { color: theme.text }]}>
            {bubbles.length === 0 ? '🎉 Victory! 🎉' : 'Game Over!'}
          </Text>
          <Text style={[styles.finalScore, { color: theme.textSecondary }]}>Final Score: {score}</Text>
          {score === highScore && score > 0 && (
            <Text style={[styles.newRecord, { color: theme.success }]}>✨ New High Score! ✨</Text>
          )}
          <TouchableOpacity 
            style={[styles.restartBtn, { backgroundColor: theme.primary }]} 
            onPress={initializeGame}
          >
            <Text style={[styles.restartText, { color: '#fff' }]}>
              {bubbles.length === 0 ? 'Play Again' : 'Restart'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: `${theme.background}DD` }]}>
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading Pattern...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scoreContainer: {
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    marginTop: 2,
  },
  controlsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  patternScrollView: {
    marginBottom: 10,
  },
  patternButtons: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    gap: 8,
  },
  patternBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  patternText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  themeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  themeBtnText: {
    fontSize: 18,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  tracerDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  shooter: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    bottom: 80,
    borderWidth: 3,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  nextBubble: {
    position: 'absolute',
    width: BUBBLE_SIZE * 0.65,
    height: BUBBLE_SIZE * 0.65,
    borderRadius: (BUBBLE_SIZE * 0.65) / 2,
    bottom: 87,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  aimLine: {
    position: 'absolute',
    width: 2,
    height: 120,
    borderRadius: 1,
  },
  gameOverModal: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  newRecord: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  restartBtn: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  restartText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default App;