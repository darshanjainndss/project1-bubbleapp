import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, StyleSheet, Dimensions, Image, Text, StatusBar, Animated, TouchableOpacity,
} from "react-native";

import { getLevelPattern, COLORS } from "../data/levelPatterns";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 10);
const ROW_HEIGHT = BUBBLE_SIZE * 0.86;
const GRID_COLS = 9;
const CANNON_SIZE = 150;
const FOOTER_BOTTOM = 60;
const GRID_TOP = 60;

// 1. MEMOIZED BUBBLE COMPONENT
const Bubble = React.memo(({ x, y, color, anim, entryOffset, isGhost }: any) => {
  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          backgroundColor: color,
          opacity: anim || 1,
          transform: [
            { translateX: x - BUBBLE_SIZE / 2 },
            { translateY: y - BUBBLE_SIZE / 2 },
            { translateY: entryOffset || 0 },
            { scale: anim || 1 }
          ],
          ...(isGhost ? styles.ghostBubble : {})
        }
      ]}
    >
      {/* Planetary Elements */}
      {!isGhost && (
        <>
          <View style={styles.planetBands} />
          <View style={styles.planetCrater1} />
          <View style={styles.planetCrater2} />
          <View style={styles.planetCrater3} />
          <View style={styles.planetRing} />
        </>
      )}
      <View style={styles.bubbleInner} />
      <View style={styles.bubbleHighlight} />
      <View style={styles.bubbleGloss} />
    </Animated.View>
  );
});

// 2. MEMOIZED GRID COMPONENT
const BubbleGrid = React.memo(({ bubbles }: { bubbles: any[] }) => {
  return (
    <>
      {bubbles.map(b => b.visible && (
        <Bubble
          key={b.id}
          x={b.x}
          y={b.y}
          color={b.color}
          anim={b.anim}
          entryOffset={b.entryOffset}
        />
      ))}
    </>
  );
});

// 3. PULSATING DOT COMPONENT
const PulsatingDot = React.memo(({ x, y, delay }: { x: number, y: number, delay: number }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulsatingDot, { left: x - 3, top: y - 3, opacity: pulse, transform: [{ scale: pulse }] }]} />
  );
});

// 4. OVERALL GRID BORDER COMPONENT
const PulsatingBorder = React.memo(() => {
  const dots = [];
  const gridHeight = 18.5 * ROW_HEIGHT + BUBBLE_SIZE;
  const padding = 10;
  let dotCount = 0;

  // Sequential flow: Top -> Right -> Bottom -> Left
  for (let x = padding; x <= SCREEN_WIDTH - padding; x += 25) {
    dots.push(<PulsatingDot key={`t-${x}`} x={x} y={GRID_TOP - padding} delay={dotCount * 50} />);
    dotCount++;
  }
  for (let y = GRID_TOP - padding + 25; y <= GRID_TOP + gridHeight + padding; y += 25) {
    dots.push(<PulsatingDot key={`r-${y}`} x={SCREEN_WIDTH - padding} y={y} delay={dotCount * 50} />);
    dotCount++;
  }
  for (let x = SCREEN_WIDTH - padding - 25; x >= padding; x -= 25) {
    dots.push(<PulsatingDot key={`b-${x}`} x={x} y={GRID_TOP + gridHeight + padding} delay={dotCount * 50} />);
    dotCount++;
  }
  for (let y = GRID_TOP + gridHeight + padding - 25; y > GRID_TOP - padding; y -= 25) {
    dots.push(<PulsatingDot key={`l-${y}`} x={padding} y={y} delay={dotCount * 50} />);
    dotCount++;
  }
  return <>{dots}</>;
});

