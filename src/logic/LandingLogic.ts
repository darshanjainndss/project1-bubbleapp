import React from 'react';
import { Animated } from 'react-native';
import { BUBBLE_SIZE, SCREEN_HEIGHT, GRID_TOP, ROW_HEIGHT } from '../styles/screens/GameScreenStyles';
import { getPos, getHexNeighbors, handleFloating, updateCommonState } from '../utils/gameUtils';
import { COLORS } from '../data/levelPatterns';
import SettingsService from '../services/SettingsService';

export const resolveLanding = (
    shot: any,
    params: {
        bubblesRef: React.MutableRefObject<any[]>;
        setBubbles: (b: any[]) => void;
        setScore: (update: any) => void;
        setBlasts: (update: any) => void;
        setShootingBubble: (b: any) => void;
        setNextColor: (c: string) => void;
        setMoves: (update: any) => void;
        setGameState: (s: 'playing' | 'won' | 'lost') => void;
        currentScrollY: React.MutableRefObject<number>;
        scrollY: Animated.Value;
        isProcessing: React.MutableRefObject<boolean>;
        moves: number;
    }
) => {
    const {
        bubblesRef, setBubbles, setScore, setBlasts, setShootingBubble,
        setNextColor, setMoves, setGameState, currentScrollY, scrollY,
        isProcessing, moves
    } = params;

    const grid = [...(bubblesRef.current || [])];

    // 1. LIGHTNING POWER - IMPROVED
    if (shot.hasLightning) {
        console.log('⚡ Lightning power activated!');
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.9
        );

        if (hitBubble) {
            console.log('🎯 Lightning hit bubble at row:', hitBubble.row);
            const targetRow = hitBubble.row;
            const bubblesInRow = grid.filter(b => b.visible && b.row === targetRow);
            const destroyedBubbles: any[] = [];

            console.log('⚡ Found', bubblesInRow.length, 'bubbles in row', targetRow);

            bubblesInRow.forEach(bubble => {
                if (!bubble.hasMetalGrid) {
                    bubble.visible = false;
                    destroyedBubbles.push(bubble);
                    console.log('💥 Destroyed bubble at', bubble.row, bubble.col);
                    if (bubble.anim) {
                        Animated.sequence([
                            Animated.timing(bubble.anim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
                            Animated.timing(bubble.anim, { toValue: 0, duration: 200, useNativeDriver: true })
                        ]).start();
                    }
                } else {
                    console.log('🛡️ Metal grid bubble bounced at', bubble.row, bubble.col);
                    if (bubble.anim) {
                        Animated.sequence([
                            Animated.timing(bubble.anim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
                            Animated.spring(bubble.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
                        ]).start();
                    }
                }
            });

            console.log('⚡ Lightning destroyed', destroyedBubbles.length, 'bubbles');
            setScore((s: number) => s + destroyedBubbles.length * 15);
            const newBlasts = destroyedBubbles.map((b, i) => ({
                id: `blast-${b.id}-${Date.now()}`,
                x: b.x, y: b.y, color: b.color, delay: i * 120
            }));
            if (newBlasts.length > 0) {
                setBlasts((prev: any[]) => [...prev, ...newBlasts]);
                SettingsService.vibratePowerUp('lightning');
            }

            // Float check
            const connected = new Set();
            const topRowBubbles = grid.filter(b => b.visible && b.row === 0);
            const cStack = [...topRowBubbles];
            topRowBubbles.forEach(b => connected.add(b.id));
            while (cStack.length > 0) {
                const curr = cStack.pop()!;
                const neighbors = grid.filter(g => g.visible && !connected.has(g.id) && Math.sqrt((curr.x - g.x) ** 2 + (curr.y - g.y) ** 2) < BUBBLE_SIZE * 1.2);
                neighbors.forEach(n => { connected.add(n.id); cStack.push(n); });
            }

            const newlyFloating: any[] = [];
            grid.forEach(b => {
                if (b.visible && !connected.has(b.id) && bubblesInRow.indexOf(b) === -1) {
                    b.visible = false;
                    setScore((s: number) => s + 5);
                    newlyFloating.push(b);
                }
            });

            if (newlyFloating.length > 0) {
                const floatBlasts = newlyFloating.map((b, i) => ({
                    id: `blast-float-${b.id}-${Date.now()}`,
                    x: b.x, y: b.y, color: b.color, delay: (newBlasts.length * 120) + (i * 100)
                }));
                setBlasts((prev: any[]) => [...prev, ...floatBlasts]);
                // Vibration for chain reaction (floating bubbles)
                SettingsService.vibrateChainReaction();
            }

            updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
            return;
        }
    }

    // 2. BOMB POWER - IMPROVED
    if (shot.hasBomb) {
        console.log('💣 Bomb power activated!');
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.9
        );

        if (hitBubble) {
            console.log('🎯 Bomb hit bubble at:', hitBubble.row, hitBubble.col);
            const destroyed = [hitBubble];
            const neighbors = getHexNeighbors(hitBubble.row, hitBubble.col);

            neighbors.forEach(([r, c]) => {
                const neighbor = grid.find(b => b.visible && b.row === r && b.col === c);
                if (neighbor) {
                    destroyed.push(neighbor);
                    console.log('💥 Bomb destroying neighbor at:', r, c);
                }
            });

            console.log('💣 Bomb destroying', destroyed.length, 'bubbles total');
            destroyed.forEach(b => {
                b.visible = false;
                b.isFrozen = false; // Clear frozen state if any
                if (b.anim) {
                    Animated.sequence([
                        Animated.timing(b.anim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
                        Animated.timing(b.anim, { toValue: 0, duration: 250, useNativeDriver: true })
                    ]).start();
                }
            });

            setScore((s: number) => s + destroyed.length * 12);
            const newBlasts = destroyed.map((b, i) => ({
                id: `blast-${b.id}-${Date.now()}`,
                x: b.x, y: b.y, color: b.color, delay: i * 20
            }));
            if (newBlasts.length > 0) {
                setBlasts((prev: any[]) => [...prev, ...newBlasts]);
                SettingsService.vibratePowerUp('bomb');
            }

            handleFloating(grid, destroyed, setScore, setBlasts, newBlasts.length * 100);
            updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
            return;
        }
    }

    // 3. FREEZE POWER - IMPROVED
    if (shot.hasFreeze) {
        console.log('❄️ Freeze power activated!');
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.9
        );
        if (hitBubble) {
            console.log('🎯 Freeze ball hit bubble at:', hitBubble.row, hitBubble.col);

            // Improved freeze logic: freeze bubbles in a wider column and more rows
            const targetBubbles = grid.filter(b =>
                b.visible &&
                Math.abs(b.x - hitBubble.x) < BUBBLE_SIZE * 0.8 && // Wider column detection
                b.row <= hitBubble.row &&
                b.row >= Math.max(0, hitBubble.row - 4) // More rows (5 rows total)
            );

            console.log('❄️ Freezing', targetBubbles.length, 'bubbles in column');
            let frozenCount = 0;

            targetBubbles.forEach(b => {
                if (!b.isFrozen) { // Only freeze if not already frozen
                    b.isFrozen = true;
                    frozenCount++;
                    console.log('🧊 Bubble at', b.row, b.col, 'is now frozen');
                    if (b.anim) {
                        Animated.sequence([
                            Animated.timing(b.anim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                            Animated.timing(b.anim, { toValue: 1, duration: 250, useNativeDriver: true })
                        ]).start();
                    }
                }
            });

            console.log('❄️ Successfully froze', frozenCount, 'new bubbles');
            if (frozenCount > 0) {
                SettingsService.vibratePowerUp('freeze');
            }

            updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
            return;
        } else {
            console.log('❄️ Freeze power failed - no bubble hit');
        }
    }

    // 4. FIRE POWER - DESTROY ALL FROZEN BUBBLES
    if (shot.hasFire) {
        console.log('🔥 Fire power activated!');
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.9
        );
        if (hitBubble) {
            console.log('🎯 Fire ball hit bubble at:', hitBubble.row, hitBubble.col, 'isFrozen:', hitBubble.isFrozen);
            const destroyed = [];

            // Always destroy the hit bubble (unless it's a non-frozen metal grid)
            if (hitBubble.isFrozen || !hitBubble.hasMetalGrid) {
                destroyed.push(hitBubble);
                console.log('💥 Hit bubble will be destroyed');
            }

            // Find and destroy ALL frozen bubbles on the entire grid
            const allFrozenBubbles = grid.filter(b =>
                b.visible &&
                b.isFrozen &&
                b.id !== hitBubble.id
            );
            console.log('❄️ Found', allFrozenBubbles.length, 'frozen bubbles on entire grid to destroy');
            destroyed.push(...allFrozenBubbles);

            // If we have bubbles to destroy, destroy them
            if (destroyed.length > 0) {
                console.log('🔥 Fire destroying', destroyed.length, 'bubbles total (including all frozen)');
                destroyed.forEach(b => {
                    b.visible = false;
                    b.isFrozen = false; // Clear frozen state
                    if (b.anim) {
                        Animated.sequence([
                            Animated.timing(b.anim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
                            Animated.timing(b.anim, { toValue: 0, duration: 200, useNativeDriver: true })
                        ]).start();
                    }
                });

                setScore((s: number) => s + destroyed.length * 15); // Increased score for fire power
                const newBlasts = destroyed.map((b, i) => ({
                    id: `blast-fire-${b.id}-${Date.now()}`,
                    x: b.x, y: b.y, color: b.color, delay: i * 80 // Faster blast sequence
                }));
                setBlasts((prev: any[]) => [...prev, ...newBlasts]);
                SettingsService.vibratePowerUp('fire');

                handleFloating(grid, destroyed, setScore, setBlasts, 300);
                updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
                return;
            }
            // If hit bubble is non-frozen metal grid, just bounce off
            else if (hitBubble.hasMetalGrid && !hitBubble.isFrozen) {
                console.log('🛡️ Fire bounced off metal grid');
                if (hitBubble.anim) {
                    Animated.sequence([
                        Animated.timing(hitBubble.anim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
                        Animated.spring(hitBubble.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
                    ]).start();
                }
                updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
                return;
            }
        } else {
            console.log('🔥 Fire power failed - no bubble hit');
        }
    }

    // 5. NORMAL LANDING
    let best = { r: 0, c: 0, dist: Infinity };
    for (let r = 0; r < 35; r++) {
        const rowWidth = (r % 2 === 0) ? 9 : 8;
        for (let c = 0; c < rowWidth; c++) {
            if (grid.some(b => b.visible && b.row === r && b.col === c)) continue;
            const coords = getPos(r, c);
            const d = Math.sqrt((shot.x - coords.x) ** 2 + (shot.y - (coords.y + currentScrollY.current)) ** 2);
            if (d < best.dist) best = { r, c, dist: d };
        }
    }

    const { x, y } = getPos(best.r, best.c);
    const hitAnim = new Animated.Value(0.7);
    const newB = {
        id: `b-${Date.now()}`,
        row: best.r, col: best.c, x, y,
        color: shot.color, visible: true, anim: hitAnim,
        hasMetalGrid: false, isFrozen: false, hitsRemaining: 1, maxHits: 1
    };
    grid.push(newB);

    Animated.spring(hitAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }).start();

    // Update bubbles immediately to show the ball landing
    bubblesRef.current = grid;
    setBubbles([...grid]);

    // Add delay to show the ball landing before explosion effects
    setTimeout(() => {
        // BOMB LANDING (Normal path but with power active)
        if (shot.hasBomb) {
            const destroyed = [newB];
            const neighbors = getHexNeighbors(best.r, best.c);
            neighbors.forEach(([r, c]) => {
                const n = grid.find(b => b.visible && b.row === r && b.col === c);
                if (n) destroyed.push(n);
            });

            destroyed.forEach(b => {
                b.visible = false;
                if (b.anim) {
                    Animated.sequence([
                        Animated.timing(b.anim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
                        Animated.timing(b.anim, { toValue: 0, duration: 250, useNativeDriver: true })
                    ]).start();
                }
            });

            setScore((s: number) => s + destroyed.length * 12);
            const mainBlasts = destroyed.map((b, i) => ({
                id: `blast-bomb-${b.id}-${Date.now()}`,
                x: b.x, y: b.y, color: b.color, delay: i * 100
            }));
            setBlasts((prev: any[]) => [...prev, ...mainBlasts]);
            // Vibration for bomb landing destroying bubbles
            SettingsService.vibratePowerUp('bomb');

            handleFloating(grid, destroyed, setScore, setBlasts, destroyed.length * 100);
        }
        // FIRE LANDING (Normal path but with fire power active) - DESTROY ALL FROZEN
        else if (shot.hasFire) {
            console.log('🔥 Fire landing - destroying ALL frozen bubbles on grid');
            const destroyed = [newB];

            // Find ALL frozen bubbles on the entire grid (not just in area)
            const allFrozenBubbles = grid.filter(b =>
                b.visible &&
                b.isFrozen
            );
            console.log('🔥 Fire landing found', allFrozenBubbles.length, 'frozen bubbles to destroy');
            destroyed.push(...allFrozenBubbles);

            destroyed.forEach(b => {
                b.visible = false;
                b.isFrozen = false; // Clear frozen state
                if (b.anim) {
                    Animated.sequence([
                        Animated.timing(b.anim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
                        Animated.timing(b.anim, { toValue: 0, duration: 200, useNativeDriver: true })
                    ]).start();
                }
            });

            setScore((s: number) => s + destroyed.length * 15); // Increased score
            const fireBlasts = destroyed.map((b, i) => ({
                id: `blast-fire-landing-${b.id}-${Date.now()}`,
                x: b.x, y: b.y, color: b.color, delay: i * 80 // Faster sequence
            }));
            setBlasts((prev: any[]) => [...prev, ...fireBlasts]);
            SettingsService.vibratePowerUp('fire');

            handleFloating(grid, destroyed, setScore, setBlasts, destroyed.length * 80);
        }
        else {
            // Normal match checks
            const match = [newB];
            const stack = [newB];
            const visited = new Set([newB.id]);

            const neighborsImpact = grid.filter(g => g.visible && g.id !== newB.id && Math.sqrt((newB.x - g.x) ** 2 + (newB.y - g.y) ** 2) < BUBBLE_SIZE * 1.5);
            neighborsImpact.forEach(n => {
                if (n.anim) {
                    Animated.sequence([
                        Animated.timing(n.anim, { toValue: 1.08, duration: 50, useNativeDriver: true }),
                        Animated.spring(n.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
                    ]).start();
                }
            });

            while (stack.length > 0) {
                const b = stack.pop()!;
                const nbs = grid.filter(g => g.visible && !visited.has(g.id) && g.color.toLowerCase() === newB.color.toLowerCase() && Math.sqrt((b.x - g.x) ** 2 + (b.y - g.y) ** 2) < BUBBLE_SIZE * 1.2);
                nbs.forEach(n => { visited.add(n.id); match.push(n); stack.push(n); });
            }

            if (match.length >= 3) {
                const destroyed: any[] = [];
                match.forEach(m => {
                    if (m.hasMetalGrid && m.hitsRemaining > 1) {
                        m.hitsRemaining -= 1;
                        m.hasMetalGrid = false;
                        if (m.anim) {
                            Animated.sequence([
                                Animated.timing(m.anim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
                                Animated.spring(m.anim, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true })
                            ]).start();
                        }
                    } else {
                        m.visible = false;
                        destroyed.push(m);
                    }
                });

                setScore((s: number) => s + destroyed.length * 10);
                if (destroyed.length > 0) {
                    const blastsArr = destroyed.map((b, i) => ({
                        id: `blast-${b.id}-${Date.now()}`,
                        x: b.x, y: b.y, color: b.color, delay: i * 150
                    }));
                    setBlasts((prev: any[]) => [...prev, ...blastsArr]);
                    // Vibration for normal bubble matching
                    SettingsService.vibrateBubbleBlast(destroyed.length);
                    handleFloating(grid, destroyed, setScore, setBlasts, destroyed.length * 150);
                }
            }
        }

        updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
    }, 200); // 200ms delay to see the ball land and settle first
};
