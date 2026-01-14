import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, StyleSheet, Dimensions, Image, Text, StatusBar, Animated, TouchableOpacity, ActivityIndicator,
} from "react-native";
import LottieView from 'lottie-react-native';
import SpaceBackground from "./SpaceBackground";
import BubbleBlast from "./BubbleBlast"; // Import BubbleBlast animation
import MaterialIcon from "./MaterialIcon";
import HelpSlider from "./HelpSlider";
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from "../config/icons";
import { Bubble, BubbleGrid, PulsatingBorder } from "./game/GameGridComponents";
import { GameHUD } from "./game/GameHUD";
import OptimizedLaser from "./game/OptimizedLaser";
import { useAuth } from '../context/AuthContext';
import SettingsService from '../services/SettingsService';
import ConfigService from '../services/ConfigService';

import { getLevelPattern, getLevelMoves, getLevelMetalGridConfig, COLORS } from "../data/levelPatterns";
import { getPos, getHexNeighbors } from "../utils/gameUtils";
import { resolveLanding as executeResolveLanding } from "../logic/LandingLogic";
import {
  calculateLaserGeometry,
  calculateAimingPath,
  findBestLandingSpot,
  createShotFromCannonCenter
} from "../utils/laserUtils";
import BackendService from "../services/BackendService";
import ConfirmationModal from "./ConfirmationModal";
import ToastNotification, { ToastRef } from "./ToastNotification";

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



