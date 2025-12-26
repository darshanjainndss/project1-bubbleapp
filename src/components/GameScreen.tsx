import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, StyleSheet, Dimensions, Image, Text, StatusBar, Animated, TouchableOpacity,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 9);
const ROW_HEIGHT = BUBBLE_SIZE * 0.86;
const GRID_COLS = 8;
const CANNON_SIZE = 160;
const FOOTER_BOTTOM = 30;
const GRID_TOP = 60;
const COLORS = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#007AFF"];

const GameScreen = ({ onBackPress }: { onBackPress?: () => void }) => {
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [aimDots, setAimDots] = useState<any[]>([]);

  const scrollY = useRef(new Animated.Value(-350)).current; 
  const currentScrollY = useRef(-350);
  const bubblesRef = useRef<any[]>([]);
  const isProcessing = useRef(false);
  const rafRef = useRef<number | null>(null);

  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;

  const cannonPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - FOOTER_BOTTOM - CANNON_SIZE / 2 };

  const getRowPadding = (row: number) => {
    const rowWidthCount = (row < 8) ? (row + 1) : (16 - row);
    return (SCREEN_WIDTH - (rowWidthCount * BUBBLE_SIZE)) / 2;
  };

  const getPos = (row: number, col: number) => {
    const sidePadding = getRowPadding(row);
    return {
      x: sidePadding + (col * BUBBLE_SIZE) + BUBBLE_SIZE / 2,
      y: row * ROW_HEIGHT + BUBBLE_SIZE / 2 + GRID_TOP
    };
  };

  const initGame = useCallback(() => {
    const grid: any[] = [];
    for (let r = 0; r < 16; r++) {
      const rowWidth = (r < 8) ? (r + 1) : (16 - r);
      for (let c = 0; c < rowWidth; c++) {
        const { x, y } = getPos(r, c);
        grid.push({
          id: `b-${r}-${c}`, row: r, col: c, x, y,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          visible: true
        });
      }
    }
    bubblesRef.current = grid;
    setBubbles(grid);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const updateAim = (pageX: number, pageY: number) => {
    if (isProcessing.current) return;
    const dx = pageX - cannonPos.x;
    const dy = pageY - cannonPos.y;
    if (dy > -20) return;
    const angle = Math.atan2(dy, dx);
    setCannonAngle(angle + Math.PI / 2);

    const dots = [];
    let tx = cannonPos.x; let ty = cannonPos.y;
    let vx = Math.cos(angle) * 30; let vy = Math.sin(angle) * 30;

    for (let i = 0; i < 15; i++) {
      tx += vx; ty += vy;
      if (tx < BUBBLE_SIZE/2 || tx > SCREEN_WIDTH - BUBBLE_SIZE/2) vx *= -1;
      const hit = bubblesRef.current.some(b => b.visible && Math.sqrt((tx - b.x)**2 + (ty - (b.y + currentScrollY.current))**2) < BUBBLE_SIZE * 0.8);
      if (hit || ty < GRID_TOP) break;
      dots.push({ x: tx, y: ty, opacity: 1 - i / 15 });
    }
    setAimDots(dots);
  };

  const onRelease = () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    muzzleFlashAnim.setValue(1);
    Animated.timing(muzzleFlashAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(recoilAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(recoilAnim, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start();

    const angle = cannonAngle - Math.PI / 2;
    const shot = { x: cannonPos.x, y: cannonPos.y, vx: Math.cos(angle) * 26, vy: Math.sin(angle) * 26, color: nextColor };

    const step = () => {
      shot.x += shot.vx; shot.y += shot.vy;
      if (shot.x < BUBBLE_SIZE/2 || shot.x > SCREEN_WIDTH - BUBBLE_SIZE/2) shot.vx *= -1;

      const hit = bubblesRef.current.find(b => b.visible && Math.sqrt((shot.x - b.x)**2 + (shot.y - (b.y + currentScrollY.current))**2) < BUBBLE_SIZE * 0.82);

      if (shot.y < GRID_TOP || hit) {
        cancelAnimationFrame(rafRef.current!);
        resolveLanding(shot);
      } else {
        setShootingBubble({...shot});
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const resolveLanding = (shot: any) => {
    let best = { r: 0, c: 0, dist: Infinity };
    for (let r = 0; r < 28; r++) {
      const rowWidth = (r < 8) ? (r + 1) : (16 - r);
      for (let c = -1; c <= rowWidth; c++) {
        if (bubblesRef.current.some(b => b.visible && b.row === r && b.col === c)) continue;
        const coords = getPos(r, c);
        const d = Math.sqrt((shot.x - coords.x)**2 + (shot.y - (coords.y + currentScrollY.current))**2);
        if (d < best.dist) best = { r, c, dist: d };
      }
    }

    const { x, y } = getPos(best.r, best.c);
    const newB = { id: `b-${Date.now()}`, row: best.r, col: best.c, x, y, color: shot.color, visible: true };
    const grid = [...bubblesRef.current, newB];

    // 1. FIND MATCHES
    const match = [newB];
    const stack = [newB];
    const visited = new Set([newB.id]);
    while(stack.length > 0) {
      const b = stack.pop()!;
      const neighbors = grid.filter(g => g.visible && !visited.has(g.id) && g.color === newB.color && Math.sqrt((b.x - g.x)**2 + (b.y - g.y)**2) < BUBBLE_SIZE * 1.2);
      neighbors.forEach(n => { visited.add(n.id); match.push(n); stack.push(n); });
    }

    if (match.length >= 3) {
      match.forEach(m => m.visible = false);
      setScore(s => s + match.length * 10);

      // 2. FLOATING LOGIC: Check what is still connected to the Top Row (Row 0)
      const connected = new Set();
      const topRowBubbles = grid.filter(b => b.visible && b.row === 0);
      const cStack = [...topRowBubbles];
      topRowBubbles.forEach(b => connected.add(b.id));

      while(cStack.length > 0) {
        const curr = cStack.pop()!;
        const neighbors = grid.filter(g => g.visible && !connected.has(g.id) && Math.sqrt((curr.x - g.x)**2 + (curr.y - g.y)**2) < BUBBLE_SIZE * 1.2);
        neighbors.forEach(n => {
          connected.add(n.id);
          cStack.push(n);
        });
      }

      // Any bubble that is visible but NOT in the connected set must fall
      grid.forEach(b => {
        if (b.visible && !connected.has(b.id)) {
          b.visible = false; // They "fall" by disappearing
          setScore(s => s + 5); 
        }
      });
      
      // Force grid to move down
      currentScrollY.current += ROW_HEIGHT;
      Animated.spring(scrollY, { toValue: currentScrollY.current, tension: 40, friction: 7, useNativeDriver: true }).start();
    }

    bubblesRef.current = grid;
    setBubbles([...grid]);
    setShootingBubble(null);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    isProcessing.current = false;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Score and Next on Bottom Left */}
      <View style={styles.bottomLeftContainer}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.nextContainer}>
          <Text style={styles.nextLabel}>NEXT</Text>
          <View style={[styles.nextPreview, {backgroundColor: nextColor}]}/>
        </View>
      </View>

      <View style={styles.gameArea} onStartShouldSetResponder={() => true}
        onResponderMove={(e) => updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onResponderRelease={onRelease}>
        <Image source={require("../images/bubble -bg.png")} style={styles.bg} />
        
        <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
          {bubbles.map(b => b.visible && (
            <View key={b.id} style={[styles.bubble, { left: b.x - BUBBLE_SIZE/2, top: b.y - BUBBLE_SIZE/2, backgroundColor: b.color }]}>
              <View style={styles.shine} />
            </View>
          ))}
        </Animated.View>

        {aimDots.map((d, i) => <View key={i} style={[styles.dot, { left: d.x-4, top: d.y-4, opacity: d.opacity }]} />)}
        {shootingBubble && <View style={[styles.bubble, { left: shootingBubble.x-BUBBLE_SIZE/2, top: shootingBubble.y-BUBBLE_SIZE/2, backgroundColor: shootingBubble.color }]} />}

        <View style={styles.footer}>
          <Animated.View style={[styles.flash, { opacity: muzzleFlashAnim }]} />
          <Animated.Image 
            source={require("../images/robot-removebg-preview.png")} 
            style={[styles.cannon, { transform: [{ rotate: `${cannonAngle}rad` }, { translateY: recoilAnim }] }]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  
  // Back Button
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Bottom Left Score and Next
  bottomLeftContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    zIndex: 10,
  },
  scoreContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
  },
  nextContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
  },
  scoreLabel: { 
    color: '#888', 
    fontSize: 10, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreValue: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900',
    textAlign: 'center',
  },
  nextLabel: { 
    color: '#888', 
    fontSize: 10, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextPreview: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    marginTop: 5, 
    borderWidth: 1, 
    borderColor: '#fff',
  },

  gameArea: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  bubble: { position: "absolute", width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE/2, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  shine: { position: "absolute", top: "15%", left: "15%", width: "25%", height: "25%", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 10 },
  dot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  footer: { position: "absolute", bottom: 40, width: "100%", alignItems: "center" },
  cannon: { width: 150, height: 150, resizeMode: "contain" },
  flash: { position: 'absolute', bottom: 100, width: 60, height: 60, backgroundColor: '#fff', borderRadius: 30 }
});

export default GameScreen;