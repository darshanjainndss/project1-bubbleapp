import React, { useState, useEffect, useCallback, useRef } from "react";
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
  TouchableOpacity,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- CONSTANTS ---
const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 9);
const CANNON_SIZE = 160;
const MOUTH_DIST = 50;
const FOOTER_BOTTOM = 30;
const GRID_COLS = 8;
const GRID_TOP = 70;
const GRID_ROWS_VISIBLE = 6; // initial visible rows for background sizing
const GRID_PADDING = (SCREEN_WIDTH - GRID_COLS * BUBBLE_SIZE) / 2;
const GRID_WIDTH = GRID_COLS * BUBBLE_SIZE;
const ROW_HEIGHT = BUBBLE_SIZE * 0.86;
const GRID_HEIGHT = GRID_ROWS_VISIBLE * ROW_HEIGHT;
const MAX_ROWS = 15;
// 5 vivid, child-friendly, easily-differentiable colors
const COLORS = [
  "#FF3B30", // vivid red
  "#FF9500", // vivid orange
  "#FFD60A", // bright yellow
  "#34C759", // vivid green
  "#007AFF", // vivid blue
];

interface Bubble {
  id: string;
  x: number;
  y: number;
  color: string;
  row: number;
  col: number;
  visible: boolean;
  scale: Animated.Value;
  fallAnim: Animated.Value;
  fallOpacity: Animated.Value;
}