const GameScreen = ({ onBackPress, level = 1 }: { onBackPress?: () => void, level?: number }) => {
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [fallingBubbles, setFallingBubbles] = useState<any[]>([]);
  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [aimDots, setAimDots] = useState<any[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [isAimingState, setIsAimingState] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{ x: number, y: number } | null>(null);
  const scrollY = useRef(new Animated.Value(-100)).current;
  const currentScrollY = useRef(-100);
  const bubblesRef = useRef<any[]>([]);
  const fallingRef = useRef<any[]>([]);
  const isProcessing = useRef(false);
  const isAiming = useRef(false);
  const rafRef = useRef<number | null>(null);
  const fallingRafRef = useRef<number | null>(null);

  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const muzzleVelocityAnim = useRef(new Animated.Value(0)).current;
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
      const pRow = (r >= startRow && r < startRow + patternHeight) ? pattern[r - startRow] : null;

      // Identify horizontal hole boundaries for this pattern row
      let firstIdx = -1;
      let actualLastIdx = -1;
      if (pRow) {
        firstIdx = pRow.search(/\S/);
        const lastIdx = pRow.split('').reverse().join('').search(/\S/);
        actualLastIdx = lastIdx === -1 ? -1 : pRow.length - 1 - lastIdx;
      }

      for (let c = 0; c < rowWidth; c++) {
        // Skip holes strictly inside the pattern string span
        if (pRow && firstIdx !== -1 && c >= firstIdx && c <= actualLastIdx && pRow[c] === ' ') {
          continue;
        }

        const d = distMap[r][c];
        const { x, y } = getPos(r, c);

        let color;
        if (d > 0) {
          // Outside the pattern: use the previous contour (layer-based) coloring
          color = bgColors[(d - 1) % bgColors.length];
        } else {
          // Inside the pattern (d === 0)
          let isBorder = false;
          const nb = neighbors(r, c);
          for (const [nr, nc] of nb) {
            const nWidth = (nr % 2 === 0) ? 9 : 8;
            if (nr < 0 || nr >= 19 || nc < 0 || nc >= nWidth || distMap[nr][nc] > 0) {
              isBorder = true;
              break;
            }
          }

          if (isBorder) {
            color = "#A259FF"; // Pattern border is Purple
          } else {
            color = "#FFD60A"; // Pattern interior is Yellow
          }
        }

        grid.push({
          id: `b-${r}-${c}-${Date.now()}`,
          row: r, col: c, x, y,
          color,
          visible: true
        });
      }
    }

    const finalTargetScroll = -10 * ROW_HEIGHT;

    // 1. Initial Reveal: Position the grid so the pattern is clearly visible in the center
    const centeredRevealScroll = (SCREEN_HEIGHT / 2) - (9.5 * ROW_HEIGHT);

    scrollY.setValue(centeredRevealScroll);
    currentScrollY.current = finalTargetScroll;

    // Set bubbles to be visible immediately without individual offsets
    const gridWithStaticAnims = grid.map((b, i) => ({
      ...b,
      anim: new Animated.Value(1),
      entryOffset: new Animated.Value(0),
    }));

    bubblesRef.current = gridWithStaticAnims;
    setBubbles(gridWithStaticAnims);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setScore(0);

    // 2. Wait 1 second for the player to see the pattern, then slide up to position
    setTimeout(() => {
      Animated.spring(scrollY, {
        toValue: finalTargetScroll,
        tension: 10,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }, 1000);

  }, [level, scrollY]);

  useEffect(() => { initGame(); }, [initGame]);

  // Falling Animation Loop
  useEffect(() => {
    let lastTime = 0;
    const animateFalling = (time: number) => {
      // Calculate delta time for frame-independent motion
      const dt = lastTime ? (time - lastTime) / 16.67 : 1;
      lastTime = time;

      if (fallingRef.current.length > 0) {
        // Use a single map pass to update physics
        const next = fallingRef.current
          .map(b => ({
            ...b,
            x: b.x + (b.vx || 0) * dt,
            y: b.y + (b.vy || 0) * dt,
            vy: (b.vy || 0) + 0.9 * dt, // Slightly stronger gravity for punchier fall
          }))
          .filter(b => b.y < SCREEN_HEIGHT + BUBBLE_SIZE);

        if (next.length !== fallingRef.current.length || next.some((b, i) => b.y !== fallingRef.current[i].y)) {
          fallingRef.current = next;
          setFallingBubbles(next);
        }
      }
      fallingRafRef.current = requestAnimationFrame(animateFalling);
    };
    fallingRafRef.current = requestAnimationFrame(animateFalling);
    return () => cancelAnimationFrame(fallingRafRef.current!);
  }, []);

  const updateAim = (pageX: number, pageY: number) => {
    if (isProcessing.current || !isAiming.current) return;
    if (showHint) setShowHint(false);

    // Origin for tracer - exactly at the visual muzzle (top edge of 150px robot)
    const startX = cannonPos.x;
    const startY = cannonPos.y;

    const dx = pageX - startX;
    const dy = pageY - startY;

    // Boundary check for aiming angle
    if (pageY > cannonPos.y - 20) return;

    const angle = Math.atan2(dy, dx);
    setCannonAngle(angle + Math.PI / 2);

    const dots = [];
    let tx = startX; let ty = startY;
    let vx = Math.cos(angle) * 22; let vy = Math.sin(angle) * 22;
    let hitPoint = null;

    for (let i = 0; i < 25; i++) {
      tx += vx; ty += vy;
      if (tx < BUBBLE_SIZE / 2 || tx > SCREEN_WIDTH - BUBBLE_SIZE / 2) vx *= -1;

      const hitIdx = bubblesRef.current.findIndex(b => b.visible && Math.sqrt((tx - b.x) ** 2 + (ty - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.85);

      if (hitIdx !== -1 || ty < GRID_TOP) {
        hitPoint = { x: tx, y: ty };
        break;
      }
      dots.push({ x: tx, y: ty, opacity: 1 - i / 25 });
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
    if (!isAiming.current || isProcessing.current) return;
    isAiming.current = false;
    setIsAimingState(false);

    // Clear aim indicators when starting the shot
    setAimDots([]);
    setTargetSlot(null);

    isProcessing.current = true;

    muzzleFlashAnim.setValue(1);
    muzzleVelocityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(muzzleFlashAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(muzzleVelocityAnim, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();

    Animated.sequence([
      Animated.timing(recoilAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(recoilAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();

    const angle = cannonAngle - Math.PI / 2;
    // Pushing velocity to 45 for ultra-fast response
    const velocity = 45;
    // Start the shot from the muzzle (top of robot image)
    const shot = {
      x: cannonPos.x,
      y: cannonPos.y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: nextColor
    };

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
    const hitAnim = new Animated.Value(0.7); // Start slightly smaller for "impact" feel
    const newB = { id: `b-${Date.now()}`, row: best.r, col: best.c, x, y, color: shot.color, visible: true, anim: hitAnim };
    const grid = [...bubblesRef.current, newB];

    // Trigger Impact Animation for the landed bubble
    Animated.spring(hitAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true
    }).start();

    // 1. FIND MATCHES
    const match = [newB];
    const stack = [newB];
    const visited = new Set([newB.id]);

    // Impact neighbors - briefly shake them
    const nb = grid.filter(g => g.visible && g.id !== newB.id && Math.sqrt((newB.x - g.x) ** 2 + (newB.y - g.y) ** 2) < BUBBLE_SIZE * 1.5);
    nb.forEach(n => {
      if (n.anim) {
        Animated.sequence([
          Animated.timing(n.anim, { toValue: 1.08, duration: 50, useNativeDriver: true }),
          Animated.spring(n.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
        ]).start();
      }
    });

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
        onResponderGrant={(e) => {
          const { pageX, pageY } = e.nativeEvent;
          isAiming.current = true;
          setIsAimingState(true);
          updateAim(pageX, pageY);
        }}
        onResponderMove={(e) => updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onResponderRelease={onRelease}>
        <Image source={require("../images/bubble -bg.png")} style={styles.bg} />

        <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
          <PulsatingBorder />
          <BubbleGrid bubbles={bubbles} />
        </Animated.View>

        {aimDots.map((d, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                left: d.x - 3,
                top: d.y - 3,
                opacity: d.opacity,
                backgroundColor: nextColor,
                shadowColor: nextColor,
              },
            ]}
          />
        ))}

        {/* Ghost Prediction Bubble */}
        {targetSlot && (
          <Bubble
            x={targetSlot.x}
            y={targetSlot.y}
            color={nextColor}
            isGhost
          />
        )}

        {/* Falling Bubbles */}
        {fallingBubbles.map(b => (
          <Bubble
            key={`fall-${b.id}-${b.x}`}
            x={b.x}
            y={b.y}
            color={b.color}
          />
        ))}

        {shootingBubble && (
          <Bubble
            x={shootingBubble.x}
            y={shootingBubble.y}
            color={shootingBubble.color}
          />
        )}

        <View style={styles.footer}>
          {/* Circular Touch Border around shooter - Highlighted when active */}
          <View style={[styles.touchCircle, isAimingState && styles.touchCircleActive]} />

          {/* Muzzle Velocity Effect (Blast Wave) */}
          <Animated.View style={[
            styles.muzzleBlast,
            {
              opacity: muzzleVelocityAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
              transform: [
                { rotate: `${cannonAngle}rad` },
                { scale: muzzleVelocityAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) },
                { translateY: -60 }
              ]
            }
          ]} />

          <Animated.View style={[styles.flash, { opacity: muzzleFlashAnim }]} />
          <Animated.Image
            source={require("../images/robot-removebg-preview.png")}
            style={[styles.cannon, { transform: [{ rotate: `${cannonAngle}rad` }, { translateY: recoilAnim }] }]}
          />
          {showHint && (
            <View style={styles.hintContainer} pointerEvents="none">
              <Text style={styles.hintText}>TOUCH & DRAG TO AIM</Text>
            </View>
          )}
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
  pulsatingDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },

  gameArea: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  bubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5
  },
  bubbleInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  planetBands: {
    position: 'absolute',
    width: '150%',
    height: '100%',
    top: 0,
    left: '-25%',
    borderTopWidth: 6,
    borderBottomWidth: 4,
    borderColor: 'rgba(0,0,0,0.15)',
    opacity: 0.6,
  },
  planetCrater1: {
    position: 'absolute',
    width: '20%',
    height: '20%',
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.12)',
    top: '20%',
    right: '25%',
  },
  planetCrater2: {
    position: 'absolute',
    width: '12%',
    height: '12%',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    bottom: '25%',
    left: '30%',
  },
  planetCrater3: {
    position: 'absolute',
    width: '15%',
    height: '15%',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: '40%',
    right: '35%',
  },
  planetRing: {
    position: 'absolute',
    width: '140%',
    height: '35%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    top: '35%',
    left: '-20%',
    transform: [{ rotate: '-15deg' }],
    zIndex: -1, // Behind the planet body
  },
  bubbleHighlight: {
    position: 'absolute',
    top: '5%',
    left: '10%',
    width: '40%',
    height: '40%',
    borderRadius: BUBBLE_SIZE / 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-10deg' }],
    zIndex: 2,
  },
  bubbleGloss: {
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: '30%',
    height: '15%',
    borderRadius: BUBBLE_SIZE,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  ghostBubble: {
    opacity: 0.6,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 8,
  },
  touchCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
    bottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  touchCircleActive: {
    borderColor: '#00E0FF',
    backgroundColor: 'rgba(0, 224, 255, 0.15)',
    borderStyle: 'solid',
    transform: [{ scale: 1.1 }],
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  hintContainer: {
    position: 'absolute',
    bottom: -60,
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  footer: { position: "absolute", bottom: 60, width: "100%", alignItems: "center" },
  cannon: { width: 150, height: 150, resizeMode: "contain", zIndex: 10 },
  flash: { position: 'absolute', bottom: 100, width: 60, height: 60, backgroundColor: '#fff', borderRadius: 30, zIndex: 5 },
  muzzleBlast: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00E0FF',
    backgroundColor: 'rgba(0, 224, 255, 0.2)',
    bottom: 50,
    zIndex: 15,
  }
});

export default GameScreen;