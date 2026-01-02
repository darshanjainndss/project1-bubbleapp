export const COLORS = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#007AFF", "#AF52DE"];

export type Pattern = string[];

// Metal grid protection configuration
export interface BubbleConfig {
  color: string;
  hasMetalGrid?: boolean;
  hitsToDestroy?: number;
}

/**
 * TRUE HEXAGONAL SYMMETRY REGISTRY
 */
export const PATTERNS: Record<string, Pattern> = {
    DIAMOND: [
        "    1    ",
        "   11   ",
        "   111   ",
        "  1111  ",
        "  11111  ",
        " 111111 ",
        " 1111111 ",
        "11111111",
        "111111111",
        "11111111",
        " 1111111 ",
        " 111111 ",
        "  11111  ",
        "  1111  ",
        "   111   ",
        "   11   ",
        "    1    ",
    ],
    RHOMBUS_V: [
        "    11111", // 0 (9)
        "   11111",  // 1 (8)
        "  11111  ", // 2 (9)
        " 11111  ",  // 3 (8)
        "11111    ", // 4 (9) - Point
        " 11111  ",  // 5 (8)
        "  11111  ", // 6 (9)
        "   11111",  // 7 (8)
        "    11111", // 8 (9)
    ],
    STAR: [
        "    1    ",
        "   11   ",
        "  11111  ",
        "11111111",
        " 1111111 ",
        "  1111  ",
        " 1111111 ",
        "11111111",
        "  11111  ",
        "   11   ",
        "    1    ",
    ],
    HEART: [
        " 11   11 ",
        "111  111",
        "111111111",
        "11111111",
        " 1111111 ",
        " 111111 ",
        "  11111  ",
        "  1111  ",
        "   111   ",
        "   11   ",
        "    1    ",
    ],
    SKULL: [
        "  11111  ",
        " 111111 ",
        "111111111",
        "11    11",
        "111 1 111",
        " 111111 ",
        "  11111  ",
        "  1111  ",
        "  1 1 1  ",
    ],
    CROWN: [
        "1   1   1",
        "11 11 11",
        "111111111",
        "11111111",
        " 1111111 ",
        "  1111  ",
    ],
    HEXAGON: [
        "  11111  ",
        " 111111 ",
        "111111111",
        " 111111 ",
        "  11111  ",
    ],
    CIRCLE: [
        "   111   ",
        " 111111 ",
        " 1111111 ",
        "11111111",
        "111111111",
        "11111111",
        " 1111111 ",
        " 111111 ",
        "   111   ",
    ],
    EYE: [
        "   111   ",
        "  1111  ",
        " 1111111 ",
        "111  111",
        " 1111111 ",
        "  1111  ",
        "   111   ",
    ],
    FISH_VERTICAL: [
        "    1    ",
        "   11   ",
        "  11111  ",
        " 111111 ",
        "111111111",
        " 111111 ",
        "  11111  ",
        "   11   ",
        "  11 11  ",
    ],
    SPIDER: [
        "1       1",
        " 1    1 ",
        "  11111  ",
        " 111111 ",
        "111111111",
        " 111111 ",
        "  11111  ",
        " 1    1 ",
        "1       1",
    ],
    CHALICE: [
        "111111111",
        "11111111",
        " 1111111 ",
        "  1111  ",
        "   111   ",
        "   11   ",
        "   111   ",
        "  1111  ",
        "111111111",
    ],
    FLOWER: [
        "   111   ",
        "  1111  ",
        " 1111111 ",
        "  1111  ",
        "   111   ",
        "   11   ",
        "  11111  ",
        "   11   ",
        "   111   ",
    ],
    TREE: [
        "    1    ",
        "   11   ",
        "   111   ",
        "  1111  ",
        "  11111  ",
        " 111111 ",
        " 1111111 ",
        "11111111",
        "111111111",
        "   11   ",
        "   111   ",
    ],
    UFO: [
        "   111   ",
        "  1111  ",
        " 1111111 ",
        "11111111",
        " 1111111 ",
    ],
    ARROW: [
        "    1    ", // Row 0 (9)
        "   11   ",  // Row 1 (8)
        "   111   ", // Row 2 (9)
        "  1111  ",  // Row 3 (8)
        "  11111  ", // Row 4 (9)
        " 111111 ",  // Row 5 (8)
        "111111111", // Row 6 (9) - Head Base
        "   11   ",  // Row 7 (8)
        "   111   ", // Row 8 (9)
        "   11   ",  // Row 9 (8)
        "   111   ", // Row 10 (9)
        "   11   ",  // Row 11 (8)
        "   111   ", // Row 12 (9)
    ],
    DIAMOND_SMALL: [
        "    1    ", // Row 0 (9)
        "   11   ",  // Row 1 (8)
        "  11111  ", // Row 2 (9)
        " 111111 ",  // Row 3 (8)
        "  11111  ", // Row 4 (9)
        "   11   ",  // Row 5 (8)
        "    1    ", // Row 6 (9)
    ],
    MINI_GEM: [
        "   111   ",
        "  1111  ",
        " 1111111 ",
        "  1111  ",
        "   111   ",
    ],
    JOKER_FACE: [
        "1   1   1", // Row 0 (9) - Hat points
        " 1 1 1 1",  // Row 1 (8)
        "111111111", // Row 2 (9) - Hat base
        "11    11",  // Row 3 (8) - Eyes
        "111 1 111", // Row 4 (9) - Nose
        " 1    1 ",  // Row 5 (8) - Cheeks
        " 111111 ",  // Row 6 (8) - Smile
        "  11111  ", // Row 7 (9) - Jaw
    ],
    FROG_FACE: [
        " 11   11 ", // Row 0 (9) - Eyes top
        "11111111",  // Row 1 (8) - Eyes bottom
        "111111111", // Row 2 (9) - Face
        "11111111",  // Row 3 (8)
        "111111111", // Row 4 (9) - Mouth area
        " 111111 ",  // Row 5 (8)
        "  11111  ", // Row 6 (9)
    ],
};

export const getLevelPattern = (level: number): Pattern => {
    const patternNames = Object.keys(PATTERNS);
    const patternIndex = (level - 1) % patternNames.length;
    const patternName = patternNames[patternIndex];
    return PATTERNS[patternName];
};

/**
 * Level configuration with metal grid protection
 * Every level from 1-100 has a random color that gets metal grid protection
 * All bubbles of that color will be locked (require 2 hits)
 */
export const getLevelMetalGridConfig = (level: number): { color: string; percentage: number } => {
    // Use level as seed for consistent random color selection per level
    const colors = COLORS;
    const colorIndex = (level - 1) % colors.length;
    
    // Every level has metal grid protection on one random color
    return {
        color: colors[colorIndex],
        percentage: 100 // 100% of that color gets metal grid protection
    };
};

export const getLevelMoves = (level: number): number => {
    // Basic progression: Start with 30 moves, decrease slightly for harder levels (or increase if complex)
    // For now, fixed 30 moves or pattern dependent
    return 30; // Customize this logic if levels need different moves
};