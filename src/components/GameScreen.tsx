import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, StyleSheet, Dimensions, Image, Text, StatusBar, Animated, TouchableOpacity,
} from "react-native";

import { getLevelPattern, COLORS } from "../data/levelPatterns";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 10); // Standardize size for 10-column capacity safety
const ROW_HEIGHT = BUBBLE_SIZE * 0.86;
const GRID_COLS = 9;
const CANNON_SIZE = 160;
const FOOTER_BOTTOM = 30;
const GRID_TOP = 60;

const GameScreen = ({ onBackPress, level = 1 }: { onBackPress?: () => void, level?: number }) => {
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [fallingBubbles, setFallingBubbles] = useState<any[]>([]);
  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [aimDots, setAimDots] = useState<any[]>([]);
  const [targetSlot, setTargetSlot] = useState<{ x: number, y: number } | null>(null);
  const scrollY = useRef(new Animated.Value(-100)).current;
  const currentScrollY = useRef(-100);
  const bubblesRef = useRef<any[]>([]);
  const fallingRef = useRef<any[]>([]);
  const isProcessing = useRef(false);
  const rafRef = useRef<number | null>(null);
  const fallingRafRef = useRef<number | null>(null);

  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;

  const cannonPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - FOOTER_BOTTOM - CANNON_SIZE / 2 };

  const getPos = (row: number, col: number) => {
    const rowWidth = (row % 2 === 0) ? 9 : 8;
    const sidePadding = (SCREEN_WIDTH - (rowWidth * BUBBLE_SIZE)) / 2;
    return {
      x: sidePadding + (col * BUBBLE_SIZE) + BUBBLE_SIZE / 2,
      y: row * ROW_HEIGHT + BUBBLE_SIZE / 2 + GRID_TOP
    };
  };

  const initGame = useCallback(() => {
    const grid: any[] = [];
    const pattern = getLevelPattern(level);
    const patternHeight = pattern.length;
    let startRow = Math.floor((19 - patternHeight) / 2);
    if (startRow % 2 !== 0) startRow--;
    startRow = Math.max(0, startRow);

    // 1. Map out which cells are "pattern" vs "empty"
    const distMap: number[][] = Array.from({ length: 35 }, () => Array(9).fill(Infinity));
    const queue: [number, number][] = [];

    for (let r = 0; r < 19; r++) {
      const rowWidth = (r % 2 === 0) ? 9 : 8;
      const patternRow = (r >= startRow && r < startRow + patternHeight) ? pattern[r - startRow] : "";
      for (let c = 0; c < rowWidth; c++) {
        const char = patternRow[c] || ' ';
        if (char === '1' || char === 'O' || char === 'B') {
          distMap[r][c] = 0;
          queue.push([r, c]);
        }
      }
    }

    // 2. BFS to find distance layers from the pattern border
    const neighbors = (r: number, c: number) => {
      const res = [[r, c - 1], [r, c + 1]];
      if (r % 2 === 0) {
        res.push([r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]);
      } else {
        res.push([r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]);
      }
      return res;
    };

    let head = 0;
    while (head < queue.length) {
      const [r, c] = queue[head++];
      const d = distMap[r][c];
      for (const [nr, nc] of neighbors(r, c)) {
        if (nr >= 0 && nr < 19) {
          const nWidth = (nr % 2 === 0) ? 9 : 8;
          if (nc >= 0 && nc < nWidth && distMap[nr][nc] === Infinity) {
            distMap[nr][nc] = d + 1;
            queue.push([nr, nc]);
          }
        }
      }
    }

    // 3. Build the grid using distances for color layers
    const bgColors = COLORS.filter(c => c !== "#A259FF");
    for (let r = 0; r < 19; r++) {
      const rowWidth = (r % 2 === 0) ? 9 : 8;
      for (let c = 0; c < rowWidth; c++) {
        const d = distMap[r][c];
        const { x, y } = getPos(r, c);

        let color = "#A259FF"; // Default pattern color
        if (d > 0) {
          // Cycle through background colors for each contour layer
          color = bgColors[(d - 1) % bgColors.length];
        }

        grid.push({
          id: `b-${r}-${c}-${Date.now()}`,
          row: r, col: c, x, y,
          color,
          visible: true
        });
      }
    }

    const initialScroll = -10 * ROW_HEIGHT;
    currentScrollY.current = initialScroll;
    scrollY.setValue(initialScroll);
    bubblesRef.current = grid;
    setBubbles(grid);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setScore(0);
  }, [level, scrollY]);

  useEffect(() => { initGame(); }, [initGame]);

  // Falling Animation Loop
  useEffect(() => {
    let lastTime = 0;
    const animateFalling = (time: number) => {
      const dt = lastTime ? (time - lastTime) / 16.67 : 1;
      lastTime = time;
      if (fallingRef.current.length > 0) {
        const next = fallingRef.current
          .map(b => ({
            ...b,
            x: b.x + (b.vx || 0) * dt,
            y: b.y + (b.vy || 0) * dt,
            vy: (b.vy || 0) + 0.8 * dt,
          }))
          .filter(b => b.y < SCREEN_HEIGHT + BUBBLE_SIZE);

        fallingRef.current = next;
        setFallingBubbles(next);
      }
      fallingRafRef.current = requestAnimationFrame(animateFalling);
    };
    fallingRafRef.current = requestAnimationFrame(animateFalling);
    return () => cancelAnimationFrame(fallingRafRef.current!);
  }, []);

  const updateAim = (pageX: number, pageY: number) => {
    if (isProcessing.current) return;
    const dx = pageX - cannonPos.x;
    const dy = pageY - cannonPos.y;
    if (dy > -20) return;
    const angle = Math.atan2(dy, dx);
    setCannonAngle(angle + Math.PI / 2);

    const dots = [];
    let tx = cannonPos.x; let ty = cannonPos.y;
    let vx = Math.cos(angle) * 22; let vy = Math.sin(angle) * 22;

    let hitPoint = null;
    for (let i = 0; i < 30; i++) {
      tx += vx; ty += vy;
      if (tx < BUBBLE_SIZE / 2 || tx > SCREEN_WIDTH - BUBBLE_SIZE / 2) vx *= -1;

      const hitIdx = bubblesRef.current.findIndex(b => b.visible && Math.sqrt((tx - b.x) ** 2 + (ty - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.85);

      if (hitIdx !== -1 || ty < GRID_TOP) {
        hitPoint = { x: tx, y: ty };
        break;
      }
      dots.push({ x: tx, y: ty, opacity: 1 - i / 30 });
    }
    setAimDots(dots);

    if (hitPoint) {
      let best = { r: 0, c: 0, dist: Infinity };
      for (let r = 0; r < 35; r++) {
        const rowWidth = (r % 2 === 0) ? 9 : 8;
        for (let c = 0; c < rowWidth; c++) {
          if (bubblesRef.current.some(b => b.visible && b.row === r && b.col === c)) continue;
          const coords = getPos(r, c);
          const d = Math.sqrt((hitPoint.x - coords.x) ** 2 + (hitPoint.y - (coords.y + currentScrollY.current)) ** 2);
          if (d < best.dist) best = { r, c, dist: d };
        }
      }
      const finalPos = getPos(best.r, best.c);
      setTargetSlot({ x: finalPos.x, y: finalPos.y + currentScrollY.current });
    } else {
      setTargetSlot(null);
    }
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
    // Pushing velocity to 45 for ultra-fast response
    const velocity = 45;
    const shot = { x: cannonPos.x, y: cannonPos.y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, color: nextColor };

    const step = () => {
      // 3 sub-steps for rock-solid accuracy at 45px/frame
      for (let i = 0; i < 3; i++) {
        shot.x += shot.vx / 3;
        shot.y += shot.vy / 3;

        if (shot.x < BUBBLE_SIZE / 2 || shot.x > SCREEN_WIDTH - BUBBLE_SIZE / 2) shot.vx *= -1;

        const hit = bubblesRef.current.find(b => b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82);

        if (shot.y < GRID_TOP || hit) {
          cancelAnimationFrame(rafRef.current!);
          resolveLanding(shot);
          return;
        }
      }

      setShootingBubble({ ...shot });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const resolveLanding = (shot: any) => {
    let best = { r: 0, c: 0, dist: Infinity };
    for (let r = 0; r < 35; r++) {
      const rowWidth = (r % 2 === 0) ? 9 : 8;
      for (let c = 0; c < rowWidth; c++) {
        if (bubblesRef.current.some(b => b.visible && b.row === r && b.col === c)) continue;
        const coords = getPos(r, c);
        const d = Math.sqrt((shot.x - coords.x) ** 2 + (shot.y - (coords.y + currentScrollY.current)) ** 2);
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
    while (stack.length > 0) {
      const b = stack.pop()!;
      const neighbors = grid.filter(g => g.visible && !visited.has(g.id) && g.color === newB.color && Math.sqrt((b.x - g.x) ** 2 + (b.y - g.y) ** 2) < BUBBLE_SIZE * 1.2);
      neighbors.forEach(n => { visited.add(n.id); match.push(n); stack.push(n); });
    }

    if (match.length >= 3) {
      match.forEach(m => m.visible = false);
      setScore(s => s + match.length * 10);

      // 2. FLOATING LOGIC
      const connected = new Set();
      const topRowBubbles = grid.filter(b => b.visible && b.row === 0);
      const cStack = [...topRowBubbles];
      topRowBubbles.forEach(b => connected.add(b.id));

      while (cStack.length > 0) {
        const curr = cStack.pop()!;
        const neighbors = grid.filter(g => g.visible && !connected.has(g.id) && Math.sqrt((curr.x - g.x) ** 2 + (curr.y - g.y) ** 2) < BUBBLE_SIZE * 1.2);
        neighbors.forEach(n => {
          connected.add(n.id);
          cStack.push(n);
        });
      }

      const newFalling: any[] = [];
      match.forEach(m => {
        newFalling.push({ ...m, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 10, y: m.y + currentScrollY.current });
      });

      grid.forEach(b => {
        if (b.visible && !connected.has(b.id)) {
          b.visible = false;
          newFalling.push({ ...b, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 5, y: b.y + currentScrollY.current });
          setScore(s => s + 5);
        }
      });

      fallingRef.current = [...fallingRef.current, ...newFalling];
      setFallingBubbles(fallingRef.current);

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
          <View style={[styles.nextPreview, { backgroundColor: nextColor }]} />
        </View>
      </View>

      <View style={styles.gameArea} onStartShouldSetResponder={() => true}
        onResponderMove={(e) => updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onResponderRelease={onRelease}>
        <Image source={require("../images/bubble -bg.png")} style={styles.bg} />

        <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
          {bubbles.map(b => b.visible && (
            <View key={b.id} style={[styles.bubble, { left: b.x - BUBBLE_SIZE / 2, top: b.y - BUBBLE_SIZE / 2, backgroundColor: b.color }]}>
              <View style={styles.shine} />
            </View>
          ))}
        </Animated.View>

        {aimDots.map((d, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                left: d.x - 2.5,
                top: d.y - 2.5,
                opacity: d.opacity,
                width: 5,
                height: 5,
                borderRadius: 2.5,
              },
            ]}
          />
        ))}

        {/* Ghost Prediction Bubble */}
        {targetSlot && (
          <View style={[styles.bubble, styles.ghostBubble, { left: targetSlot.x - BUBBLE_SIZE / 2, top: targetSlot.y - BUBBLE_SIZE / 2, borderColor: nextColor }]}>
            <View style={[styles.shine, { opacity: 0.1 }]} />
          </View>
        )}

        {/* Falling Bubbles */}
        {fallingBubbles.map(b => (
          <View key={`fall-${b.id}-${b.x}`} style={[styles.bubble, { left: b.x - BUBBLE_SIZE / 2, top: b.y - BUBBLE_SIZE / 2, backgroundColor: b.color, zIndex: 10 }]}>
            <View style={styles.shine} />
          </View>
        ))}

        {shootingBubble && <View style={[styles.bubble, { left: shootingBubble.x - BUBBLE_SIZE / 2, top: shootingBubble.y - BUBBLE_SIZE / 2, backgroundColor: shootingBubble.color }]} />}

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
  bubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3
  },
  ghostBubble: {
    opacity: 0.4,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    borderColor: '#fff',
  },
  shine: { position: "absolute", top: "15%", left: "15%", width: "25%", height: "25%", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 10 },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    shadowColor: "#00E0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 224, 255, 0.5)",
  },
  footer: { position: "absolute", bottom: 40, width: "100%", alignItems: "center" },
  cannon: { width: 150, height: 150, resizeMode: "contain" },
  flash: { position: 'absolute', bottom: 100, width: 60, height: 60, backgroundColor: '#fff', borderRadius: 30 }
});

export default GameScreen;