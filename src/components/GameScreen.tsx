import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, StyleSheet, Dimensions, Image, Text, StatusBar, Animated, TouchableOpacity,
} from "react-native";
import LottieView from 'lottie-react-native';
import SpaceBackground from "./SpaceBackground";
import LaserTracer from "./LaserTracer"; // Import LaserTracer
import BubbleBlast from "./BubbleBlast"; // Import BubbleBlast animation
import MaterialIcon from "./MaterialIcon";
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from "../config/icons";
import { Bubble, BubbleGrid, PulsatingBorder } from "./game/GameGridComponents";
import { GameHUD } from "./game/GameHUD";
import ImprovedLaserBeam from "./game/ImprovedLaserBeam"; // New improved laser design
import LaserBall from "./game/LaserBall"; // New shooting ball design

import { getLevelPattern, getLevelMoves, getLevelMetalGridConfig, COLORS } from "../data/levelPatterns";
import { getPos, getHexNeighbors } from "../utils/gameUtils";
import { resolveLanding as executeResolveLanding } from "../logic/LandingLogic";

import {
  styles,
  BUBBLE_SIZE,
  ROW_HEIGHT,
  CANNON_SIZE,
  FOOTER_BOTTOM,
  GRID_TOP,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GRID_COLS
} from "../styles/GameScreenStyles";

const COLOR_MAP: Record<string, any> = {
  "#ff3b30": require("../images/red.webp"),
  "#ff9500": require("../images/orange.webp"),
  "#ffd60a": require("../images/yellow.webp"),
  "#34c759": require("../images/green.webp"),
  "#007aff": require("../images/blue.webp"),
  "#af52de": require("../images/purple.webp"),
};



