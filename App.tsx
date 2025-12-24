import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
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

const TOTAL_ROWS = 18;
const INITIAL_VISIBLE_ROWS = 9;
const MIN_COLS = 13;
const FALL_DURATION = 350;

/* ================= UTILS ================= */

const makeOdd = (n: number) => (n % 2 === 0 ? n - 1 : n);

function trimMask(mask: number[][]) {
  let minR = Infinity,
    maxR = -1,
    minC = Infinity,
    maxC = -1;

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

function emptyGrid(rows: number, cols: number) {
  return Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );
}

/* ================= SHAPES ================= */

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

  const translateY = useRef(new Animated.Value(0)).current;
  const hiddenRowsRef = useRef<number[][]>([]);

  const fullGrid = useMemo(() => {
    const shape = trimMask(RAW_PATTERNS[pattern]);
    const grid = emptyGrid(TOTAL_ROWS, GRID_COLS);

    const startRow = Math.floor(
      (TOTAL_ROWS - shape.length) / 2
    );
    const startCol = Math.floor(
      (GRID_COLS - shape[0].length) / 2
    );

    shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) grid[startRow + r][startCol + c] = 1;
      })
    );

    return grid;
  }, [pattern, GRID_COLS]);

  const [visibleGrid, setVisibleGrid] = useState(
    fullGrid.slice(0, INITIAL_VISIBLE_ROWS)
  );

  /* ✅ RESET GRID WHEN PATTERN CHANGES */
  useEffect(() => {
    translateY.setValue(0);
    setVisibleGrid(fullGrid.slice(0, INITIAL_VISIBLE_ROWS));
    hiddenRowsRef.current =
      fullGrid.slice(INITIAL_VISIBLE_ROWS);
  }, [fullGrid]);

  const destroyRow = () => {
    if (!hiddenRowsRef.current.length) return;

    const trimmed = visibleGrid.slice(0, -1);
    const newRow = hiddenRowsRef.current.shift()!;

    translateY.setValue(-(BUBBLE + GAP));
    setVisibleGrid([newRow, ...trimmed]);

    Animated.timing(translateY, {
      toValue: 0,
      duration: FALL_DURATION,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bubble Grid Falling</Text>

      <View style={styles.viewport}>
        <Animated.View
          style={{ transform: [{ translateY }] }}
        >
          {visibleGrid.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((cell, c) => (
                <View
                  key={c}
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: cell
                        ? '#ffd32a'
                        : '#2b1652',
                      opacity: cell ? 1 : 0.25,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </Animated.View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={destroyRow}
      >
        <Text style={styles.buttonText}>
          Destroy Row → Fall
        </Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        {(Object.keys(RAW_PATTERNS) as PatternId[]).map(id => (
          <TouchableOpacity
            key={id}
            onPress={() => setPattern(id)}
            style={styles.smallBtn}
          >
            <Text style={styles.smallText}>{id}</Text>
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
  viewport: {
    height:
      INITIAL_VISIBLE_ROWS * (BUBBLE + GAP) + 16,
    overflow: 'hidden',
    backgroundColor: '#331462',
    borderRadius: 18,
    paddingVertical: 8,
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
  button: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffd32a',
  },
  buttonText: {
    fontWeight: '800',
    color: '#2c2c2c',
  },
  controls: {
    position: 'absolute',
    bottom: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ffffff22',
  },
  smallText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
