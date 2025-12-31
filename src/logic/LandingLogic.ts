import React from 'react';
import { Animated } from 'react-native';
import { BUBBLE_SIZE, SCREEN_HEIGHT, GRID_TOP, ROW_HEIGHT } from '../styles/GameScreenStyles';
import { getPos, getHexNeighbors, handleFloating, updateCommonState } from '../utils/gameUtils';
import { COLORS } from '../data/levelPatterns';

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

    // 1. LIGHTNING POWER
    if (shot.hasLightning) {
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
        );

        if (hitBubble) {
            const targetRow = hitBubble.row;
            const bubblesInRow = grid.filter(b => b.visible && b.row === targetRow);
            const destroyedBubbles: any[] = [];

            bubblesInRow.forEach(bubble => {
                if (!bubble.hasMetalGrid) {
                    bubble.visible = false;
                    destroyedBubbles.push(bubble);
                    if (bubble.anim) {
                        Animated.sequence([
                            Animated.timing(bubble.anim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
                            Animated.timing(bubble.anim, { toValue: 0, duration: 200, useNativeDriver: true })
                        ]).start();
                    }
                } else {
                    if (bubble.anim) {
                        Animated.sequence([
                            Animated.timing(bubble.anim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
                            Animated.spring(bubble.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
                        ]).start();
                    }
                }
            });

            setScore((s: number) => s + destroyedBubbles.length * 15);
            const newBlasts = destroyedBubbles.map((b, i) => ({
                id: `blast-${b.id}-${Date.now()}`,
                x: b.x, y: b.y, color: b.color, delay: i * 120
            }));
            if (newBlasts.length > 0) setBlasts((prev: any[]) => [...prev, ...newBlasts]);

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
            }

            updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
            return;
        }
    }

    // 2. BOMB POWER (Direct Hit)
    if (shot.hasBomb) {
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
        );

        if (hitBubble) {
            const destroyed = [hitBubble];
            const neighbors = getHexNeighbors(hitBubble.row, hitBubble.col);
            neighbors.forEach(([r, c]) => {
                const neighbor = grid.find(b => b.visible && b.row === r && b.col === c);
                if (neighbor) destroyed.push(neighbor);
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
            const newBlasts = destroyed.map((b, i) => ({
                id: `blast-${b.id}-${Date.now()}`,
                x: b.x, y: b.y, color: b.color, delay: i * 20
            }));
            if (newBlasts.length > 0) setBlasts((prev: any[]) => [...prev, ...newBlasts]);

            handleFloating(grid, destroyed, setScore, setBlasts, newBlasts.length * 100);
            updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
            return;
        }
    }

    // 3. FREEZE POWER
    if (shot.hasFreeze) {
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
        );
        if (hitBubble) {
            const targetBubbles = grid.filter(b => b.visible && Math.abs(b.x - hitBubble.x) < BUBBLE_SIZE * 0.3 && b.row <= hitBubble.row && b.row >= hitBubble.row - 3);
            targetBubbles.forEach(b => {
                b.isFrozen = true;
                if (b.anim) {
                    Animated.sequence([
                        Animated.timing(b.anim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                        Animated.timing(b.anim, { toValue: 1, duration: 250, useNativeDriver: true })
                    ]).start();
                }
            });
            updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
            return;
        }
    }

    // 4. FIRE POWER
    if (shot.hasFire) {
        const hitBubble = grid.find(b =>
            b.visible && Math.sqrt((shot.x - b.x) ** 2 + (shot.y - (b.y + currentScrollY.current)) ** 2) < BUBBLE_SIZE * 0.82
        );
        if (hitBubble) {
            if (hitBubble.hasMetalGrid && !hitBubble.isFrozen) {
                if (hitBubble.anim) {
                    Animated.sequence([
                        Animated.timing(hitBubble.anim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
                        Animated.spring(hitBubble.anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true })
                    ]).start();
                }
            } else {
                const destroyed = [hitBubble];
                const frozenInColumn = grid.filter(b => b.visible && b.isFrozen && Math.abs(b.x - hitBubble.x) < BUBBLE_SIZE * 0.3);
                destroyed.push(...frozenInColumn);

                destroyed.forEach(b => {
                    b.visible = false;
                    if (b.anim) {
                        Animated.sequence([
                            Animated.timing(b.anim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
                            Animated.timing(b.anim, { toValue: 0, duration: 200, useNativeDriver: true })
                        ]).start();
                    }
                });

                setScore((s: number) => s + destroyed.length * 12);
                const newBlasts = destroyed.map((b, i) => ({
                    id: `blast-fire-${b.id}-${Date.now()}`,
                    x: b.x, y: b.y, color: b.color, delay: i * 120
                }));
                setBlasts((prev: any[]) => [...prev, ...newBlasts]);

                handleFloating(grid, destroyed, setScore, setBlasts, 300);
                updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
                return;
            }
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

        handleFloating(grid, destroyed, setScore, setBlasts, destroyed.length * 100);
    } else {
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
                handleFloating(grid, destroyed, setScore, setBlasts, destroyed.length * 150);
            }
        }
    }

    updateCommonState(grid, setBubbles, bubblesRef, setShootingBubble, setNextColor, setMoves, moves, setGameState, currentScrollY, scrollY, isProcessing);
};
