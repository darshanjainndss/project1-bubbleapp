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
  const circleCenterY = SCREEN_HEIGHT - footerBottom - circleRadius;
  
  // Calculate starting point on circle edge
  const traceStartX = circleCenterX + Math.cos(aimAngle) * circleRadius;
  const traceStartY = circleCenterY + Math.sin(aimAngle) * circleRadius;
  
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
  const segments = [];
  let tx = startX;
  let ty = startY;
  let vx = Math.cos(angle) * 10;
  let vy = Math.sin(angle) * 10;
  let hitPoint = null;
  let segStartX = tx;
  let segStartY = ty;

  for (let i = 0; i < 200; i++) {
    tx += vx;
    ty += vy;
    let bounced = false;

    // Wall bouncing
    if (tx < bubbleSize / 2 && vx < 0) {
      tx = bubbleSize / 2;
      vx *= -1;
      bounced = true;
    } else if (tx > SCREEN_WIDTH - bubbleSize / 2 && vx > 0) {
      tx = SCREEN_WIDTH - bubbleSize / 2;
      vx *= -1;
      bounced = true;
    }

    // Bubble collision detection
    const hitIdx = bubbles.findIndex(b => 
      b.visible && 
      Math.sqrt((tx - b.x) ** 2 + (ty - (b.y + currentScrollY)) ** 2) < bubbleSize * 0.85
    );

    if (hitIdx !== -1 || ty < gridTop) {
      hitPoint = { x: tx, y: ty };
      segments.push({
        x1: segStartX,
        y1: segStartY,
        x2: tx,
        y2: ty,
        opacity: 1 - i / 300
      });
      break;
    }

    if (bounced) {
      segments.push({
        x1: segStartX,
        y1: segStartY,
        x2: tx,
        y2: ty,
        opacity: 1 - i / 300
      });
      segStartX = tx;
      segStartY = ty;
    }
  }

  return { segments, hitPoint };
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

export const createShotFromCircleEdge = (
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