import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';

/* ================= TYPES ================= */
type PatternId = 'diamond' | 'pyramid' | 'star' | 'hex' | 'heart' | 'butterfly' | 'cat' | 'owl' | 'skull' | 'flower';

/* ================= CONSTANTS ================= */
const BUBBLE = 28; 
const GAP = 4;
const INITIAL_VISIBLE_ROWS = 10;
const TOTAL_ROWS = 24; 
const MIN_COLS = 11;
const FALL_DURATION = 450;

// UPDATED: Fixed Yellow for shape, and only Blue, Red, Green for grid
const SHAPE_COLOR = '#FFD700'; // Pure Yellow
const ROW_COLORS = ['#FF3F34', '#007AFF', '#05C46B']; // Red, Blue, Green

/* ================= UTILS ================= */
const makeOdd = (n: number) => (n % 2 === 0 ? n - 1 : n);

function trimMask(mask: number[][]) {
  let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
  mask.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
    })
  );
  const trimmed: number[][] = [];
  for (let r = minR; r <= maxR; r++) {
    trimmed.push(mask[r].slice(minC, maxC + 1));
  }
  return trimmed;
}

function emptyGrid(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

const RAW_PATTERNS: Record<PatternId, number[][]> = {
  diamond: [[0,0,0,1,0,0,0],[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0],[0,0,0,1,0,0,0]],
  pyramid: [[0,0,0,0,1,0,0,0,0],[0,0,0,1,1,1,0,0,0],[0,0,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1]],
  star: [[0,0,1,0,0,0,1,0,0],[0,1,1,1,0,1,1,1,0],[1,1,1,1,1,1,1,1,1],[0,0,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,1,1],[0,1,1,1,0,1,1,1,0],[0,0,1,1,1,1,1,0,0]],
  hex: [[0,0,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,0,0]],
  heart: [[0,1,1,0,0,0,1,1,0],[1,1,1,1,0,1,1,1,1],[1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,0,0],[0,0,0,1,1,1,0,0,0]],
  butterfly: [[1,1,0,0,1,0,0,1,1],[1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1],[1,1,0,0,1,0,0,1,1]],
  cat: [[0,1,1,0,0,0,0,1,1,0],[1,1,1,1,0,0,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,0,1,1,1,1,0,1,1],[1,1,0,0,1,1,0,0,1,1],[1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0]],
  owl: [[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,0],[1,1,0,1,1,1,1,0,1,1],[1,1,0,1,1,1,1,0,1,1],[1,1,1,1,0,0,1,1,1,1],[0,1,1,1,1,1,1,1,1,0]],
  skull: [[0,0,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,0],[1,1,0,1,1,1,1,0,1],[1,1,0,1,1,1,1,0,1],[1,1,1,1,1,1,1,1,1],[0,0,1,1,1,1,1,0,0],[0,0,0,1,1,1,0,0,0]],
  flower: [[0,0,1,0,1,0,1,0,0],[0,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,0],[0,0,1,0,1,0,1,0,0]],
};

export default function App() {
  const [pattern, setPattern] = useState<PatternId>('heart');
  const { width } = useWindowDimensions();
  const GRID_COLS = useMemo(() => Math.max(MIN_COLS, makeOdd(Math.floor(width / (BUBBLE + GAP)))), [width]);

  const translateY = useRef(new Animated.Value(0)).current;
  const hiddenRowsRef = useRef<number[][]>([]);
  const [visibleGrid, setVisibleGrid] = useState<number[][]>([]);
  const [colorOffset, setColorOffset] = useState(0);

  const fullGrid = useMemo(() => {
    const shape = trimMask(RAW_PATTERNS[pattern]);
    const grid = emptyGrid(TOTAL_ROWS, GRID_COLS);
    const startRow = Math.floor((TOTAL_ROWS - shape.length) / 2);
    const startCol = Math.floor((GRID_COLS - shape[0].length) / 2);
    shape.forEach((row, r) => row.forEach((v, c) => { if (v) grid[startRow + r][startCol + c] = 1; }));
    return grid;
  }, [pattern, GRID_COLS]);

  const resetGrid = () => {
    translateY.setValue(0);
    setColorOffset(0);
    setVisibleGrid(fullGrid.slice(-INITIAL_VISIBLE_ROWS));
    hiddenRowsRef.current = fullGrid.slice(0, -INITIAL_VISIBLE_ROWS);
  };

  useEffect(() => { resetGrid(); }, [fullGrid]);

  const destroyRow = () => {
    if (hiddenRowsRef.current.length === 0) return;
    const nextRow = hiddenRowsRef.current.pop()!;
    const nextVisibleGrid = [nextRow, ...visibleGrid.slice(0, -1)];
    setColorOffset(prev => prev + 1);
    translateY.setValue(-(BUBBLE + GAP));
    setVisibleGrid(nextVisibleGrid);
    Animated.timing(translateY, { toValue: 0, duration: FALL_DURATION, useNativeDriver: true }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BUBBLE SHOOTER</Text>
      
      <View style={styles.gameBoard}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          {visibleGrid.map((row, r) => {
            const rowColor = ROW_COLORS[(r + colorOffset) % ROW_COLORS.length];
            return (
              <View key={`row-${r}`} style={styles.row}>
                {row.map((cell, c) => (
                  <View
                    key={`cell-${r}-${c}`}
                    style={[
                      styles.bubbleBase,
                      { borderColor: 'rgba(255,255,255,0.2)' }, 
                      cell ? styles.activeBubble : styles.emptySlot
                    ]}
                  >
                    <View 
                       style={[
                         styles.innerBubble, 
                         { 
                           backgroundColor: cell ? SHAPE_COLOR : rowColor,
                           opacity: 1, // UPDATED: Equally visible
                           shadowColor: '#000',
                         }
                       ]} 
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </Animated.View>
      </View>

      <View style={styles.uiContainer}>
        <TouchableOpacity style={styles.fireButton} onPress={destroyRow}>
          <Text style={styles.fireText}>DROP ROW</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetButton} onPress={resetGrid}>
          <Text style={styles.resetText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patternPicker}>
        {(Object.keys(RAW_PATTERNS) as PatternId[]).map((id) => (
          <TouchableOpacity
            key={id}
            onPress={() => setPattern(id)}
            style={[styles.patternBtn, pattern === id && styles.patternBtnActive]}
          >
            <Text style={[styles.patternLabel, pattern === id && { color: '#000' }]}>{id}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d14',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameBoard: {
    padding: 10,
    backgroundColor: '#161b22',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#30363d',
    height: INITIAL_VISIBLE_ROWS * (BUBBLE + GAP) + 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bubbleBase: {
    width: BUBBLE,
    height: BUBBLE,
    margin: GAP / 2,
    borderRadius: BUBBLE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  emptySlot: {
    backgroundColor: 'transparent',
  },
  activeBubble: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  innerBubble: {
    width: BUBBLE - 4,
    height: BUBBLE - 4,
    borderRadius: (BUBBLE - 4) / 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  uiContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  fireButton: {
    backgroundColor: '#05C46B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    elevation: 10,
  },
  fireText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#30363d',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
  },
  resetText: {
    color: '#8b949e',
    fontWeight: '700',
  },
  patternPicker: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  patternBtn: {
    backgroundColor: '#21262d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  patternBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  patternLabel: {
    color: '#c9d1d9',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});