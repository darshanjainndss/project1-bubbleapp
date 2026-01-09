import { Animated } from "react-native";
import { BUBBLE_SIZE, ROW_HEIGHT, SCREEN_WIDTH, GRID_TOP, SCREEN_HEIGHT } from "../styles/GameScreenStyles";
import { COLORS } from "../data/levelPatterns";
import SettingsService from '../services/SettingsService';

export const getPos = (row: number, col: number) => {
    const rowWidth = (row % 2 === 0) ? 9 : 8;
    const sidePadding = (SCREEN_WIDTH - (rowWidth * BUBBLE_SIZE)) / 2;
    return {
        x: sidePadding + (col * BUBBLE_SIZE) + BUBBLE_SIZE / 2,
        y: row * ROW_HEIGHT + BUBBLE_SIZE / 2 + GRID_TOP
    };
};

export const getHexNeighbors = (row: number, col: number) => {
    const neighbors: [number, number][] = [];
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

export const handleFloating = (grid: any[], destroyed: any[], setScore: any, setBlasts: any, baseDelay: number) => {
    const connected = new Set();
    const topRow = grid.filter(b => b.visible && b.row === 0);
    const stack = [...topRow];
    topRow.forEach(b => connected.add(b.id));

    while (stack.length > 0) {
        const curr = stack.pop()!;
        const neighbors = grid.filter(g => g.visible && !connected.has(g.id) && Math.sqrt((curr.x - g.x) ** 2 + (curr.y - g.y) ** 2) < BUBBLE_SIZE * 1.2);
        neighbors.forEach(n => { connected.add(n.id); stack.push(n); });
    }

    const floating: any[] = [];
    grid.forEach(b => {
        if (b.visible && !connected.has(b.id)) {
            b.visible = false;
            setScore((s: number) => s + 5);
            floating.push(b);
        }
    });

    if (floating.length > 0) {
        const floatBlasts = floating.map((b, i) => ({
            id: `blast-float-${b.id}-${Date.now()}`,
            x: b.x, y: b.y, color: b.color, delay: baseDelay + (i * 120)
        }));
        setBlasts((prev: any[]) => [...prev, ...floatBlasts]);
        // Vibration for floating bubbles (chain reaction)
        SettingsService.vibrateChainReaction();
    }
};

export const updateCommonState = (
    grid: any[],
    setBubbles: any,
    bubblesRef: any,
    setShootingBubble: any,
    setNextColor: any,
    setMoves: any,
    moves: number,
    setGameState: any,
    currentScrollY: any,
    scrollY: any,
    isProcessing: any
) => {
    bubblesRef.current = grid;
    setBubbles([...grid]);
    setShootingBubble(null);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setMoves((m: number) => Math.max(0, m - 1));

    const remaining = grid.filter(b => b.visible).length;
    if (remaining === 0) {
        setGameState('won');
        SettingsService.vibrateSuccess(); // Victory vibration
    } else if (moves - 1 <= 0) {
        setGameState('lost');
        SettingsService.vibrateError(); // Defeat vibration
    }

    const visible = grid.filter(b => b.visible);
    if (visible.length > 0) {
        const maxY = Math.max(...visible.map(b => b.y));
        const targetY = SCREEN_HEIGHT * 0.45;
        currentScrollY.current = targetY - maxY;
        Animated.spring(scrollY, {
            toValue: currentScrollY.current,
            tension: 40, friction: 7, useNativeDriver: true
        }).start();
    }
    isProcessing.current = false;
};