const GameScreen = ({ onBackPress, level = 1 }: { onBackPress?: () => void, level?: number }) => {
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [blasts, setBlasts] = useState<any[]>([]); // State for explosion effects

  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [showHint, setShowHint] = useState(true);
  const cannonAngleRef = useRef(0);

  const scrollY = useRef(new Animated.Value(-100)).current;
  const currentScrollY = useRef(-100);
  const bubblesRef = useRef<any[]>([]);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  // Shared Animation Values
  const metalPulseAnim = useRef(new Animated.Value(1)).current;
  const metalRotateAnim = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Shared loop for metal grid
    Animated.loop(
      Animated.sequence([
        Animated.timing(metalPulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(metalPulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(metalRotateAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();

    // Shared loop for border
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(borderPulse, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
  const shootingRef = useRef<View>(null);
  const cannonRef = useRef<View>(null);
  const aimLineRef = useRef<View>(null);
  const aimSegmentRefs = useRef<any[]>([]); // Refs for segments
  const ghostRef = useRef<any>(null); // Ref for ghost bubble

  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const muzzleVelocityAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current; // For Screen Shake
  const bloomAnim = useRef(new Animated.Value(0)).current; // For Light Bloom

  const cannonPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - FOOTER_BOTTOM - CANNON_SIZE / 2 };



  const removeBlast = (id: string) => {
    setBlasts(prev => prev.filter(b => b.id !== id));
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
        // User Request: "make yellow balls also in metal grid"
        if ((metalGridConfig.color && color.toLowerCase() === metalGridConfig.color.toLowerCase()) || color.toLowerCase() === "#ffd60a") {
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

    // Origin for tracer - start at the TOP of the spaceship (no gap)
    const startX = cannonPos.x;
    const startY = cannonPos.y - (CANNON_SIZE / 2); // Start from top edge of spaceship

    const dx = pageX - startX;
    const dy = pageY - startY;

    // Boundary check for aiming angle
    if (pageY > cannonPos.y - 15) return;

    const angle = Math.atan2(dy, dx);
    cannonAngleRef.current = angle + Math.PI / 2;
    if (cannonRef.current) {
      cannonRef.current.setNativeProps({
        style: { transform: [{ rotate: `${cannonAngleRef.current}rad` }] }
      });
    }

    const segments = [];
    let tx = startX; let ty = startY;
    // Step size 10 for both aim and shot for perfect path sync
    let vx = Math.cos(angle) * 10; let vy = Math.sin(angle) * 10;
    let hitPoint = null;
    let segStartX = tx;
    let segStartY = ty;

    for (let i = 0; i < 200; i++) {
      tx += vx; ty += vy;
      let bounced = false;

      // Harmonized bounce with direction check and clamping
      if (tx < BUBBLE_SIZE / 2 && vx < 0) {
        tx = BUBBLE_SIZE / 2;
        vx *= -1;
        bounced = true;
      } else if (tx > SCREEN_WIDTH - BUBBLE_SIZE / 2 && vx > 0) {
        tx = SCREEN_WIDTH - BUBBLE_SIZE / 2;
        vx *= -1;
        bounced = true;
      }

      const currentBubbles = bubblesRef.current || [];
      const hitIdx = currentBubbles.findIndex(b => b.visible && Math.sqrt((tx - b.x) ** 2 + (ty - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.85);

      if (hitIdx !== -1 || ty < GRID_TOP) {
        hitPoint = { x: tx, y: ty };
        // End final segment
        segments.push({
          x1: segStartX, y1: segStartY,
          x2: tx, y2: ty,
          opacity: 1 - i / 300
        });
        break;
      }

      if (bounced) {
        // End current segment at bounce point
        segments.push({
          x1: segStartX, y1: segStartY,
          x2: tx, y2: ty,
          opacity: 1 - i / 300
        });
        segStartX = tx;
        segStartY = ty;
      }
    }
    // 3. UPDATE AIM UI VIA NATIVE PROPS (ZERO RE-RENDERS)
    segments.forEach((seg, idx) => {
      const ref = aimSegmentRefs.current?.[idx];
      if (ref) {
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ref.setNativeProps({
          style: {
            opacity: Math.max(0.4, seg.opacity),
            width: length + 1, // +1 for overlap to fix "distrub" gaps
            transform: [
              { translateX: (seg.x1 + seg.x2) / 2 - (length + 1) / 2 },
              { translateY: (seg.y1 + seg.y2) / 2 - 2.5 },
              { rotate: `${angle}rad` }
            ]
          }
        });
      }
    });

    // Hide unused segments (pool of 12)
    for (let idx = segments.length; idx < 12; idx++) {
      const ref = aimSegmentRefs.current?.[idx];
      if (ref) ref.setNativeProps({ style: { opacity: 0 } });
    }

    if (hitPoint) {
      let best = { r: 0, c: 0, distSq: Infinity };
      const hitX = hitPoint.x;
      const hitY = hitPoint.y;
      const scrollOffset = currentScrollY.current;

      for (let r = 0; r < 35; r++) {
        const rowWidth = (r % 2 === 0) ? 9 : 8;
        for (let c = 0; c < rowWidth; c++) {
          if (bubblesRef.current?.some(b => b.visible && b.row === r && b.col === c)) continue;
          const coords = getPos(r, c);
          const dSq = (hitX - coords.x) ** 2 + (hitY - (coords.y + scrollOffset)) ** 2;
          if (dSq < best.distSq) best = { r, c, distSq: dSq };
        }
      }
      const finalPos = getPos(best.r, best.c);
      const ghostY = finalPos.y + scrollOffset;

      if (ghostRef.current) {
        ghostRef.current.setNativeProps({
          style: {
            opacity: 0.6,
            transform: [
              { translateX: finalPos.x - BUBBLE_SIZE / 2 },
              { translateY: ghostY - BUBBLE_SIZE / 2 }
            ]
          }
        });
      }
    } else {
      if (ghostRef.current) ghostRef.current.setNativeProps({ style: { opacity: 0 } });
    }
  };

  const onRelease = () => {
    if (!isAiming.current || isProcessing.current || gameState !== 'playing') return;
    isAiming.current = false;

    // Clear UI indicators via Refs (instantly) - pool of 12
    for (let i = 0; i < 12; i++) {
      if (aimSegmentRefs.current?.[i]) aimSegmentRefs.current[i]?.setNativeProps({ style: { opacity: 0 } });
    }
    if (ghostRef.current) ghostRef.current.setNativeProps({ style: { opacity: 0 } });

    isProcessing.current = true;

    muzzleFlashAnim.setValue(1);

    // Quick flash only, no expanding pulse
    Animated.timing(muzzleFlashAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();

    // Trigger Screen Shake
    shakeAnim.setValue(0);
    Animated.timing(shakeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => shakeAnim.setValue(0));

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

    const angle = cannonAngleRef.current - Math.PI / 2;
    // Pushing velocity to 40 (4 steps of 10px each)
    const velocity = 40;
    // Start the shot from the TOP of spaceship - EXACT MATCH with laser start
    const shot = {
      x: cannonPos.x,
      y: cannonPos.y - (CANNON_SIZE / 2), // Matched with updateAim for perfect alignment
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: nextColor,
      hasLightning: hasLightningPower,
      hasBomb: hasBombPower,
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
      // 4 sub-steps of 10px each (matches aiming raycast resolution)
      for (let i = 0; i < 4; i++) {
        shot.x += shot.vx / 4;
        shot.y += shot.vy / 4;

        // Correct physics bounce logic (wall collision) with clamping
        if (shot.x < BUBBLE_SIZE / 2 && shot.vx < 0) {
          shot.x = BUBBLE_SIZE / 2;
          shot.vx *= -1;
        }
        if (shot.x > SCREEN_WIDTH - BUBBLE_SIZE / 2 && shot.vx > 0) {
          shot.x = SCREEN_WIDTH - BUBBLE_SIZE / 2;
          shot.vx *= -1;
        }

        const thresholdSq = (BUBBLE_SIZE * 0.85) ** 2; // Matches laser threshold
        const scrollOffset = currentScrollY.current;
        const hit = (bubblesRef.current || []).find(b => {
          if (!b.visible) return false;
          const dSq = (shot.x - b.x) ** 2 + (shot.y - (b.y + scrollOffset)) ** 2;
          return dSq < thresholdSq;
        });

        if (shot.y < GRID_TOP || hit) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          resolveLanding(shot);
          return;
        }
      }

      // Update shooting bubble position via Ref for 60fps smoothness WITHOUT re-render
      if (shootingRef.current) {
        const currentAngle = Math.atan2(shot.vy, shot.vx);
        shootingRef.current.setNativeProps({
          style: {
            transform: [
              { translateX: shot.x - 30 },
              { translateY: shot.y - 12 },
              { rotate: `${currentAngle}rad` }
            ]
          }
        });
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // Set initial shooting bubble state ONCE to mount the component
    setShootingBubble({ ...shot });
    rafRef.current = requestAnimationFrame(step);
  };

  const resolveLanding = (shot: any) => {
    executeResolveLanding(shot, {
      bubblesRef,
      setBubbles,
      setScore,
      setBlasts,
      setShootingBubble,
      setNextColor,
      setMoves,
      setGameState,
      currentScrollY,
      scrollY,
      isProcessing,
      moves
    });
  };

  const restartLevel = () => {
    initGame();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <SpaceBackground />

      <GameHUD
        score={score}
        moves={moves}
        level={level}
        nextColor={nextColor}
        onBackPress={onBackPress}
        abilities={{
          lightning: lightningActive,
          bomb: bombActive,
          freeze: freezeActive,
          fire: fireActive,
        }}
        onActivateLightning={activateLightning}
        onActivateBomb={activateBomb}
        onActivateFreeze={activateFreeze}
        onActivateFire={activateFire}
      />

      <View style={styles.gameArea} onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const { pageX, pageY } = e.nativeEvent;
          isAiming.current = true;
          updateAim(pageX, pageY);
        }}
        onResponderMove={(e) => updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onResponderRelease={onRelease}>

        {/* Wrap Game Area with Shake Animation */}
        <Animated.View style={{
          transform: [
            { translateY: scrollY },
            { translateX: shakeAnim.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -8, 8, -6, 6, 0] }) },
            { translateY: shakeAnim.interpolate({ inputRange: [0, 0.2, 0.5, 1], outputRange: [0, 5, -5, 0] }) }
          ]
        }}>
          <PulsatingBorder pulse={borderPulse} />
          <BubbleGrid bubbles={bubbles} metalPulseAnim={metalPulseAnim} metalRotateAnim={metalRotateAnim} />
          {/* Render Blasts INSIDE moving container */}
          {blasts.map(blast => (
            <BubbleBlast
              key={blast.id}
              x={blast.x}
              y={blast.y}
              color={blast.color}
              delay={blast.delay}
              onComplete={() => removeBlast(blast.id)}
            />
          ))}
        </Animated.View>

        {/* Enhanced Laser Tracer Line */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(idx => (
          <View
            key={`aim-${idx}`}
            ref={el => { if (aimSegmentRefs.current) aimSegmentRefs.current[idx] = el; }}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0, top: 0,
              height: 6, // Thicker for better visibility
              backgroundColor: nextColor,
              borderRadius: 3,
              opacity: 0,
              shadowColor: nextColor,
              shadowRadius: 12,
              shadowOpacity: 1,
              elevation: 12,
              zIndex: 99,
            }}
          >
            {/* Bright energy core */}
            <View style={{
              width: '100%',
              height: 3,
              backgroundColor: 'rgba(255,255,255,0.95)',
              marginTop: 1.5,
              borderRadius: 1.5,
              shadowColor: '#fff',
              shadowRadius: 6,
              shadowOpacity: 0.8,
            }} />
          </View>
        ))}

        {/* Ghost Prediction Bubble via Ref */}
        <View ref={ghostRef} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
          <Bubble x={BUBBLE_SIZE / 2} y={BUBBLE_SIZE / 2} color={nextColor} isGhost />
        </View>

        {shootingBubble && (
          <View
            ref={shootingRef}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 60,
              height: 24,
              zIndex: 100,
              transform: [
                { translateX: shootingBubble.x - 30 },
                { translateY: shootingBubble.y - 12 },
                { rotate: `${Math.atan2(shootingBubble.vy, shootingBubble.vx)}rad` }
              ]
            }}
          >
            {/* Improved Laser Beam */}
            <ImprovedLaserBeam color={shootingBubble.color} />

            {/* Laser Ball at the front */}
            <View style={{ position: 'absolute', right: -6, top: -6 }}>
              <LaserBall color={shootingBubble.color} size={36} />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {/* Muzzle Velocity Effect (Blast Wave) */}
          <Animated.View style={[
            styles.muzzleBlast,
            {
              opacity: muzzleVelocityAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
              transform: [
                { rotate: `${cannonAngleRef.current}rad` },
                { scale: muzzleVelocityAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) },
                { translateY: -60 }
              ]
            }
          ]} />

          <Animated.View
            ref={cannonRef}
            style={[
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

            {/* Lottie Spaceship */}
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

export default GameScreen;
