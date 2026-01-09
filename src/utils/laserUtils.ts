import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LaserCalculations {
  circleCenterX: number;
  circleCenterY: number;
  circleRadius: number;
  traceStartX: number;
  traceStartY: number;
}

export const calculateLaserGeometry = (
  cannonSize: number,
  footerBottom: number,
  aimAngle: number
): LaserCalculations => {
  const circleSize = cannonSize + 30;
  const circleRadius = circleSize / 2;
  const circleCenterX = SCREEN_WIDTH / 2;
  const circleCenterY = SCREEN_HEIGHT - footerBottom - (cannonSize / 2);

  // Start from center of cannon
  const traceStartX = circleCenterX;
  const traceStartY = circleCenterY;

  return {
    circleCenterX,
    circleCenterY,
    circleRadius,
    traceStartX,
    traceStartY,
  };
};

export const calculateAimingPath = (
  startX: number,
  startY: number,
  angle: number,
  bubbles: any[],
  currentScrollY: number,
  bubbleSize: number,
  gridTop: number
) => {
  const dots = [];
  let tx = startX;
  let ty = startY;
  let vx = Math.cos(angle) * 8; // Increased step size to match higher velocity
  let vy = Math.sin(angle) * 8;
  let hitPoint = null;

  const stepDist = 15; // Reduced distance between dots for smoother path
  let distSinceLastDot = stepDist; // Start with a dot

  for (let i = 0; i < 500; i++) { // Increased iterations for longer paths
    tx += vx;
    ty += vy;
    distSinceLastDot += 8; // Updated step size

    // Wall bouncing
    if (tx < bubbleSize / 2 && vx < 0) {
      tx = bubbleSize / 2;
      vx *= -1;
    } else if (tx > SCREEN_WIDTH - bubbleSize / 2 && vx > 0) {
      tx = SCREEN_WIDTH - bubbleSize / 2;
      vx *= -1;
    }

    // Bubble collision detection
    const hitIdx = bubbles.findIndex(b =>
      b.visible &&
      Math.sqrt((tx - b.x) ** 2 + (ty - (b.y + currentScrollY)) ** 2) < bubbleSize * 0.85
    );

    if (hitIdx !== -1 || ty < gridTop) {
      hitPoint = { x: tx, y: ty };
      break;
    }

    if (distSinceLastDot >= stepDist) {
      dots.push({
        x: tx,
        y: ty,
        opacity: Math.max(0.2, 1 - dots.length / 50)
      });
      distSinceLastDot = 0;
    }
  }

  return { dots, hitPoint };
};

export const findBestLandingSpot = (
  hitPoint: { x: number; y: number },
  bubbles: any[],
  scrollOffset: number,
  getPos: (row: number, col: number) => { x: number; y: number }
) => {
  let best = { r: 0, c: 0, distSq: Infinity };
  const hitX = hitPoint.x;
  const hitY = hitPoint.y;

  for (let r = 0; r < 35; r++) {
    const rowWidth = (r % 2 === 0) ? 9 : 8;
    for (let c = 0; c < rowWidth; c++) {
      if (bubbles.some(b => b.visible && b.row === r && b.col === c)) continue;

      const coords = getPos(r, c);
      const dSq = (hitX - coords.x) ** 2 + (hitY - (coords.y + scrollOffset)) ** 2;

      if (dSq < best.distSq) {
        best = { r, c, distSq: dSq };
      }
    }
  }

  return best;
};

export const createShotFromCannonCenter = (
  cannonSize: number,
  footerBottom: number,
  angle: number,
  velocity: number,
  color: string,
  powerUps: {
    hasLightning: boolean;
    hasBomb: boolean;
    hasFreeze: boolean;
    hasFire: boolean;
  }
) => {
  const { traceStartX, traceStartY } = calculateLaserGeometry(cannonSize, footerBottom, angle);

  return {
    x: traceStartX,
    y: traceStartY,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    color,
    ...powerUps,
  };
};