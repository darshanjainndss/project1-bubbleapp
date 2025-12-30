import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, StyleSheet, Dimensions, Image, Text, StatusBar, Animated, TouchableOpacity,
} from "react-native";
import LottieView from 'lottie-react-native';
import SpaceBackground from "./SpaceBackground";
import MaterialIcon from "./MaterialIcon";
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from "../config/icons";

import { getLevelPattern, getLevelMoves, getLevelMetalGridConfig, COLORS } from "../data/levelPatterns";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 10);
const ROW_HEIGHT = BUBBLE_SIZE * 0.86;
const GRID_COLS = 9;
const CANNON_SIZE = 95;
const FOOTER_BOTTOM = 150; // Increased to move shooter assembly up
const GRID_TOP = 10;

const COLOR_MAP: Record<string, any> = {
  "#ff3b30": require("../images/red.png"),
  "#ff9500": require("../images/orange.png"),
  "#ffd60a": require("../images/yellow.png"),
  "#34c759": require("../images/green.png"),
  "#007aff": require("../images/blue.png"),
  "#af52de": require("../images/purple.png"),
};

// 1. MEMOIZED BUBBLE COMPONENT
// Optimized Bubble component with reduced complexity for falling bubbles
const Bubble = React.memo(({ x, y, color, anim, entryOffset, isGhost, hasMetalGrid, isFrozen, hitsRemaining, hasLightning, hasBomb, hasFreeze, hasFire }: any) => {
  const imageSource = COLOR_MAP[color.toLowerCase()];

  // Animation for metal grid effects
  const metalPulseAnim = useRef(new Animated.Value(1)).current;
  const metalRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasMetalGrid && !isGhost) {
      // Create pulsing animation for metal grid
      Animated.loop(
        Animated.sequence([
          Animated.timing(metalPulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(metalPulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Create slow rotation animation for the cross pattern
      Animated.loop(
        Animated.timing(metalRotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [hasMetalGrid, isGhost, metalPulseAnim, metalRotateAnim]);

  const rotateInterpolate = metalRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          backgroundColor: imageSource && !isGhost ? "transparent" : color,
          opacity: anim || 1,
          borderWidth: imageSource && !isGhost ? 0 : 1.5,
          borderRadius: imageSource && !isGhost ? 0 : BUBBLE_SIZE / 2,
          shadowOpacity: imageSource && !isGhost ? 0 : 0.4,
          elevation: imageSource && !isGhost ? 0 : 5,
          overflow: imageSource && !isGhost ? 'visible' : 'hidden',
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
      {imageSource && !isGhost ? (
        <Image
          source={imageSource}
          style={{ width: "120%", height: "120%", resizeMode: "contain" }}
        />
      ) : (
        <>
          {/* Planetary Elements (Only for ghosts or fallback) */}
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
        </>
      )}

      {/* Metal Grid Overlay - Circular Design */}
      {hasMetalGrid && !isGhost && !isFrozen && (
        <Animated.View style={[styles.metalGridOverlay, { transform: [{ scale: metalPulseAnim }] }]}>
          {/* Outer Metal Ring */}
          <View style={styles.metalOuterRing} />

          {/* Inner Metal Ring */}
          <View style={styles.metalInnerRing} />

          {/* Rotating Cross Pattern Container */}
          <Animated.View style={[styles.metalCrossContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
            {/* Cross Pattern */}
            <View style={styles.metalCrossHorizontal} />
            <View style={styles.metalCrossVertical} />

            {/* Diagonal Cross Pattern */}
            <View style={styles.metalDiagonal1} />
            <View style={styles.metalDiagonal2} />
          </Animated.View>

          {/* Corner Bolts */}
          <View style={[styles.metalBolt, { top: '15%', left: '15%' }]} />
          <View style={[styles.metalBolt, { top: '15%', right: '15%' }]} />
          <View style={[styles.metalBolt, { bottom: '15%', left: '15%' }]} />
          <View style={[styles.metalBolt, { bottom: '15%', right: '15%' }]} />

          {/* Metallic shine effect */}
          <View style={styles.metallicShine} />
        </Animated.View>
      )}

      {/* Ice Overlay */}
      {isFrozen && !isGhost && (
        <View style={styles.iceOverlay}>
          <View style={styles.iceGlaze} />
          <View style={styles.iceCrystal1} />
          <View style={styles.iceCrystal2} />
          <View style={styles.iceShine} />
        </View>
      )}

      {/* Lightning Power Effect */}
      {hasLightning && !isGhost && (
        <View style={styles.lightningEffect}>
          <MaterialIcon
            name={GAME_ICONS.LIGHTNING.name}
            family={GAME_ICONS.LIGHTNING.family}
            size={ICON_SIZES.SMALL}
            color={ICON_COLORS.SECONDARY}
          />
        </View>
      )}

      {/* Bomb Power Effect */}
      {hasBomb && !isGhost && (
        <View style={styles.bombEffect}>
          <MaterialIcon
            name={GAME_ICONS.BOMB.name}
            family={GAME_ICONS.BOMB.family}
            size={ICON_SIZES.SMALL}
            color={ICON_COLORS.WARNING}
          />
        </View>
      )}

      {/* Freeze Power Effect */}
      {hasFreeze && !isGhost && (
        <View style={styles.freezeEffect}>
          <MaterialIcon
            name={GAME_ICONS.FREEZE.name}
            family={GAME_ICONS.FREEZE.family}
            size={ICON_SIZES.SMALL}
            color="#00ffff"
          />
        </View>
      )}

      {/* Fire Power Effect */}
      {hasFire && !isGhost && (
        <View style={styles.fireEffect}>
          <MaterialIcon
            name={GAME_ICONS.FIRE.name}
            family={GAME_ICONS.FIRE.family}
            size={ICON_SIZES.SMALL}
            color="#ff3b30"
          />
        </View>
      )}
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
          hasMetalGrid={b.hasMetalGrid}
          isFrozen={b.isFrozen}
          hitsRemaining={b.hitsRemaining}
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
  return <>{dots}</>;
});





const GameScreen = ({ onBackPress, level = 1 }: { onBackPress?: () => void, level?: number }) => {
  const [bubbles, setBubbles] = useState<any[]>([]);

  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [aimDots, setAimDots] = useState<any[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [isAimingState, setIsAimingState] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{ x: number, y: number } | null>(null);
  const scrollY = useRef(new Animated.Value(-100)).current;
  const currentScrollY = useRef(-100);
  const bubblesRef = useRef<any[]>([]);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  // Power-up states
  const [lightningActive, setLightningActive] = useState(false);
  const [hasLightningPower, setHasLightningPower] = useState(false);
  const [bombActive, setBombActive] = useState(false);
  const [hasBombPower, setHasBombPower] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [hasFreezePower, setHasFreezePower] = useState(false);
  const [fireActive, setFireActive] = useState(false);
  const [hasFirePower, setHasFirePower] = useState(false);

  const isProcessing = useRef(false);
  const isAiming = useRef(false);
  const rafRef = useRef<number | null>(null);


  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const muzzleVelocityAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;

  const cannonPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - FOOTER_BOTTOM - CANNON_SIZE / 2 };

  // Helper function to get hexagonal neighbors
  const getHexNeighbors = (row: number, col: number) => {
    const neighbors = [];
    if (row % 2 === 0) {
      // Even row
      neighbors.push(
        [row - 1, col - 1], [row - 1, col],     // Top-left, Top-right
        [row, col - 1], [row, col + 1],         // Left, Right
        [row + 1, col - 1], [row + 1, col]      // Bottom-left, Bottom-right
      );
    } else {
      // Odd row
      neighbors.push(
        [row - 1, col], [row - 1, col + 1],     // Top-left, Top-right
        [row, col - 1], [row, col + 1],         // Left, Right
        [row + 1, col], [row + 1, col + 1]      // Bottom-left, Bottom-right
      );
    }
    return neighbors.filter(([r, c]) => {
      const rowWidth = (r % 2 === 0) ? 9 : 8;
      return r >= 0 && r < 19 && c >= 0 && c < rowWidth;
    });
  };

  // Lightning power-up activation
  const activateLightning = () => {
    if (!lightningActive) {
      setLightningActive(true);
      setHasLightningPower(true);
      // Deactivate others
      setBombActive(false); setHasBombPower(false);
      setFreezeActive(false); setHasFreezePower(false);
      setFireActive(false); setHasFirePower(false);
    }
  };

  // Bomb power-up activation
  const activateBomb = () => {
    if (!bombActive) {
      setBombActive(true);
      setHasBombPower(true);
      // Deactivate others
      setLightningActive(false); setHasLightningPower(false);
      setFreezeActive(false); setHasFreezePower(false);
      setFireActive(false); setHasFirePower(false);
    }
  };

  const activateFreeze = () => {
    if (!freezeActive) {
      setFreezeActive(true);
      setHasFreezePower(true);
      // Deactivate others
      setLightningActive(false); setHasLightningPower(false);
      setBombActive(false); setHasBombPower(false);
      setFireActive(false); setHasFirePower(false);
    }
  };

  const activateFire = () => {
    if (!fireActive) {
      setFireActive(true);
      setHasFirePower(true);
      // Deactivate others
      setLightningActive(false); setHasLightningPower(false);
      setBombActive(false); setHasBombPower(false);
      setFreezeActive(false); setHasFreezePower(false);
    }
  };

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
    const metalGridConfig = getLevelMetalGridConfig(level);
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
    const bgColors = COLORS;
    const bubblesOfTargetColor: any[] = [];

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
            color = "#af52de"; // Purple Planet for Border
          } else {
            color = "#ffd60a"; // Yellow Planet for Interior
          }
        }

        const bubble = {
          id: `b-${r}-${c}-${Date.now()}`,
          row: r, col: c, x, y,
          color,
          visible: true,
          hasMetalGrid: false,
          isFrozen: false,
          hitsRemaining: 1,
          maxHits: 1
        };

        // Collect bubbles of the target color for metal grid assignment
        if (metalGridConfig.color && color.toLowerCase() === metalGridConfig.color.toLowerCase()) {
          bubblesOfTargetColor.push(bubble);
        }

        grid.push(bubble);
      }
    }

    // 4. Assign metal grid protection to ALL bubbles of the target color
    if (metalGridConfig.color && bubblesOfTargetColor.length > 0) {
      // Protect ALL bubbles of the target color (100%)
      bubblesOfTargetColor.forEach(bubble => {
        bubble.hasMetalGrid = true;
        bubble.hitsRemaining = 2;
        bubble.maxHits = 2;
      });
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
    setMoves(getLevelMoves(level));
    setGameState('playing');

    // Auto-Scroll to center the pattern securely
    const maxY = Math.max(...grid.map(b => b.y));
    const targetY = SCREEN_HEIGHT * 0.45; // Target lowest bubble at 45% of screen height
    const initialScroll = targetY - maxY;

    scrollY.setValue(centeredRevealScroll);
    currentScrollY.current = initialScroll;

    // 2. Wait 0.5 second for the player to see the pattern, then slide up to position
    setTimeout(() => {
      Animated.spring(scrollY, {
        toValue: initialScroll,
        tension: 10,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }, 500);

  }, [level, scrollY]);

  const isGameInitialized = useRef(false);
  useEffect(() => {
    if (!isGameInitialized.current) {
      initGame();
      isGameInitialized.current = true;
    }
  }, [initGame]);



  const updateAim = (pageX: number, pageY: number) => {
    if (isProcessing.current || !isAiming.current || gameState !== 'playing') return;
    if (showHint) setShowHint(false);

    // Origin for tracer - start closer to the cannon, reducing distance between tracer and shooter
    const startX = cannonPos.x;
    const startY = cannonPos.y + 15; // Move tracer start point closer to cannon by 15 pixels

    const dx = pageX - startX;
    const dy = pageY - startY;

    // Boundary check for aiming angle - only allow touches ABOVE the cannon
    if (pageY > cannonPos.y) return;

    const angle = Math.atan2(dy, dx);
    setCannonAngle(angle + Math.PI / 2);

    const dots = [];
    let tx = startX; let ty = startY;
    let vx = Math.cos(angle) * 8; let vy = Math.sin(angle) * 8;
    let hitPoint = null;

    for (let i = 0; i < 200; i++) {
      tx += vx; ty += vy;
      if (tx < BUBBLE_SIZE / 2 || tx > SCREEN_WIDTH - BUBBLE_SIZE / 2) vx *= -1;

      const hitIdx = bubblesRef.current.findIndex(b => b.visible && Math.sqrt((tx - b.x) ** 2 + (ty - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.85);

      if (hitIdx !== -1 || ty < GRID_TOP) {
        hitPoint = { x: tx, y: ty };
        break;
      }
      // Add dots every 3 iterations to increase distance between them
      if (i % 3 === 0) {
        dots.push({ x: tx, y: ty, opacity: Math.max(0.3, 1 - i / 300) });
      }
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
    if (!isAiming.current || isProcessing.current || gameState !== 'playing') return;
    isAiming.current = false;
    setIsAimingState(false);

    // Clear aim indicators when starting the shot
    setAimDots([]);
    setTargetSlot(null);

    isProcessing.current = true;

    muzzleFlashAnim.setValue(1);

    // Quick flash only, no expanding pulse
    Animated.timing(muzzleFlashAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();

    // Add pulse ring animation
    pulseRingAnim.setValue(0);
    Animated.timing(pulseRingAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();

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
      color: nextColor,
      hasLightning: hasLightningPower, // Add lightning power to the shot
      hasBomb: hasBombPower, // Add bomb power to the shot
      hasFreeze: hasFreezePower,
      hasFire: hasFirePower,
    };

    // Reset power-ups after use
    if (hasLightningPower) {
      setHasLightningPower(false);
      setLightningActive(false);
    }
    if (hasBombPower) {
      setHasBombPower(false);
      setBombActive(false);
    }
    if (hasFreezePower) {
      setHasFreezePower(false);
      setFreezeActive(false);
    }
    if (hasFirePower) {
      setHasFirePower(false);
      setFireActive(false);
    }

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
    // Lightning Power: Check if we hit an existing bubble
    if (shot.hasLightning) {
      const hitBubble = bubblesRef.current.find(b =>
        b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
      );

      if (hitBubble) {
        // Destroy the entire row where the bubble was hit, but skip metal grid bubbles
        const targetRow = hitBubble.row;
        const grid = [...bubblesRef.current];
        const bubblesInRow = grid.filter(b => b.visible && b.row === targetRow);

        // Destroy all bubbles in the hit row, except those with metal grid protection
        const destroyedBubbles: any[] = [];
        bubblesInRow.forEach(bubble => {
          if (!bubble.hasMetalGrid) {
            // Normal bubble - destroy it
            bubble.visible = false;
            destroyedBubbles.push(bubble);
            // Lightning effect animation
            if (bubble.anim) {
              Animated.sequence([
                Animated.timing(bubble.anim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
                Animated.timing(bubble.anim, { toValue: 0, duration: 200, useNativeDriver: true })
              ]).start();
            }
          } else {
            // Metal grid bubble - lightning bounces off, show bounce effect
            if (bubble.anim) {
              Animated.sequence([
                Animated.timing(bubble.anim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
                Animated.spring(bubble.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
              ]).start();
            }
          }
        });

        // Score only for destroyed bubbles (not metal grid ones)
        setScore(s => s + destroyedBubbles.length * 15); // Higher score for lightning

        // Check for floating bubbles after row destruction
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

        grid.forEach(b => {
          if (b.visible && !connected.has(b.id)) {
            b.visible = false;
            setScore(s => s + 5);
          }
        });

        // Update the grid and continue with normal flow
        bubblesRef.current = grid;
        setBubbles([...grid]);
        setShootingBubble(null);
        setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setMoves(m => Math.max(0, m - 1));

        // Check Win/Loss
        const remainingBubbles = grid.filter(b => b.visible).length;
        if (remainingBubbles === 0) {
          setGameState('won');
        } else if (moves - 1 <= 0) {
          setGameState('lost');
        }

        // Re-center view
        const visibleBubbles = grid.filter(b => b.visible);
        if (visibleBubbles.length > 0) {
          const maxY = Math.max(...visibleBubbles.map(b => b.y));
          const targetScreenY = SCREEN_HEIGHT * 0.45;
          const targetScrollY = targetScreenY - maxY;
          currentScrollY.current = targetScrollY;
          Animated.spring(scrollY, {
            toValue: currentScrollY.current,
            tension: 40,
            friction: 7,
            useNativeDriver: true
          }).start();
        }

        isProcessing.current = false;
        return; // Exit early for lightning
      }
    }

    // Bomb Power: Check if we hit an existing bubble
    if (shot.hasBomb) {
      const hitBubble = bubblesRef.current.find(b =>
        b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
      );

      if (hitBubble) {
        // Destroy the hit bubble and its hexagonal neighbors, bomb can blast through metal grid
        const grid = [...bubblesRef.current];
        const bubblesDestroyed: any[] = [];

        // Bomb can destroy any bubble, including metal grid ones
        bubblesDestroyed.push(hitBubble);

        // Get hexagonal neighbors of the hit bubble
        const neighbors = getHexNeighbors(hitBubble.row, hitBubble.col);
        neighbors.forEach(([r, c]) => {
          const neighborBubble = grid.find(b => b.visible && b.row === r && b.col === c);
          if (neighborBubble) {
            // Bomb destroys all neighbors, including metal grid ones
            bubblesDestroyed.push(neighborBubble);
          }
        });

        // Destroy all affected bubbles (including metal grid ones)
        bubblesDestroyed.forEach(bubble => {
          bubble.visible = false;
          // Bomb explosion animation
          if (bubble.anim) {
            Animated.sequence([
              Animated.timing(bubble.anim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
              Animated.timing(bubble.anim, { toValue: 0, duration: 250, useNativeDriver: true })
            ]).start();
          }
        });

        // Score for destroyed bubbles (including metal grid ones)
        setScore(s => s + bubblesDestroyed.length * 12); // Medium score for bomb

        // Check for floating bubbles after explosion
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

        grid.forEach(b => {
          if (b.visible && !connected.has(b.id)) {
            b.visible = false;
            setScore(s => s + 5);
          }
        });

        // Update the grid and continue with normal flow
        bubblesRef.current = grid;
        setBubbles([...grid]);
        setShootingBubble(null);
        setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setMoves(m => Math.max(0, m - 1));

        // Check Win/Loss
        const remainingBubbles = grid.filter(b => b.visible).length;
        if (remainingBubbles === 0) {
          setGameState('won');
        } else if (moves - 1 <= 0) {
          setGameState('lost');
        }

        // Re-center view
        const visibleBubbles = grid.filter(b => b.visible);
        if (visibleBubbles.length > 0) {
          const maxY = Math.max(...visibleBubbles.map(b => b.y));
          const targetScreenY = SCREEN_HEIGHT * 0.45;
          const targetScrollY = targetScreenY - maxY;
          currentScrollY.current = targetScrollY;
          Animated.spring(scrollY, {
            toValue: currentScrollY.current,
            tension: 40,
            friction: 7,
            useNativeDriver: true
          }).start();
        }

        isProcessing.current = false;
        return; // Exit early for bomb
      }
    }

    // Freeze Power
    if (shot.hasFreeze) {
      const hitBubble = bubblesRef.current.find(b =>
        b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
      );

      if (hitBubble) {
        const grid = [...bubblesRef.current];
        // Identify "Vertical Column"
        // Find bubbles that are vertically aligned (similar X) and above the hit bubble
        const xThreshold = BUBBLE_SIZE * 0.3;
        const targetBubbles = grid.filter(b =>
          b.visible &&
          Math.abs(b.x - hitBubble.x) < xThreshold &&
          b.row <= hitBubble.row &&
          b.row >= hitBubble.row - 3 // Up to 3 rows up
        );

        targetBubbles.forEach(b => {
          b.isFrozen = true;
          // Flash animation
          if (b.anim) {
            Animated.sequence([
              Animated.timing(b.anim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
              Animated.timing(b.anim, { toValue: 1, duration: 250, useNativeDriver: true })
            ]).start();
          }
        });

        bubblesRef.current = grid;
        setBubbles([...grid]);
        setShootingBubble(null);
        setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setMoves(m => Math.max(0, m - 1));
        isProcessing.current = false;
        return;
      }
    }

    // Fire Power
    if (shot.hasFire) {
      const hitBubble = bubblesRef.current.find(b =>
        b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
      );

      if (hitBubble) {
        const grid = [...bubblesRef.current];

        if (hitBubble.isFrozen) {
          // ICE SMASH! Destroy frozen bubbles in this column
          const xThreshold = BUBBLE_SIZE * 0.3;
          const frozenInColumn = grid.filter(b =>
            b.visible && b.isFrozen &&
            Math.abs(b.x - hitBubble.x) < xThreshold
          );

          frozenInColumn.forEach(b => {
            b.visible = false;
            // Explosion effect? 
          });
          setScore(s => s + frozenInColumn.length * 20); // Bonus for Ice Smash
        } else {
          // Normal Fire behavior - maybe destroy radius 1? (Mini Bomb)
          // For now, let's make it act like a strong hit - destroy hit bubble even if metal?
          // Or just standard destruction.
          hitBubble.visible = false;
          setScore(s => s + 10);
        }

        // Check floating
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

        grid.forEach(b => {
          if (b.visible && !connected.has(b.id)) {
            b.visible = false;
            setScore(s => s + 5);
          }
        });

        bubblesRef.current = grid;
        setBubbles([...grid]);
        setShootingBubble(null);
        setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setMoves(m => Math.max(0, m - 1));

        // Win/Loss
        const remainingBubbles = grid.filter(b => b.visible).length;
        if (remainingBubbles === 0) setGameState('won');
        else if (moves - 1 <= 0) setGameState('lost');

        // Scroll
        const visibleBubbles = grid.filter(b => b.visible);
        if (visibleBubbles.length > 0) {
          const maxY = Math.max(...visibleBubbles.map(b => b.y));
          const targetScreenY = SCREEN_HEIGHT * 0.45;
          const targetScrollY = targetScreenY - maxY;
          currentScrollY.current = targetScrollY;
          Animated.spring(scrollY, {
            toValue: currentScrollY.current,
            tension: 40,
            friction: 7,
            useNativeDriver: true
          }).start();
        }

        isProcessing.current = false;
        return;
      }
    }

    // Normal landing logic for non-power shots or power shots that don't hit anything
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
    const newB = {
      id: `b-${Date.now()}`,
      row: best.r,
      col: best.c,
      x,
      y,
      color: shot.color,
      visible: true,
      anim: hitAnim,
      hasMetalGrid: false,
      isFrozen: false,
      hitsRemaining: 1,
      maxHits: 1
    };
    const grid = [...bubblesRef.current, newB];

    // Trigger Impact Animation for the landed bubble
    Animated.spring(hitAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true
    }).start();

    // Bomb Power: Destroy hexagonal neighbors if shot lands with bomb power
    if (shot.hasBomb) {
      const bubblesDestroyed = [newB]; // Always destroy the landing bubble

      // Get hexagonal neighbors of the landing position
      const neighbors = getHexNeighbors(best.r, best.c);
      neighbors.forEach(([r, c]) => {
        const neighborBubble = grid.find(b => b.visible && b.row === r && b.col === c);
        if (neighborBubble) {
          // Bomb destroys all neighbors, including metal grid ones
          bubblesDestroyed.push(neighborBubble);
        }
      });

      // Destroy all affected bubbles (including metal grid ones)
      bubblesDestroyed.forEach(bubble => {
        bubble.visible = false;
        // Bomb explosion animation
        if (bubble.anim) {
          Animated.sequence([
            Animated.timing(bubble.anim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
            Animated.timing(bubble.anim, { toValue: 0, duration: 250, useNativeDriver: true })
          ]).start();
        }
      });

      // Score for destroyed bubbles (including metal grid ones)
      setScore(s => s + bubblesDestroyed.length * 12); // Medium score for bomb

      // Check for floating bubbles after explosion
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

      grid.forEach(b => {
        if (b.visible && !connected.has(b.id)) {
          b.visible = false;
          setScore(s => s + 5);
        }
      });

    } else {
      // Normal bubble matching logic
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
        // Fix case sensitivity issue in color comparison
        const neighbors = grid.filter(g => g.visible && !visited.has(g.id) && g.color.toLowerCase() === newB.color.toLowerCase() && Math.sqrt((b.x - g.x) ** 2 + (b.y - g.y) ** 2) < BUBBLE_SIZE * 1.2);
        neighbors.forEach(n => { visited.add(n.id); match.push(n); stack.push(n); });
      }

      if (match.length >= 3) {
        // Handle metal grid protection - reduce hits instead of immediate destruction
        const bubblesDestroyed: any[] = [];
        const bubblesHit: any[] = [];

        match.forEach(m => {
          if (m.hasMetalGrid && m.hitsRemaining > 1) {
            // Metal grid bubble hit - remove the metal grid and reduce hits
            m.hitsRemaining -= 1;
            m.hasMetalGrid = false; // Remove metal grid after first hit
            bubblesHit.push(m);

            // Visual feedback for metal grid removal
            if (m.anim) {
              Animated.sequence([
                Animated.timing(m.anim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
                Animated.spring(m.anim, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true })
              ]).start();
            }
          } else {
            // Normal bubble or metal grid bubble with 1 hit remaining - destroy it
            m.visible = false;
            bubblesDestroyed.push(m);
          }
        });

        // Score only for destroyed bubbles
        setScore(s => s + bubblesDestroyed.length * 10);

        // 2. FLOATING LOGIC - only check if any bubbles were actually destroyed
        if (bubblesDestroyed.length > 0) {
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

          grid.forEach(b => {
            if (b.visible && !connected.has(b.id)) {
              b.visible = false;
              setScore(s => s + 5);
            }
          });
        }
      }
    } // Close the else block for normal matching logic

    setMoves(m => Math.max(0, m - 1));

    // DYNAMIC RE-CENTERING LOGIC
    // Recalculate grid bounds based on visibility
    const visibleBubbles = grid.filter(b => b.visible);
    if (visibleBubbles.length > 0) {
      const maxY = Math.max(...visibleBubbles.map(b => b.y));
      // Target: Lowest bubble at 45% of screen height
      const targetScreenY = SCREEN_HEIGHT * 0.45;
      const targetScrollY = targetScreenY - maxY;

      currentScrollY.current = targetScrollY;
      Animated.spring(scrollY, {
        toValue: currentScrollY.current,
        tension: 40,
        friction: 7,
        useNativeDriver: true
      }).start();
    }

    bubblesRef.current = grid;
    setBubbles([...grid]);
    setShootingBubble(null);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);

    // Check Win/Loss
    const remainingBubbles = grid.filter(b => b.visible).length;
    if (remainingBubbles === 0) {
      setGameState('won');
    } else if (moves - 1 <= 0) {
      setGameState('lost');
    }

    isProcessing.current = false;
  };

  const restartLevel = () => {
    initGame();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <SpaceBackground />

      {/* NEW UNIFIED TOP HUD CARD */}
      <View style={styles.hudTopContainer}>
        <View style={styles.topCard}>
          {/* Moves */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MOVES</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>

          {/* Vertical Divider */}
          <View style={styles.verticalDivider} />

          {/* Score */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>

          {/* Vertical Divider */}
          <View style={styles.verticalDivider} />

          {/* Stars (Progress Based) */}
          <View style={styles.starContainer}>
            <MaterialIcon
              name={score > 100 ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
              family={GAME_ICONS.STAR.family}
              size={ICON_SIZES.MEDIUM}
              color={score > 100 ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
            />
            <MaterialIcon
              name={score > 500 ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
              family={GAME_ICONS.STAR.family}
              size={ICON_SIZES.MEDIUM}
              color={score > 500 ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
            />
            <MaterialIcon
              name={score > 1000 ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
              family={GAME_ICONS.STAR.family}
              size={ICON_SIZES.MEDIUM}
              color={score > 1000 ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
            />
          </View>

          {/* Exit Button */}
          <TouchableOpacity style={styles.topExitBtn} onPress={onBackPress}>
            <MaterialIcon
              name={GAME_ICONS.CLOSE.name}
              family={GAME_ICONS.CLOSE.family}
              size={ICON_SIZES.MEDIUM}
              color={ICON_COLORS.ERROR}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Center: U-Shape Command Card */}
      <View style={styles.hudBottomContainer}>
        <View style={styles.uCard}>

          {/* Left Wing: Abilities */}
          <View style={styles.uWingLeft}>
            <TouchableOpacity
              style={[styles.abilityBtn, lightningActive && styles.abilityBtnActive]}
              onPress={activateLightning}
            >
              <MaterialIcon
                name={GAME_ICONS.LIGHTNING.name}
                family={GAME_ICONS.LIGHTNING.family}
                size={ICON_SIZES.MEDIUM}
                color={lightningActive ? ICON_COLORS.SECONDARY : ICON_COLORS.PRIMARY}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.abilityBtn, freezeActive && styles.abilityBtnActive]}
              onPress={activateFreeze}
            >
              <MaterialIcon
                name={GAME_ICONS.FREEZE.name}
                family={GAME_ICONS.FREEZE.family}
                size={ICON_SIZES.MEDIUM}
                color={freezeActive ? ICON_COLORS.SECONDARY : ICON_COLORS.INFO}
              />
            </TouchableOpacity>
          </View>

          {/* Center: Ammo (The Core) */}
          <View style={styles.uCenterAmmo}>
            <View style={styles.ammoRing}>
              <View style={[styles.ammoBubble, { backgroundColor: nextColor }]} />
            </View>
          </View>

          {/* Right Wing: More Abilities */}
          <View style={styles.uWingRight}>
            <TouchableOpacity
              style={[styles.abilityBtn, fireActive && styles.abilityBtnActive]}
              onPress={activateFire}
            >
              <MaterialIcon
                name={GAME_ICONS.FIRE.name}
                family={GAME_ICONS.FIRE.family}
                size={ICON_SIZES.MEDIUM}
                color={fireActive ? ICON_COLORS.SECONDARY : ICON_COLORS.ERROR}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.abilityBtn, bombActive && styles.abilityBtnActive]}
              onPress={activateBomb}
            >
              <MaterialIcon
                name={GAME_ICONS.BOMB.name}
                family={GAME_ICONS.BOMB.family}
                size={ICON_SIZES.MEDIUM}
                color={bombActive ? ICON_COLORS.SECONDARY : ICON_COLORS.WARNING}
              />
            </TouchableOpacity>
          </View>

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



        {shootingBubble && (
          <Bubble
            x={shootingBubble.x}
            y={shootingBubble.y}
            color={shootingBubble.color}
            hasLightning={shootingBubble.hasLightning}
            hasBomb={shootingBubble.hasBomb}
            hasFreeze={shootingBubble.hasFreeze}
            hasFire={shootingBubble.hasFire}
            isFrozen={false} // Shooting bubble itself isn't frozen usually
          />
        )}

        <View style={styles.footer}>
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

          <Animated.View style={[
            styles.cannon,
            { transform: [{ translateY: recoilAnim }] }
          ]}>
            {/* Pulse Ring around Spaceship */}
            <Animated.View style={[
              styles.pulseRing,
              {
                borderColor: nextColor,
                opacity: pulseRingAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.8, 0]
                }),
                transform: [
                  {
                    scale: pulseRingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.5]
                    })
                  }
                ]
              }
            ]} />

            <LottieView
              source={require("../images/Spaceship.json")}
              autoPlay
              loop
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
          {showHint && (
            <View style={styles.hintContainer} pointerEvents="none">
              <Text style={styles.hintText}>TOUCH & DRAG TO AIM</Text>
            </View>
          )}
        </View>
      </View>

      {/* Game Over / Win Modal */}
      {gameState !== 'playing' && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {gameState === 'won' ? 'LEVEL CLEARED!' : 'OUT OF MOVES'}
            </Text>

            {gameState === 'won' && (
              <View style={styles.modalStars}>
                <MaterialIcon
                  name={score > 100 ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
                  family={GAME_ICONS.STAR.family}
                  size={40}
                  color={score > 100 ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
                />
                <MaterialIcon
                  name={score > 500 ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
                  family={GAME_ICONS.STAR.family}
                  size={50}
                  color={score > 500 ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
                />
                <MaterialIcon
                  name={score > 1000 ? GAME_ICONS.STAR.name : GAME_ICONS.STAR_OUTLINE.name}
                  family={GAME_ICONS.STAR.family}
                  size={40}
                  color={score > 1000 ? ICON_COLORS.GOLD : ICON_COLORS.DISABLED}
                />
              </View>
            )}

            <Text style={styles.modalScore}>SCORE: {score}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={onBackPress}>
                <MaterialIcon
                  name={GAME_ICONS.HOME.name}
                  family={GAME_ICONS.HOME.family}
                  size={ICON_SIZES.LARGE}
                  color={ICON_COLORS.WHITE}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={restartLevel}>
                <MaterialIcon
                  name={GAME_ICONS.RESTART.name}
                  family={GAME_ICONS.RESTART.family}
                  size={ICON_SIZES.LARGE}
                  color={ICON_COLORS.WHITE}
                />
              </TouchableOpacity>
              {gameState === 'won' && (
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={restartLevel}>
                  {/* Placeholder for Next Level - currently restarts */}
                  <MaterialIcon
                    name={GAME_ICONS.NEXT.name}
                    family={GAME_ICONS.NEXT.family}
                    size={ICON_SIZES.LARGE}
                    color={ICON_COLORS.WHITE}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Command Deck Styles
  // NEW HUD STYLES
  hudTopContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 60,
  },
  topCard: {
    flexDirection: 'row',
    width: '90%',
    height: 60,
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00E0FF', // Neon Cyan
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  verticalDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
  topExitBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },

  hudBottomContainer: {
    position: 'absolute',
    bottom: 40, // Lifted slightly
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  uCard: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to bottom
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderRadius: 35,
    borderWidth: 2, // Thicker border for neon effect
    borderColor: '#00E0FF', // Neon Cyan
    gap: 15,
    shadowColor: '#00E0FF', // Neon glow
    shadowOffset: { width: 0, height: 0 }, // All-around glow
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
  },
  uWingLeft: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 5,
  },
  uWingRight: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 5,
  },
  uCenterAmmo: {
    marginBottom: 10, // Push ammo up
  },
  ammoRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 224, 255, 0.1)', // Slight cyan tint
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00E0FF', // Neon
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  ammoBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },

  // Reused text styles
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  iconText: {
    fontSize: 18,
    color: '#fff',
  },
  abilityBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 224, 255, 0.1)', // Slight cyan tint
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00E0FF', // Neon
  },
  abilityBtnActive: {
    backgroundColor: 'rgba(255, 214, 10, 0.3)', // Yellow tint when active
    borderColor: '#FFD60A', // Yellow border when active
  },
  abilityText: {
    fontSize: 20,
  },

  pulsatingDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },

  gameArea: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.8, resizeMode: 'cover' },
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
  simpleBubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Minimal styling for performance
  },
  shine: { position: "absolute", top: "15%", left: "15%", width: "25%", height: "25%", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 10 },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 100, // Render ABOVE the cannon/spaceship so dots are visible immediately
  },
  hintContainer: {
    position: 'absolute',
    bottom: 150,
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
  footer: { position: "absolute", bottom: FOOTER_BOTTOM, width: "100%", alignItems: "center" },
  cannon: {
    width: CANNON_SIZE,
    height: CANNON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  pulseRing: {
    position: 'absolute',
    width: CANNON_SIZE + 20,
    height: CANNON_SIZE + 20,
    borderRadius: (CANNON_SIZE + 20) / 2,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    zIndex: 5, // Behind the spaceship but visible
  },
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
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalStars: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScore: {
    fontSize: 20,
    color: '#fbbf24',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBtnSecondary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 0,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Metal Grid Overlay Styles - Circular Design
  metalGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: BUBBLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Very subtle dark overlay to show metal effect
  },

  // Outer metal ring
  metalOuterRing: {
    position: 'absolute',
    width: '95%',
    height: '95%',
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(139, 139, 139, 0.8)', // Semi-transparent silver
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },

  // Inner metal ring
  metalInnerRing: {
    position: 'absolute',
    width: '75%',
    height: '75%',
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 168, 168, 0.7)', // Semi-transparent lighter silver
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },

  // Container for rotating cross pattern
  metalCrossContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cross pattern - horizontal
  metalCrossHorizontal: {
    position: 'absolute',
    width: '60%',
    height: 2,
    backgroundColor: 'rgba(144, 144, 144, 0.7)', // Semi-transparent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },

  // Cross pattern - vertical
  metalCrossVertical: {
    position: 'absolute',
    width: 2,
    height: '60%',
    backgroundColor: 'rgba(144, 144, 144, 0.7)', // Semi-transparent
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },

  // Diagonal cross 1
  metalDiagonal1: {
    position: 'absolute',
    width: '50%',
    height: 1.5,
    backgroundColor: 'rgba(122, 122, 122, 0.6)', // Semi-transparent
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },

  // Diagonal cross 2
  metalDiagonal2: {
    position: 'absolute',
    width: '50%',
    height: 1.5,
    backgroundColor: 'rgba(122, 122, 122, 0.6)', // Semi-transparent
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },

  // Metal bolts at corners
  metalBolt: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(107, 107, 107, 0.8)', // Semi-transparent
    borderWidth: 0.5,
    borderColor: 'rgba(74, 74, 74, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 1,
  },

  // Metallic shine effect
  metallicShine: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: '25%',
    height: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // More subtle shine
    borderRadius: 10,
    transform: [{ rotate: '-30deg' }],
    opacity: 0.5,
  },

  // Lightning effect overlay
  lightningEffect: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 214, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD60A',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    zIndex: 20,
  },

  // Bomb effect overlay
  bombEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    zIndex: 20,
  },

  // Freeze effect overlay
  freezeEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 224, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    zIndex: 20,
  },

  // Fire effect overlay
  fireEffect: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    zIndex: 20,
  },
  // Ice Overlay
  iceOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 255, 255, 0.3)',
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#00ffff',
    zIndex: 15,
  },
  iceGlaze: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  iceShine: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '30%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
  },
  iceCrystal1: {
    position: 'absolute',
    bottom: '20%',
    right: '20%',
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }]
  },
  iceCrystal2: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }]
  },
});

export default GameScreen;