import { useCallback } from 'react';
import { GestureResponderEvent } from 'react-native';
import { useGameStore } from '../types/gameStore';

export const useAimTracking = () => {
  const { setAimTargetFromTouch } = useGameStore();

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      setAimTargetFromTouch({ x: locationX, y: locationY });
    },
    [setAimTargetFromTouch]
  );

  const onTouchStart = onTouchMove;

  const onTouchEnd = useCallback(() => {
    // Optionally fire the bubble here
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