interface GameScreenProps {
  onBackPress?: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onBackPress }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  interface ShootingBubble {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
  }
  const [shootingBubble, setShootingBubble] = useState<ShootingBubble | null>(null);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);

  // missing aim dots state (fixed)
  const [aimDots, setAimDots] = useState<{ x: number; y: number; opacity: number; size: number }[]>([]);

  interface Shot {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
  }
  // single shot ref (keep this one)
  const shotRef = useRef<Shot | null>(null);

  const bubblesRef = useRef<Bubble[]>([]);
  const isProcessing = useRef(false);
  const rafRef = useRef<number | null>(null);
  // removed duplicate shotRef declaration that caused shadowing
  const lastShotUpdate = useRef<number>(0);

  // --- ANIMATION REFS ---
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;

  // Pivot Point for the Cannon (computed from footer bottom and cannon size)
  const cannonPos = {
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT - FOOTER_BOTTOM - CANNON_SIZE / 2,
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      shotRef.current = null;
    };
  }, []);

  const getBubbleCoords = (row: number, col: number) => {
    const xOffset = row % 2 !== 0 ? BUBBLE_SIZE / 2 : 0;
    const gridPadding = GRID_PADDING;
    const x = gridPadding + xOffset + col * BUBBLE_SIZE + BUBBLE_SIZE / 2;
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
          x,
          y,
          row,
          col: actualCol,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          visible: true,
          scale: new Animated.Value(1),
          fallAnim: new Animated.Value(0),
          fallOpacity: new Animated.Value(0.8),
        });
      }
    }
    setBubbles(initialBubbles);
    bubblesRef.current = initialBubbles;
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setScore(0);
    isProcessing.current = false;
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const updateAim = (pageX: number, pageY: number) => {
    if (isProcessing.current) return;

    const dx = pageX - cannonPos.x;
    const dy = pageY - cannonPos.y;
    if (dy > -30) return;

    const angle = Math.atan2(dy, dx);
    setCannonAngle(angle + Math.PI / 2);

    const dots = [];
    const mouthDist = MOUTH_DIST; // Distance from cannon base to mouth
    let tempX = cannonPos.x + Math.cos(angle) * mouthDist;
    let tempY = cannonPos.y + Math.sin(angle) * mouthDist;

    let velX = Math.cos(angle) * 25;
    let velY = Math.sin(angle) * 25;

    // First tracer dot should be exactly at the cannon mouth
    if (!(tempX < BUBBLE_SIZE / 2 || tempX > SCREEN_WIDTH - BUBBLE_SIZE / 2)) {
      const hit0 = bubblesRef.current.some(
        (b) =>
          b.visible &&
          Math.sqrt((tempX - b.x) ** 2 + (tempY - b.y) ** 2) < BUBBLE_SIZE * 0.9
      );
      if (!hit0 && tempY >= 60) {
        dots.push({ x: tempX, y: tempY, opacity: 1, size: 8 });
      }
    }

    for (let i = 1; i < 22; i++) {
      tempX += velX;
      tempY += velY;
      if (tempX < BUBBLE_SIZE / 2 || tempX > SCREEN_WIDTH - BUBBLE_SIZE / 2)
        velX *= -1;
      const hit = bubblesRef.current.some(
        (b) =>
          b.visible &&
          Math.sqrt((tempX - b.x) ** 2 + (tempY - b.y) ** 2) < BUBBLE_SIZE * 0.9
      );
      if (hit || tempY < 60) break;
      dots.push({ x: tempX, y: tempY, opacity: 1 - i / 25, size: 8 - i * 0.2 });
    }
    setAimDots(dots);
  };

  const onRelease = () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    // --- FIRE EFFECTS ---
    // Recoil
    Animated.sequence([
      Animated.timing(recoilAnim, {
        toValue: 15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(recoilAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Muzzle Flash
    muzzleFlashAnim.setValue(1);
    Animated.timing(muzzleFlashAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const angle = cannonAngle - Math.PI / 2;
    const mouthDist = MOUTH_DIST;
    const shot = {
      x: cannonPos.x + Math.cos(angle) * mouthDist,
      y: cannonPos.y + Math.sin(angle) * mouthDist,
      vx: Math.cos(angle) * 22,
      vy: Math.sin(angle) * 22,
      color: nextColor,
    };

    // store into ref and trigger RAF loop; update visible shootingBubble at a throttled rate
    shotRef.current = { ...shot };
    setShootingBubble({ ...shotRef.current });
    setAimDots([]);

    const step = () => {
      const s = shotRef.current;
      if (!s) return;
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < BUBBLE_SIZE / 2 || s.x > SCREEN_WIDTH - BUBBLE_SIZE / 2)
        s.vx *= -1;

      // collision check
      const hit = bubblesRef.current.find(
        (b) =>
          b.visible &&
          Math.sqrt((s.x - b.x) ** 2 + (s.y - b.y) ** 2) < BUBBLE_SIZE * 0.85
      );
      const now = Date.now();
      // throttle visual updates to ~30fps
      if (!lastShotUpdate.current || now - lastShotUpdate.current > 32) {
        setShootingBubble({ ...s });
        lastShotUpdate.current = now;
      }

      if (s.y < 70 || hit) {
        // stop RAF and resolve
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const finalShot = { ...s };
        shotRef.current = null;
        setShootingBubble(null);
        resolveLanding(finalShot);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  };

  const resolveLanding = (shot: any) => {
    let bestSlot = { r: 0, c: 0, dist: Infinity };
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (
          bubblesRef.current.some(
            (b) => b.visible && b.row === r && b.col === c
          )
        )
          continue;
        const { x, y } = getBubbleCoords(r, c);
        const dist = Math.sqrt((shot.x - x) ** 2 + (shot.y - y) ** 2);
        if (dist < bestSlot.dist) bestSlot = { r, c, dist };
      }
    }

    const { x, y } = getBubbleCoords(bestSlot.r, bestSlot.c);
    const newBubble: Bubble = {
      id: `b-${Date.now()}`,
      x,
      y,
      row: bestSlot.r,
      col: bestSlot.c,
      color: shot.color,
      visible: true,
      scale: new Animated.Value(1),
      fallAnim: new Animated.Value(0),
      fallOpacity: new Animated.Value(0.8),
    };

    let newGrid = [...bubblesRef.current, newBubble];

    // Logic for matching and neighbors...
    const matches: Bubble[] = [];
    const stack = [newBubble];
    const visited = new Set();
    while (stack.length > 0) {
      const b = stack.pop()!;
      if (visited.has(b.id)) continue;
      visited.add(b.id);
      if (b.color === shot.color) {
        matches.push(b);
        const isEven = b.row % 2 === 0;
        const neighbors = [
          { r: b.row, c: b.col - 1 },
          { r: b.row, c: b.col + 1 },
          { r: b.row - 1, c: b.col },
          { r: b.row - 1, c: b.col + (isEven ? -1 : 1) },
          { r: b.row + 1, c: b.col },
          { r: b.row + 1, c: b.col + (isEven ? -1 : 1) },
        ];
        neighbors.forEach((n) => {
          const nb = newGrid.find(
            (g) => g.visible && g.row === n.r && g.col === n.c
          );
          if (nb) stack.push(nb);
        });
      }
    }

    if (matches.length >= 3) {
      setScore((s) => s + matches.length * 10);
      const matchIds = new Set(matches.map((m) => m.id));

      // Animate matched bubbles to 'fall' and fade out before removing
      // Compute survivors and floating BEFORE starting animations so both groups animate together
      const survivors = newGrid.filter((b) => !matchIds.has(b.id) && b.visible);

      const findNeighbor = (g: Bubble[], r: number, c: number) =>
        g.find((gb) => gb.visible && gb.row === r && gb.col === c);
      const connected = new Set<string>();
      const queue: Bubble[] = survivors.filter((s) => s.row === 0);
      while (queue.length > 0) {
        const cur = queue.shift()!;
        if (connected.has(cur.id)) continue;
        connected.add(cur.id);
        const isEven = cur.row % 2 === 0;
        const neighbors = [
          { r: cur.row, c: cur.col - 1 },
          { r: cur.row, c: cur.col + 1 },
          { r: cur.row - 1, c: cur.col },
          { r: cur.row - 1, c: cur.col + (isEven ? -1 : 1) },
          { r: cur.row + 1, c: cur.col },
          { r: cur.row + 1, c: cur.col + (isEven ? -1 : 1) },
        ];
        neighbors.forEach((n) => {
          const nb = findNeighbor(survivors, n.r, n.c);
          if (nb && !connected.has(nb.id)) queue.push(nb);
        });
      }

      const floating = survivors.filter((s) => !connected.has(s.id));

      const fallAnims = matches.map((m, idx) => {
        const fallDistance = SCREEN_HEIGHT - m.y + 120 + Math.random() * 60;
        return Animated.parallel([
          Animated.timing(m.fallAnim, {
            toValue: fallDistance,
            duration: 800 + idx * 60,
            useNativeDriver: true,
          }),
          Animated.timing(m.fallOpacity, {
            toValue: 0,
            duration: 700 + idx * 60,
            useNativeDriver: true,
          }),
          Animated.timing(m.scale, {
            toValue: 0.8,
            duration: 700 + idx * 60,
            useNativeDriver: true,
          }),
        ]);
      });

      const floatAnims = floating.map((m, idx) => {
        const fallDistance = SCREEN_HEIGHT - m.y + 160 + Math.random() * 80;
        return Animated.parallel([
          Animated.timing(m.fallAnim, {
            toValue: fallDistance,
            duration: 700 + idx * 40,
            useNativeDriver: true,
          }),
          Animated.timing(m.fallOpacity, {
            toValue: 0,
            duration: 600 + idx * 40,
            useNativeDriver: true,
          }),
          Animated.timing(m.scale, {
            toValue: 0.85,
            duration: 600 + idx * 40,
            useNativeDriver: true,
          }),
        ]);
      });

      // Run both matched and floating animations together (interleaved)
      const combined = [] as Animated.CompositeAnimation[];
      const maxLen = Math.max(fallAnims.length, floatAnims.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < fallAnims.length) combined.push(fallAnims[i]);
        if (i < floatAnims.length) combined.push(floatAnims[i]);
      }

      Animated.stagger(40, combined).start(() => {
        // After animations complete mark both matches and floating as invisible
        let finalGrid = newGrid.map((b) =>
          matchIds.has(b.id) || floating.some((f) => f.id === b.id)
            ? { ...b, visible: false }
            : b
        );
        bubblesRef.current = finalGrid;
        setBubbles([...finalGrid]);
        if (finalGrid.filter((b) => b.visible).length === 0)
          Alert.alert("Victory!", "Cleared!", [
            { text: "Restart", onPress: initGame },
          ]);
      });
    } else {
      bubblesRef.current = newGrid;
      setBubbles(newGrid);
    }

    setShootingBubble(null);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    isProcessing.current = false;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Back Button */}
      {onBackPress && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackPress}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}
      
      <View
        style={styles.gameArea}
        onStartShouldSetResponder={() => true}
        onResponderMove={(e) =>
          updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY)
        }
        onResponderRelease={onRelease}
      >
        <Image source={require("../images/bubble -bg.png")} style={styles.bg} />
        <View
          style={[
            styles.scoreContainer,
            {
              bottom: FOOTER_BOTTOM + 8,
              left: 12,
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          <View style={styles.scoreLeft}>
            <Text
              style={[
                styles.scoreText,
                { fontSize: Math.max(14, Math.round(SCREEN_WIDTH * 0.045)) },
              ]}
            >
              SCORE
            </Text>
            <Text
              style={[
                styles.scoreValue,
                { fontSize: Math.max(18, Math.round(SCREEN_WIDTH * 0.06)) },
              ]}
            >
              {score}
            </Text>
          </View>

          <View style={styles.nextInline}>
            <Text style={styles.nextLabel}>NEXT</Text>
            <Animated.View
              style={[
                styles.nextBubble,
                {
                  backgroundColor: nextColor,
                  marginLeft: 8,
                  overflow: "hidden",
                },
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.6, 1],
                        outputRange: [0.92, 1.06],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.shine} />
              <View style={styles.shine2} />
            </Animated.View>
          </View>
        </View>

        {bubbles.map((b) => (
          <BubbleView key={b.id} bubble={b} />
        ))}

        {aimDots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.tracerDot,
              {
                left: dot.x - dot.size / 2,
                top: dot.y - dot.size / 2,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                opacity: pulseAnim.interpolate({
                  inputRange: [0.6, 1],
                  outputRange: [dot.opacity * 0.4, dot.opacity],
                }),
              },
            ]}
          />
        ))}

        {shootingBubble && (
          <View
            style={[
              styles.bubble,
              {
                left: shootingBubble.x - BUBBLE_SIZE / 2,
                top: shootingBubble.y - BUBBLE_SIZE / 2,
                backgroundColor: shootingBubble.color,
                zIndex: 10,
                opacity: 0.8,
              },
            ]}
          />
        )}

        <View style={styles.footer}>
          {/* MUZZLE FLASH */}
          <Animated.View
            style={[
              styles.muzzleFlash,
              {
                left: SCREEN_WIDTH / 2 - 25,
                bottom: FOOTER_BOTTOM + CANNON_SIZE / 2,
                opacity: muzzleFlashAnim,
                transform: [
                  { rotate: `${cannonAngle}rad` },
                  { translateY: -MOUTH_DIST },
                  { scale: muzzleFlashAnim },
                ],
              },
            ]}
          />

          {/* CANNON WITH RECOIL */}
          <Animated.Image
            source={require("../images/canon2-removebg-preview.png")}
            style={[
              styles.cannon,
              {
                width: CANNON_SIZE,
                height: CANNON_SIZE,
                transform: [
                  { rotate: `${cannonAngle}rad` },
                  { translateY: recoilAnim },
                ],
              },
            ]}
          />

          {/* next box moved into score card */}
        </View>
      </View>
    </View>
  );
};

