import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Text,
  StatusBar,
  GestureResponderEvent,
  Alert,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- CONSTANTS ---
const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 9);
const CANNON_SIZE = 100;
const MAX_ROWS = 15;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const ROW_HEIGHT = BUBBLE_SIZE * 0.86;

interface Bubble {
  id: string;
  x: number;
  y: number;
  color: string;
  row: number;
  col: number;
  visible: boolean;
  scale: Animated.Value;
}

const GameScreen: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [aimDots, setAimDots] = useState<{ x: number; y: number; opacity: number; size: number }[]>([]);

  const bubblesRef = useRef<Bubble[]>([]);
  const isProcessing = useRef(false);
  const cannonPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 120 };

  // Pulse animation for the tracer
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getBubbleCoords = (row: number, col: number) => {
    const xOffset = (row % 2 !== 0) ? BUBBLE_SIZE / 2 : 0;
    const gridPadding = (SCREEN_WIDTH - (8 * BUBBLE_SIZE)) / 2;
    const x = gridPadding + xOffset + (col * BUBBLE_SIZE) + BUBBLE_SIZE / 2;
    const y = row * ROW_HEIGHT + BUBBLE_SIZE / 2 + 70;
    return { x, y };
  };

  const initGame = useCallback(() => {
    const initialBubbles: Bubble[] = [];
    for (let row = 0; row < 6; row++) {
      const bubblesInRow = 8 - row;
      const colStartOffset = Math.floor(row / 2);
      for (let col = 0; col < bubblesInRow; col++) {
        const actualCol = col + colStartOffset;
        const { x, y } = getBubbleCoords(row, actualCol);
        initialBubbles.push({
          id: `b-${row}-${actualCol}`,
          x, y, row, col: actualCol,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          visible: true,
          scale: new Animated.Value(1),
        });
      }
    }
    setBubbles(initialBubbles);
    bubblesRef.current = initialBubbles;
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setScore(0);
    isProcessing.current = false;
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // --- TRACER LOGIC ---
  const updateAim = (pageX: number, pageY: number) => {
    if (isProcessing.current) return;

    const dx = pageX - cannonPos.x;
    const dy = pageY - cannonPos.y;
    if (dy > -40) return;

    const angle = Math.atan2(dy, dx);
    setCannonAngle(angle + Math.PI / 2);

    const dots = [];
    let tempX = cannonPos.x;
    let tempY = cannonPos.y;
    let velX = Math.cos(angle) * 25;
    let velY = Math.sin(angle) * 25;

    // Simulate path for 20 steps to create a beautiful tracer
    for (let i = 0; i < 20; i++) {
      tempX += velX;
      tempY += velY;

      // Wall Bounce in Tracer
      if (tempX < BUBBLE_SIZE / 2 || tempX > SCREEN_WIDTH - BUBBLE_SIZE / 2) {
        velX *= -1;
      }

      // Stop tracer if it hits bubbles
      const hit = bubblesRef.current.some(b => 
        b.visible && Math.sqrt((tempX - b.x)**2 + (tempY - b.y)**2) < BUBBLE_SIZE * 0.9
      );
      
      if (hit || tempY < 60) break;

      // Design: Dots get smaller and more transparent further away
      dots.push({
        x: tempX,
        y: tempY,
        opacity: 1 - (i / 25), 
        size: 8 - (i * 0.2)
      });
    }
    setAimDots(dots);
  };

  const getNeighbors = (row: number, col: number) => {
    const neighbors = [];
    neighbors.push({ r: row, c: col - 1 }, { r: row, c: col + 1 });
    const isEven = row % 2 === 0;
    neighbors.push(
      { r: row - 1, c: col }, { r: row - 1, c: col + (isEven ? -1 : 1) },
      { r: row + 1, c: col }, { r: row + 1, c: col + (isEven ? -1 : 1) }
    );
    return neighbors.filter(n => n.r >= 0 && n.r < MAX_ROWS && n.c >= 0 && n.c < 10);
  };

  const resolveLanding = (shot: any) => {
    let bestSlot = { r: 0, c: 0, dist: Infinity };
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < 10; c++) {
        if (bubblesRef.current.some(b => b.visible && b.row === r && b.col === c)) continue;
        const { x, y } = getBubbleCoords(r, c);
        const dist = Math.sqrt((shot.x - x)**2 + (shot.y - y)**2);
        if (dist < bestSlot.dist) bestSlot = { r, c, dist };
      }
    }

    const { x, y } = getBubbleCoords(bestSlot.r, bestSlot.c);
    const newBubble: Bubble = {
      id: `b-${Date.now()}`,
      x, y, row: bestSlot.r, col: bestSlot.c,
      color: shot.color, visible: true, scale: new Animated.Value(1)
    };

    let newGrid = [...bubblesRef.current, newBubble];
    
    // Match logic
    const matches: Bubble[] = [];
    const stack = [newBubble];
    const visited = new Set();
    while (stack.length > 0) {
      const b = stack.pop()!;
      if (visited.has(b.id)) continue;
      visited.add(b.id);
      if (b.color === shot.color) {
        matches.push(b);
        getNeighbors(b.row, b.col).forEach(n => {
          const nb = newGrid.find(g => g.visible && g.row === n.r && g.col === n.c);
          if (nb) stack.push(nb);
        });
      }
    }

    if (matches.length >= 3) {
      setScore(s => s + matches.length * 10);
      const matchIds = new Set(matches.map(m => m.id));
      
      Animated.parallel(
        matches.map(m => Animated.timing(m.scale, { toValue: 0, duration: 200, useNativeDriver: true }))
      ).start(() => {
        const finalGrid = newGrid.map(b => matchIds.has(b.id) ? { ...b, visible: false } : b);
        bubblesRef.current = finalGrid;
        setBubbles([...finalGrid]);
        if (finalGrid.filter(b => b.visible).length === 0) {
          Alert.alert("Victory!", "Cleared!", [{ text: "Restart", onPress: initGame }]);
        }
      });
    } else {
      bubblesRef.current = newGrid;
      setBubbles(newGrid);
    }

    setShootingBubble(null);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    isProcessing.current = false;
  };

  const onRelease = () => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    const angle = cannonAngle - Math.PI / 2;
    let shot = { x: cannonPos.x, y: cannonPos.y, vx: Math.cos(angle) * 22, vy: Math.sin(angle) * 22, color: nextColor };
    setShootingBubble(shot);
    setAimDots([]);

    const move = setInterval(() => {
      shot.x += shot.vx; shot.y += shot.vy;
      if (shot.x < BUBBLE_SIZE/2 || shot.x > SCREEN_WIDTH - BUBBLE_SIZE/2) shot.vx *= -1;
      setShootingBubble({ ...shot });
      const hit = bubblesRef.current.find(b => b.visible && Math.sqrt((shot.x-b.x)**2 + (shot.y-b.y)**2) < BUBBLE_SIZE * 0.85);
      if (shot.y < 70 || hit) { clearInterval(move); resolveLanding(shot); }
    }, 16);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.gameArea} onStartShouldSetResponder={() => true} 
        onResponderMove={(e) => updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY)} 
        onResponderRelease={onRelease}>
        <Image source={require('../images/bubble -bg.png')} style={styles.bg} />
        <View style={styles.scoreContainer}><Text style={styles.scoreText}>SCORE: {score}</Text></View>

        {bubbles.map(b => b.visible && (
          <Animated.View key={b.id} style={[styles.bubble, { 
            left: b.x - BUBBLE_SIZE/2, top: b.y - BUBBLE_SIZE/2, 
            backgroundColor: b.color, transform: [{ scale: b.scale }] 
          }]}>
            <View style={styles.shine} />
          </Animated.View>
        ))}

        {/* PRO TRACER DESIGN */}
        {aimDots.map((dot, i) => (
          <Animated.View key={i} style={[styles.tracerDot, { 
            left: dot.x - dot.size/2, top: dot.y - dot.size/2, 
            width: dot.size, height: dot.size, borderRadius: dot.size/2,
            opacity: pulseAnim.interpolate({
                inputRange: [0.6, 1],
                outputRange: [dot.opacity * 0.4, dot.opacity]
            })
          }]} />
        ))}

        {shootingBubble && (
          <View style={[styles.bubble, { left: shootingBubble.x - BUBBLE_SIZE/2, top: shootingBubble.y - BUBBLE_SIZE/2, backgroundColor: shootingBubble.color }]} />
        )}

        <View style={styles.footer}>
          <Image source={require('../images/canon2-removebg-preview.png')} style={[styles.cannon, { transform: [{ rotate: `${cannonAngle}rad` }] }]} />
          <View style={styles.nextBox}>
            <View style={[styles.bubble, { position: 'relative', backgroundColor: nextColor }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gameArea: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 1, zIndex: 0 },
  scoreContainer: { position: 'absolute', bottom: 30, left: 8, zIndex: 3,  padding: 12, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  scoreText: { color: '#fff', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
  bubble: { position: 'absolute', width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE/2, borderWidth: 4, borderColor: 'rgba(255,255,255,0.95)', elevation: 10, zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.9, shadowRadius: 6 },
  shine: { width: '35%', height: '35%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15, marginTop: '8%', marginLeft: '8%' },
  tracerDot: { position: 'absolute', backgroundColor: '#fff', zIndex: 1 },
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  cannon: { width: 90, height: 90, resizeMode: 'contain' },
  nextBox: { position: 'absolute', right: 30, bottom: 20 }
});

export default GameScreen;