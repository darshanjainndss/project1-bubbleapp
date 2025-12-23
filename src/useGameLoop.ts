import { useEffect, useRef } from 'react';

/**
 * Game Loop Hook for React Native
 * Provides a 60 FPS update loop for game mechanics
 * Uses requestAnimationFrame with proper React Native compatibility
 */
export const useGameLoop = (updateFn: (deltaTime: number) => void) => {
  const frameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      
      // Clamp delta time to prevent huge jumps (e.g., when app is backgrounded)
      const clampedDt = Math.min(deltaTime, 0.1);
      
      // Call the update function with delta time
      if (clampedDt > 0) {
        updateFn(clampedDt);
      }
      
      lastTimeRef.current = currentTime;
      
      // Schedule next frame
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    frameIdRef.current = requestAnimationFrame(gameLoop);

    // Cleanup: cancel animation frame when component unmounts
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [updateFn]);
};

/**
 * Alternative hook for measuring FPS (for performance monitoring)
 */
export const useGameLoopWithFPS = (
  updateFn: (deltaTime: number) => void,
  onFpsChange?: (fps: number) => void
) => {
  const frameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(Date.now());
  const fpsUpdateTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      
      // Clamp delta time
      const clampedDt = Math.min(deltaTime, 0.1);
      
      // Update game
      updateFn(clampedDt);
      
      // Update FPS counter
      frameCountRef.current++;
      const elapsed = now - fpsUpdateTimeRef.current;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        if (onFpsChange) {
          onFpsChange(fps);
        }
        frameCountRef.current = 0;
        fpsUpdateTimeRef.current = now;
      }
      
      lastTimeRef.current = now;
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [updateFn, onFpsChange]);
};

/**
 * Throttled update hook (useful for non-critical updates)
 * Ensures updates happen at most once per specified interval
 */
export const useThrottledGameLoop = (
  updateFn: (deltaTime: number) => void,
  throttleMs: number = 16.67 // ~60 FPS
) => {
  const frameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(Date.now());
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      if (timeSinceLastUpdate >= throttleMs) {
        const deltaTime = timeSinceLastUpdate / 1000;
        updateFn(Math.min(deltaTime, 0.1));
        lastUpdateRef.current = now;
      }

      lastTimeRef.current = now;
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [updateFn, throttleMs]);
};

/**
 * Pause-able game loop hook
 * Allows pausing and resuming the game
 */
export const usePauseableGameLoop = (
  updateFn: (deltaTime: number) => void,
  isPaused: boolean = false
) => {
  const frameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isPaused) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      
      updateFn(Math.min(deltaTime, 0.1));
      
      lastTimeRef.current = now;
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [updateFn, isPaused]);
};

/**
 * Debug game loop that logs frame times
 * Useful for performance profiling
 */
export const useDebugGameLoop = (
  updateFn: (deltaTime: number) => void,
  logFrequency: number = 30 // Log every N frames
) => {
  const frameIdRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const frameTimes = useRef<number[]>([]);

  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      
      updateFn(Math.min(deltaTime, 0.1));
      
      frameTimes.current.push(deltaTime * 1000); // Convert to ms
      frameCountRef.current++;

      if (frameCountRef.current >= logFrequency) {
        const avg = frameTimes.current.reduce((a, b) => a + b) / frameTimes.current.length;
        const max = Math.max(...frameTimes.current);
        const min = Math.min(...frameTimes.current);
        
        console.log(
          `Frame Times - Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`
        );

        frameCountRef.current = 0;
        frameTimes.current = [];
      }

      lastTimeRef.current = now;
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [updateFn, logFrequency]);
};

export default useGameLoop;