// Memoized bubble renderer to avoid re-rendering all bubbles when shooter moves
const BubbleView = React.memo(
  function _BubbleView({ bubble }: { bubble: Bubble }) {
    if (!bubble.visible) return null;
    return (
      <Animated.View
        key={bubble.id}
        style={[
          styles.bubble,
          {
            left: bubble.x - BUBBLE_SIZE / 2,
            top: bubble.y - BUBBLE_SIZE / 2,
            backgroundColor: bubble.color,
            opacity: bubble.fallOpacity,
            transform: [
              { scale: bubble.scale },
              { translateY: bubble.fallAnim },
            ],
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.shine} />
        <View style={styles.shine2} />
      </Animated.View>
    );
  },
  (prev, next) => {
    // Only re-render when key visual properties change
    return (
      prev.bubble.id === next.bubble.id &&
      prev.bubble.x === next.bubble.x &&
      prev.bubble.y === next.bubble.y &&
      prev.bubble.color === next.bubble.color &&
      prev.bubble.visible === next.bubble.visible
    );
  }
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameArea: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 1, zIndex: 0 },
  scoreContainer: {
    position: "absolute",
    zIndex: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(20,20,28,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  scoreLeft: { marginRight: 12, alignItems: "flex-start" },
  nextInline: { alignItems: "center", justifyContent: "center" },
  scoreText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  scoreValue: { color: "#fff", fontSize: 28, fontWeight: "900" },
  bubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  gridBg: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  nextBubble: {
    width: BUBBLE_SIZE * 0.84,
    height: BUBBLE_SIZE * 0.84,
    borderRadius: (BUBBLE_SIZE * 0.84) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  shine: {
    position: "absolute",
    top: "8%",
    left: "10%",
    width: "34%",
    height: "34%",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 999,
    opacity: 0.95,
  },
  shine2: {
    position: "absolute",
    right: "8%",
    bottom: "10%",
    width: "56%",
    height: "18%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    transform: [{ rotate: "-18deg" }],
  },
  tracerDot: { position: "absolute", backgroundColor: "#fff", zIndex: 1 },
  muzzleFlash: {
    position: "absolute",
    width: 50,
    height: 50,
    backgroundColor: "#FFEAA7",
    borderRadius: 25,
    zIndex: 5,
    shadowColor: "#FFEAA7",
    shadowRadius: 15,
    shadowOpacity: 1,
  },
  footer: {
    position: "absolute",
    bottom: FOOTER_BOTTOM,
    width: "100%",
    alignItems: "center",
  },
  cannon: { width: 100, height: 100, resizeMode: "contain", zIndex: 4 },
  nextBox: {
    position: "absolute",
    right: 12,
    top: 18,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  nextLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
});

export default GameScreen;