const GameScreen = ({ onBackPress, level = 1, onLevelComplete, initialAbilities, initialStartingCounts, adRewardAmount = 50, levelReward = 10, starBonus = 5 }: {
  onBackPress?: () => void,
  level?: number,
  onLevelComplete?: (level: number, score: number, stars: number, coinsEarned?: number, action?: 'next' | 'home', sessionData?: any) => void,
  initialAbilities?: any,
  initialStartingCounts?: Record<string, number>,
  adRewardAmount?: number,
  levelReward?: number,
  starBonus?: number
}) => {
  const { user } = useAuth(); // Get Firebase user

  const [bubbles, setBubbles] = useState<any[]>([]);
  const [blasts, setBlasts] = useState<any[]>([]); // State for explosion effects

  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [moves, setMoves] = useState(30);
  const [showHint, setShowHint] = useState(true);
  const cannonAngleRef = useRef(0);

  // New laser system states
  const [aimDots, setAimDots] = useState<any[]>([]);
  const [ghostBubble, setGhostBubble] = useState({ x: 0, y: 0, visible: false });

  const scrollY = useRef(new Animated.Value(-100)).current;
  const currentScrollY = useRef(-100);
  const bubblesRef = useRef<any[]>([]);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  // Base abilities per level (2 of each) + any purchased abilities
  const [abilityInventory, setAbilityInventory] = useState(() => {
    if (initialAbilities) {
      return initialAbilities;
    }
    return {
      lightning: 0,
      bomb: 0,
      freeze: 0,
      fire: 0,
    };
  });
  const toastRef = useRef<ToastRef>(null);

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
  const [nextLevelLoading, setNextLevelLoading] = useState(false);
  const [homeLoading, setHomeLoading] = useState(false);

  const [abilitiesUsedCount, setAbilitiesUsedCount] = useState({
    lightning: 0,
    bomb: 0,
    freeze: 0,
    fire: 0
  });

  const [gameSettings, setGameSettings] = useState<any>(null);

  useEffect(() => {
    ConfigService.getGameConfig().then(config => {
      if (config?.gameSettings) {
        setGameSettings(config.gameSettings);
      }
    });
  }, []);

  // Progress tracking
  const lastProgressUpdate = useRef(0);
  const PROGRESS_UPDATE_INTERVAL = 3000; // Send progress every 3 seconds

  // Function to send progress updates to backend
  const sendProgressUpdate = useCallback(async (currentScore: number, currentMoves: number) => {
    if (!user || !BackendService.isAuthenticated()) return;



    const now = Date.now();
    if (now - lastProgressUpdate.current < PROGRESS_UPDATE_INTERVAL) return;

    // Use star thresholds from DB config
    const thresholds = gameSettings?.starThresholds || { one: 100, two: 400, three: 800 };
    const stars = currentScore >= thresholds.three ? 3 : currentScore >= thresholds.two ? 2 : currentScore >= thresholds.one ? 1 : 0;

    try {
      const result = await BackendService.updateGameProgress({
        level,
        score: currentScore,
        moves: currentMoves,
        stars
      });

      if (result.success) {
        console.log('Progress updated successfully');
        lastProgressUpdate.current = now;
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }, [user, level]);

  // Track score changes and send progress updates
  useEffect(() => {
    if (score > 0 && gameState === 'playing') {
      sendProgressUpdate(score, moves);
    }
  }, [score, moves, gameState, sendProgressUpdate]);

  // Submit game session when game ends (won or lost)
  useEffect(() => {
    if (gameState === 'won' || gameState === 'lost') {
      console.log(`🎮 Game ${gameState}! Calculating rewards...`);
      // Rewards are now calculated synchronously in the UI render phase to avoid race conditions
      // and ensure the latest score is always used.
    }
  }, [gameState]);

  // Sync abilities when level changes or purchases update from parent
  useEffect(() => {
    if (initialAbilities) {
      console.log('🎮 GameScreen: Syncing total abilities from Roadmap:', initialAbilities);
      setAbilityInventory(initialAbilities);
    }
  }, [initialAbilities, level]);

  const isProcessing = useRef(false);
  const isAiming = useRef(false);
  const rafRef = useRef<number | null>(null);
  const cannonRef = useRef<View>(null);
  const shootingRef = useRef<View>(null);

  // SHOOTING COOLDOWN TO PREVENT RAPID FIRE LAG
  const lastShotTime = useRef(0);
  const SHOT_COOLDOWN = 150; // Reduced cooldown for faster shooting

  const muzzleFlashAnim = useRef(new Animated.Value(0)).current;
  const muzzleVelocityAnim = useRef(new Animated.Value(0)).current;
  const recoilAnim = useRef(new Animated.Value(0)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current; // For Screen Shake
  const bloomAnim = useRef(new Animated.Value(0)).current; // For Light Bloom
  const colorWaveAnim = useRef(new Animated.Value(0)).current; // For Color Wave Effect
  const isValidAim = useRef(false);
  const [currentShotColor, setCurrentShotColor] = useState<string>('');

  const cannonPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - FOOTER_BOTTOM - CANNON_SIZE / 2 };



  const removeBlast = useCallback((id: string) => {
    setBlasts(prev => prev.filter(b => b.id !== id));
  }, []);

  // Function to trigger screen shake on bubble blast
  const triggerScreenShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.timing(shakeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => shakeAnim.setValue(0));
  }, [shakeAnim]);

  // Enhanced setBlasts that triggers screen shake
  const setBlastsWithShake = useCallback((update: any) => {
    setBlasts((prev: any[]) => {
      const newBlasts = typeof update === 'function' ? update(prev) : update;
      // Only trigger shake if new blasts are being added
      if (Array.isArray(newBlasts) && newBlasts.length > prev.length) {
        triggerScreenShake();
      }
      return newBlasts;
    });
  }, [triggerScreenShake]);

  // Lightning power-up activation
  const activateLightning = () => {
    if (lightningActive) {
      setLightningActive(false);
      setHasLightningPower(false);
    } else if (abilityInventory.lightning > 0) {
      setLightningActive(true);
      setHasLightningPower(true);
      toastRef.current?.show('Lightning Ability Activated!', 'info');
      SettingsService.vibrateClick(); // Vibration feedback
      // Deactivate others
      setBombActive(false); setHasBombPower(false);
      setFreezeActive(false); setHasFreezePower(false);
      setFireActive(false); setHasFirePower(false);
    }
  };

  // Bomb power-up activation
  const activateBomb = () => {
    if (bombActive) {
      setBombActive(false);
      setHasBombPower(false);
    } else if (abilityInventory.bomb > 0) {
      setBombActive(true);
      setHasBombPower(true);
      toastRef.current?.show('Bomb Ability Activated!', 'info');
      SettingsService.vibrateClick(); // Vibration feedback
      // Deactivate others
      setLightningActive(false); setHasLightningPower(false);
      setFreezeActive(false); setHasFreezePower(false);
      setFireActive(false); setHasFirePower(false);
    }
  };

  const activateFreeze = () => {
    if (freezeActive) {
      setFreezeActive(false);
      setHasFreezePower(false);
    } else if (abilityInventory.freeze > 0) {
      setFreezeActive(true);
      setHasFreezePower(true);
      toastRef.current?.show('Freeze Ability Activated!', 'info');
      SettingsService.vibrateClick(); // Vibration feedback
      // Deactivate others
      setLightningActive(false); setHasLightningPower(false);
      setBombActive(false); setHasBombPower(false);
      setFireActive(false); setHasFirePower(false);
    }
  };

  const activateFire = () => {
    if (fireActive) {
      setFireActive(false);
      setHasFirePower(false);
    } else if (abilityInventory.fire > 0) {
      setFireActive(true);
      setHasFirePower(true);
      toastRef.current?.show('Fire Ability Activated!', 'info');
      SettingsService.vibrateClick(); // Vibration feedback
      // Deactivate others
      setLightningActive(false); setHasLightningPower(false);
      setBombActive(false); setHasBombPower(false);
      setFreezeActive(false); setHasFreezePower(false);
    }
  };



  const initGame = useCallback(() => {
    setGameStartTime(Date.now());

    // Reset abilities
    if (initialAbilities) {
      console.log('🎮 initGame: Using passed total abilities:', initialAbilities);
      setAbilityInventory(initialAbilities);
    } else {
      setAbilityInventory({ lightning: 0, bomb: 0, freeze: 0, fire: 0 });
    }

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

    // PREVENT AIMING WHILE BLASTS ARE ACTIVE
    if (blasts.length > 0) {
      setAimDots([]);
      setGhostBubble({ x: 0, y: 0, visible: false });
      return;
    }

    if (showHint) setShowHint(false);

    // Calculate laser geometry
    const { circleCenterX, circleCenterY, traceStartX, traceStartY } = calculateLaserGeometry(
      CANNON_SIZE,
      FOOTER_BOTTOM,
      0
    );

    const dx = pageX - circleCenterX;
    const dy = pageY - circleCenterY;

    // REJECT AIM IF BELOW FIRING LINE
    if (dy >= -5) {
      isValidAim.current = false;
      setAimDots([]);
      setGhostBubble({ x: 0, y: 0, visible: false });
      return;
    }

    isValidAim.current = true;

    const angle = Math.atan2(dy, dx);
    cannonAngleRef.current = angle + Math.PI / 2;

    // Calculate aiming path
    const { dots, hitPoint } = calculateAimingPath(
      traceStartX,
      traceStartY,
      angle,
      bubblesRef.current || [],
      currentScrollY.current,
      BUBBLE_SIZE,
      GRID_TOP
    );

    setAimDots(dots);

    if (hitPoint) {
      const best = findBestLandingSpot(
        hitPoint,
        bubblesRef.current || [],
        currentScrollY.current,
        getPos
      );

      const finalPos = getPos(best.r, best.c);
      const ghostY = finalPos.y + currentScrollY.current;

      setGhostBubble({
        x: finalPos.x,
        y: ghostY,
        visible: true
      });
    } else {
      setGhostBubble({ x: 0, y: 0, visible: false });
    }
  };

  const onRelease = () => {
    if (!isAiming.current || isProcessing.current || gameState !== 'playing') return;

    // PREVENT SHOOTING WHILE BLASTS ARE ACTIVE
    if (blasts.length > 0) return;

    // PREVENT RAPID FIRE LAG
    const now = Date.now();
    if (now - lastShotTime.current < SHOT_COOLDOWN) return;
    lastShotTime.current = now;

    isAiming.current = false;

    // Clear UI indicators
    setAimDots([]);
    setGhostBubble({ x: 0, y: 0, visible: false });

    // ONLY SHOOT IF AIM WAS VALID
    if (!isValidAim.current) return;
    isValidAim.current = false;

    isProcessing.current = true;

    // Vibration feedback for shooting
    SettingsService.vibrateClick();

    // Set the current shot color for the wave effect
    setCurrentShotColor(nextColor);

    muzzleFlashAnim.setValue(1);
    Animated.timing(muzzleFlashAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();

    // Trigger Color Wave Effect
    colorWaveAnim.setValue(0);
    Animated.timing(colorWaveAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start(() => {
      colorWaveAnim.setValue(0);
      setCurrentShotColor('');
    });

    // Screen shake moved to bubble blast events

    Animated.sequence([
      Animated.timing(recoilAnim, { toValue: 20, duration: 40, useNativeDriver: true }),
      Animated.timing(recoilAnim, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start();

    const angle = cannonAngleRef.current - Math.PI / 2;
    const velocity = 55;

    // Create shot using new laser utilities
    const shot = createShotFromCannonCenter(
      CANNON_SIZE,
      FOOTER_BOTTOM,
      angle,
      velocity,
      nextColor,
      {
        hasLightning: hasLightningPower,
        hasBomb: hasBombPower,
        hasFreeze: hasFreezePower,
        hasFire: hasFirePower,
      }
    );

    // Reset power-ups after use (no backend sync needed since abilities reset each level)
    if (hasLightningPower) {
      setHasLightningPower(false);
      setLightningActive(false);
      setAbilitiesUsedCount(prev => ({ ...prev, lightning: prev.lightning + 1 }));
      const newInv = { ...abilityInventory, lightning: abilityInventory.lightning - 1 };
      setAbilityInventory(newInv);
    }
    if (hasBombPower) {
      setHasBombPower(false);
      setBombActive(false);
      setAbilitiesUsedCount(prev => ({ ...prev, bomb: prev.bomb + 1 }));
      const newInv = { ...abilityInventory, bomb: abilityInventory.bomb - 1 };
      setAbilityInventory(newInv);
    }
    if (hasFreezePower) {
      setHasFreezePower(false);
      setFreezeActive(false);
      setAbilitiesUsedCount(prev => ({ ...prev, freeze: prev.freeze + 1 }));
      const newInv = { ...abilityInventory, freeze: abilityInventory.freeze - 1 };
      setAbilityInventory(newInv);
    }
    if (hasFirePower) {
      setHasFirePower(false);
      setFireActive(false);
      setAbilitiesUsedCount(prev => ({ ...prev, fire: prev.fire + 1 }));
      const newInv = { ...abilityInventory, fire: abilityInventory.fire - 1 };
      setAbilityInventory(newInv);
    }

    const step = () => {
      let hitDetected = false;
      const thresholdSq = (BUBBLE_SIZE * 0.85) ** 2;
      const scrollOffset = currentScrollY.current;
      const bubbles = bubblesRef.current || [];

      // Update shooting bubble position via Ref for 60fps smoothness
      if (shootingRef.current) {
        shootingRef.current.setNativeProps({
          style: {
            opacity: 1,
            transform: [
              { translateX: shot.x - 16 },
              { translateY: shot.y - 16 }
            ]
          }
        });
      }

      // OPTIMIZED: Increased sub-steps for smoother movement at higher speeds
      for (let i = 0; i < 4; i++) {
        shot.x += shot.vx / 4;
        shot.y += shot.vy / 4;

        // Wall collision
        if (shot.x < BUBBLE_SIZE / 2 && shot.vx < 0) {
          shot.x = BUBBLE_SIZE / 2;
          shot.vx *= -1;
        } else if (shot.x > SCREEN_WIDTH - BUBBLE_SIZE / 2 && shot.vx > 0) {
          shot.x = SCREEN_WIDTH - BUBBLE_SIZE / 2;
          shot.vx *= -1;
        }

        if (shot.y < GRID_TOP) {
          hitDetected = true;
          break;
        }

        // OPTIMIZED: Simple distance check without filtering
        const hit = bubbles.find(b => {
          if (!b.visible) return false;
          return (shot.x - b.x) ** 2 + (shot.y - (b.y + scrollOffset)) ** 2 < thresholdSq;
        });

        if (hit) {
          hitDetected = true;
          break;
        }
      }

      if (hitDetected) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        resolveLanding(shot);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // Set initial shooting bubble state ONCE to mount the component
    setShootingBubble({ ...shot });
    rafRef.current = requestAnimationFrame(step);
  };

  const resolveLanding = (shot: any) => {
    // Clear shooting bubble immediately to prevent visual artifacts
    setShootingBubble(null);

    // Execute landing logic (now has internal delay for explosion effects)
    executeResolveLanding(shot, {
      bubblesRef,
      setBubbles,
      setScore,
      setBlasts: setBlastsWithShake,
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

  const goToNextLevel = async () => {
    if (onLevelComplete) {
      // Use star thresholds from DB config
      const thresholds = gameSettings?.starThresholds || { one: 100, two: 400, three: 800 };
      const stars = score >= thresholds.three ? 3 : score >= thresholds.two ? 2 : score >= thresholds.one ? 1 : 0;

      // Calculate coins earned
      const baseCoins = Math.floor(10 + (level * 2.5));
      const starBonus = stars * Math.floor(5 + (level * 0.5));
      const completionBonus = Math.floor(level * 1.2);
      const coinsEarned = baseCoins + starBonus + completionBonus;

      // Prepare session data
      const sessionData = {
        level,
        score,
        moves: moves,
        stars,
        duration: Math.floor((Date.now() - gameStartTime) / 1000),
        abilitiesUsed: abilitiesUsedCount,
        bubblesDestroyed: 0, // Could be tracked if needed
        chainReactions: 0, // Could be tracked if needed
        perfectShots: 0, // Could be tracked if needed
        coinsEarned: coinsEarned
      };

      // Session submission is now handled by useEffect when gameState changes
      onLevelComplete(level, score, stars, coinsEarned, 'next', sessionData);
    }
  };

  const handleBackPressWithConfirm = async () => {
    if (gameState === 'playing') {
      // Submit session for incomplete game before showing confirmation
      try {
        if (user && BackendService.isAuthenticated() && score > 0) {
          console.log('🚪 User exiting game, submitting incomplete session...');

          const stars = score >= 800 ? 3 : score >= 400 ? 2 : score >= 100 ? 1 : 0;
          const sessionData = {
            level,
            score,
            moves: moves,
            stars,
            duration: Math.floor((Date.now() - gameStartTime) / 1000),
            abilitiesUsed: abilitiesUsedCount,
            bubblesDestroyed: 0,
            chainReactions: 0,
            perfectShots: 0,
            coinsEarned: 0,
            isWin: false
          };

          const sessionResult = await BackendService.submitGameSession(sessionData);
          if (sessionResult.success) {
            console.log('Incomplete game session submitted:', sessionResult.data?.sessionId);
          }
        }
      } catch (error) {
        console.error('Error submitting incomplete session:', error);
      }

      setShowBackConfirm(true);
    } else {
      // When aborting from completed game or returning from next level,
      // we need to ensure data is refreshed in roadmap
      console.log('🔙 Returning to roadmap from GameScreen - ensuring data refresh');
      onBackPress && onBackPress();
    }
  };

  // Calculate game results outside modal for accessibility
  // Use star thresholds from DB config
  const starThresholds = gameSettings?.starThresholds || { one: 100, two: 400, three: 800 };
  const earnedStars = score >= starThresholds.three ? 3 : score >= starThresholds.two ? 2 : score >= starThresholds.one ? 1 : 0;

  // Coin calculation - Strictly use DB values as requested
  const coinsPerLevel = gameSettings?.coinsPerLevel || 10;
  const scoreRangeValue = gameSettings?.scoreRange || 100;
  const rewardValuePerRange = gameSettings?.rewardPerRange ? parseFloat(gameSettings.rewardPerRange.toString()) : 1;

  // Withdrawal Reward (SHIB) calculation
  const earnedRewardValue = (score / scoreRangeValue) * rewardValuePerRange;

  // In-Game Coins Reward - "Only coins perlevel should be fetch from mdb and that much only be give"
  // Win condition: 2 or 3 stars (level cleared)
  const isWin = earnedStars >= 2;
  const totalCoinsEarned = isWin ? coinsPerLevel : 0;

  // Debug coin calculation
  if (gameState !== 'playing') {
    console.log('💰 Coin Calculation Debug:', {
      score,
      earnedStars,
      isWin,
      gameState,
      coinsPerLevel,
      earnedRewardValue,
      totalCoinsEarned
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <SpaceBackground />

      <GameHUD
        score={score}
        moves={moves}
        level={level}
        nextColor={nextColor}
        onBackPress={handleBackPressWithConfirm}
        onShowInstructions={() => setShowInstructions(true)}
        abilities={{
          lightning: lightningActive,
          bomb: bombActive,
          freeze: freezeActive,
          fire: fireActive,
        }}
        abilityCounts={abilityInventory}
        onActivateLightning={activateLightning}
        onActivateBomb={activateBomb}
        onActivateFreeze={activateFreeze}
        onActivateFire={activateFire}
      />

      <View style={styles.gameArea} onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          // PREVENT STARTING AIM WHILE BLASTS ARE ACTIVE
          if (blasts.length > 0) return;

          const { pageX, pageY } = e.nativeEvent;
          // BROADENED AIMING ZONE: Touching the spaceship or anywhere above it up to the patterns
          // cannonPos.y is the ship center, GRID_TOP is the start of bubble grid
          if (pageY < cannonPos.y + 100 && pageY > GRID_TOP - 50) {
            isAiming.current = true;
            updateAim(pageX, pageY);
            // Light vibration feedback when starting to aim
            SettingsService.vibrateClick();
          }
        }}
        onResponderMove={(e) => {
          if (isAiming.current) updateAim(e.nativeEvent.pageX, e.nativeEvent.pageY);
        }}
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

        {/* Optimized Laser System - handles all laser effects */}
        <OptimizedLaser
          cannonPos={cannonPos}
          cannonSize={CANNON_SIZE}
          footerBottom={FOOTER_BOTTOM}
          nextColor={nextColor}
          currentShotColor={currentShotColor}
          aimDots={aimDots}
          ghostBubble={ghostBubble}
          shootingBubble={shootingBubble}
          colorWaveAnim={colorWaveAnim}
          recoilAnim={recoilAnim}
          shootingRef={shootingRef}
          blastsActive={blasts.length > 0}
        />

        <View style={styles.footer}>
          {showHint && (
            <View style={styles.hintContainer} pointerEvents="none">
              <Text style={styles.hintText}>TOUCH & DRAG TO AIM</Text>
            </View>
          )}
        </View>
      </View>

      {/* Game Over / Win Modal */}
      {gameState !== 'playing' && (() => {
        // Debug logging
        console.log('🎮 Game Over Modal - Debug Info:');
        console.log('📊 Score:', score);
        console.log('⭐ Earned Stars:', earnedStars);
        console.log('� Gamee State:', gameState);
        console.log('�  Total Coins Earned:', totalCoinsEarned);

        return (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {gameState === 'won' ? 'LEVEL CLEARED!' : 'OUT OF MOVES'}
              </Text>

              {gameState === 'won' && (
                <View style={styles.rewardDetailsContainer}>
                  {/* Victory Header */}
                  <Text style={styles.rewardTitle}>🎉 MISSION COMPLETE! 🎉</Text>

                  {/* Simple 2-Column Grid - Score and Coins */}
                  <View style={styles.simpleStatsGrid}>
                    {/* Score */}
                    <View style={styles.simpleStatCard}>
                      <MaterialIcon name="trending-up" family="material" size={32} color="#00E0FF" />
                      <Text style={styles.simpleStatValue}>{score.toLocaleString()}</Text>
                      <Text style={styles.simpleStatLabel}>SCORE</Text>
                    </View>

                    {/* Coins */}
                    <View style={styles.simpleStatCard}>
                      <MaterialIcon name={GAME_ICONS.COIN.name} family={GAME_ICONS.COIN.family} size={32} color={ICON_COLORS.GOLD} />
                      <Text style={styles.simpleStatValue}>+{totalCoinsEarned}</Text>
                      <Text style={styles.simpleStatLabel}>COINS</Text>
                    </View>
                  </View>

                  {/* SHIB Earnings */}
                  {earnedStars >= 2 && (
                    <View style={styles.earningsCard}>
                      <MaterialIcon name="bolt" family="material" size={28} color="#FF9900" />
                      <View style={styles.earningsInfo}>
                        <Text style={styles.earningsLabel}>SHIB EARNINGS</Text>
                        <Text style={styles.earningsValue}>+{earnedRewardValue.toFixed(8)}</Text>
                      </View>
                      <MaterialIcon name="check-circle" family="material" size={24} color="#00FF88" />
                    </View>
                  )}

                  {/* Next Level Unlock */}
                  {earnedStars >= 2 && (
                    <Text style={styles.nextLevelText}>🚀 NEXT LEVEL UNLOCKED!</Text>
                  )}
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtnSecondary, homeLoading && { opacity: 0.5 }]}
                  disabled={homeLoading}
                  onPress={async () => {
                    console.log('🏠 Home button clicked!');
                    console.log('🔍 onLevelComplete exists?', !!onLevelComplete);
                    console.log('🔍 gameState:', gameState);
                    console.log('🔍 earnedStars:', earnedStars);
                    console.log('🔍 totalCoinsEarned:', totalCoinsEarned);

                    if (homeLoading) return;
                    setHomeLoading(true);
                    SettingsService.vibrateClick(); // Button feedback

                    if (onLevelComplete) {
                      try {
                        // Always submit session data if stars were earned, regardless of win/loss
                        const shouldSubmitSession = earnedStars > 0 || gameState === 'won';
                        const isWin = gameState === 'won' || earnedStars >= 2; // Consider 2+ stars as a win for progression

                        console.log('🔍 Home button - session submission check:', {
                          gameState,
                          earnedStars,
                          shouldSubmitSession,
                          isWin,
                          totalCoinsEarned
                        });

                        if (!shouldSubmitSession) {
                          console.log('⚠️ No stars earned, skipping session submission');
                          onBackPress && onBackPress();
                          setHomeLoading(false);
                          return;
                        }

                        // Prepare session data
                        const sessionData = {
                          level,
                          score,
                          moves: moves,
                          stars: earnedStars,
                          duration: Math.floor((Date.now() - gameStartTime) / 1000),
                          abilitiesUsed: abilitiesUsedCount,
                          bubblesDestroyed: 0,
                          chainReactions: 0,
                          perfectShots: 0,
                          coinsEarned: totalCoinsEarned,
                          isWin: isWin
                        };

                        console.log('🏠 Home button pressed - submitting session and returning to roadmap');
                        console.log('📊 Session data:', sessionData);

                        // Wait for the session to be fully processed before navigating
                        await onLevelComplete(level, score, earnedStars, totalCoinsEarned, 'home', sessionData);

                        console.log('✅ Level completion processed, data saved successfully');

                        // Add a small delay to ensure backend processing completes
                        await new Promise(resolve => setTimeout(() => resolve(null), 500));
                      } catch (e) {
                        console.error("Home nav error", e);
                        onBackPress && onBackPress();
                      } finally {
                        setHomeLoading(false);
                      }
                    } else {
                      console.log('❌ onLevelComplete callback not provided!');
                      onBackPress && onBackPress();
                      setHomeLoading(false);
                    }
                  }}>
                  {homeLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialIcon
                      name={GAME_ICONS.HOME.name}
                      family={GAME_ICONS.HOME.family}
                      size={ICON_SIZES.LARGE}
                      color={ICON_COLORS.WHITE}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => {
                  SettingsService.vibrateClick(); // Button feedback
                  restartLevel();
                }}>
                  <MaterialIcon
                    name={GAME_ICONS.RESTART.name}
                    family={GAME_ICONS.RESTART.family}
                    size={ICON_SIZES.LARGE}
                    color={ICON_COLORS.WHITE}
                  />
                </TouchableOpacity>
                {earnedStars >= 2 && (
                  <TouchableOpacity
                    style={[styles.modalBtnPrimary, nextLevelLoading && { opacity: 0.5 }]}
                    onPress={async () => {
                      if (nextLevelLoading) return; // Prevent multiple clicks

                      setNextLevelLoading(true);
                      SettingsService.vibrateClick(); // Button feedback

                      if (onLevelComplete) {
                        try {
                          // Prepare session data with correct coin value
                          const sessionData = {
                            level,
                            score,
                            moves: moves,
                            stars: earnedStars,
                            duration: Math.floor((Date.now() - gameStartTime) / 1000),
                            abilitiesUsed: abilitiesUsedCount,
                            bubblesDestroyed: 0,
                            chainReactions: 0,
                            perfectShots: 0,
                            coinsEarned: totalCoinsEarned, // Use the calculated totalCoinsEarned
                            isWin: true
                          };

                          // Pass reliable calculated data including coins and 'next' action
                          await onLevelComplete(level, score, earnedStars, totalCoinsEarned, 'next', sessionData);
                        } catch (error) {
                          console.error("Error progressing to next level:", error);
                          // Emergency fallback if something crashes
                          onBackPress && onBackPress();
                        } finally {
                          setNextLevelLoading(false);
                        }
                      }
                    }}
                    disabled={nextLevelLoading}
                  >
                    {nextLevelLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <MaterialIcon
                        name={GAME_ICONS.NEXT.name}
                        family={GAME_ICONS.NEXT.family}
                        size={ICON_SIZES.LARGE}
                        color={ICON_COLORS.WHITE}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      })()}

      {/* Exit Confirmation Modal */}
      <ConfirmationModal
        visible={showBackConfirm}
        title="EXIT MISSION"
        message="Are you sure you want to abort the current mission? Progress will be lost."
        confirmLabel="ABORT"
        cancelLabel="CONTINUE"
        onConfirm={() => {
          setShowBackConfirm(false);
          onBackPress && onBackPress();
        }}
        onCancel={() => setShowBackConfirm(false)}
      />

      <HelpSlider
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
        adRewardAmount={adRewardAmount}
        levelReward={levelReward}
        starBonus={starBonus}
      />

      <ToastNotification ref={toastRef} />
    </View>
  );
};

export default GameScreen;
