import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

/* ================= TYPES ================= */

type PatternId =
  | 'diamond'
  | 'pyramid'
  | 'star'
  | 'hex'
  | 'heart'
  | 'butterfly'
  | 'cat'
  | 'owl'
  | 'skull'
  | 'flower';

/* ================= CONSTANTS ================= */

const BUBBLE = 26;
const GAP = 4;

const GRID_ROWS = 15;
const MIN_COLS = 13;

/* ================= UTILS ================= */

const makeOdd = (n: number) => (n % 2 === 0 ? n - 1 : n);

function trimMask(mask: number[][]) {
  let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;

  mask.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    })
  );

  const trimmed: number[][] = [];
  for (let r = minR; r <= maxR; r++) {
    trimmed.push(mask[r].slice(minC, maxC + 1));
  }
  return trimmed;
}

/* ================= SHAPES (ALL CENTER-SAFE) ================= */

const RAW_PATTERNS: Record<PatternId, number[][]> = {
  diamond: [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
  ],

  pyramid: [
    [0,0,0,0,1,0,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
  ],

  star: [
    [0,0,1,0,0,0,1,0,0],
    [0,1,1,1,0,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,0,1,1,1,0],
    [0,0,1,0,0,0,1,0,0],
  ],

  hex: [
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0],
  ],

  heart: [
    [0,1,1,0,0,0,1,1,0],
    [1,1,1,1,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,0,0,0],
  ],

  butterfly: [
    [1,1,0,0,1,0,0,1,1],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [1,1,0,0,1,0,0,1,1],
  ],

  cat: [
    [0,1,1,0,0,0,0,1,1,0],
    [1,1,1,1,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,0,0,1,1,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
  ],

  owl: [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,0,0,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
  ],

  skull: [
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,0,1],
    [1,1,0,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,0,0,0],
  ],

  flower: [
    [0,0,1,0,1,0,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,0,1,0,1,0,0],
  ],
};

/* ================= APP ================= */

export default function App() {
  const [pattern, setPattern] = useState<PatternId>('diamond');
  const { width } = useWindowDimensions();

  const rawCols = Math.floor(width / (BUBBLE + GAP));
  const GRID_COLS = Math.max(MIN_COLS, makeOdd(rawCols));

  const shape = useMemo(
    () => trimMask(RAW_PATTERNS[pattern]),
    [pattern]
  );

  const startRow = Math.floor((GRID_ROWS - shape.length) / 2);
  const startCol = Math.floor((GRID_COLS - shape[0].length) / 2);

  const grid = useMemo(() => {
    const m = Array.from({ length: GRID_ROWS }, () =>
      Array(GRID_COLS).fill(0)
    );
    shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) m[startRow + r][startCol + c] = 1;
      })
    );
    return m;
  }, [shape, GRID_COLS]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Centered Bubble Shapes (10)</Text>

      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => (
              <View
                key={c}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: cell ? '#ffd32a' : '#2b1652',
                    opacity: cell ? 1 : 0.25,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        {(Object.keys(RAW_PATTERNS) as PatternId[]).map(id => (
          <TouchableOpacity
            key={id}
            onPress={() => setPattern(id)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{id}</Text>
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
    backgroundColor: '#1b0638',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    backgroundColor: '#331462',
    padding: 12,
    borderRadius: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    margin: GAP / 2,
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  controls: {
    position: 'absolute',
    bottom: 26,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ffffff22',
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
