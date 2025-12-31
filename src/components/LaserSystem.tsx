import React, { useRef, useEffect, memo } from 'react';
import { View, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

interface LaserSystemProps {
  cannonPos: { x: number; y: number };
  cannonSize: number;
  footerBottom: number;
  nextColor: string;
  currentShotColor: string;
  isAiming: boolean;
  aimSegments: any[];
  ghostBubble: { x: number; y: number; visible: boolean };
  shootingBubble: any;
  colorWaveAnim: Animated.Value;
  recoilAnim: Animated.Value;
  onAimUpdate: (segments: any[], ghost: any) => void;
}

const LaserSystem: React.FC<LaserSystemProps> = memo(({
  cannonPos,
  cannonSize,
  footerBottom,
  nextColor,
  currentShotColor,
  aimSegments,
  ghostBubble,
  colorWaveAnim,
  recoilAnim,
}) => {
  const aimSegmentRefs = useRef<any[]>([]);
  const ghostRef = useRef<any>(null);

  // Calculate circle dimensions and position
  const circleSize = cannonSize + 30;
  const circleRadius = circleSize / 2;
  const circleCenterX = cannonPos.x;
  const circleCenterY = cannonPos.y;

  // Update aim segments via refs for performance - only when segments change
  useEffect(() => {
    if (!aimSegments.length) {
      // Hide all segments when no aiming
      for (let i = 0; i < 12; i++) {
        const ref = aimSegmentRefs.current?.[i];
        if (ref) ref.setNativeProps({ style: { opacity: 0 } });
      }
      return;
    }

    aimSegments.forEach((seg, idx) => {
      const ref = aimSegmentRefs.current?.[idx];
      if (ref && seg) {
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ref.setNativeProps({
          style: {
            opacity: Math.max(0.4, seg.opacity),
            width: length + 1,
            height: 4,
            transform: [
              { translateX: (seg.x1 + seg.x2) / 2 - (length + 1) / 2 },
              { translateY: (seg.y1 + seg.y2) / 2 - 2 },
              { rotate: `${angle}rad` }
            ]
          }
        });
      }
    });

    // Hide unused segments
    for (let idx = aimSegments.length; idx < 12; idx++) {
      const ref = aimSegmentRefs.current?.[idx];
      if (ref) ref.setNativeProps({ style: { opacity: 0 } });
    }
  }, [aimSegments]);

  // Update ghost bubble position - only when ghost changes
  useEffect(() => {
    if (ghostRef.current) {
      ghostRef.current.setNativeProps({
        style: {
          opacity: ghostBubble.visible ? 0.6 : 0,
          transform: [
            { translateX: ghostBubble.x - cannonSize / 2 },
            { translateY: ghostBubble.y - cannonSize / 2 }
          ]
        }
      });
    }
  }, [ghostBubble.visible, ghostBubble.x, ghostBubble.y, cannonSize]);

  return (
    <>
      {/* Firing Circle around spaceship */}
      <View style={{
        position: 'absolute',
        bottom: footerBottom,
        left: circleCenterX - circleRadius,
        width: circleSize,
        height: circleSize,
        borderRadius: circleRadius,
        borderWidth: 2,
        borderColor: 'rgba(0, 224, 255, 0.8)',
        borderStyle: 'dashed',
        zIndex: 99,
      }} />

      {/* Color Wave Effect - only render when active */}
      {currentShotColor ? (
        <Animated.View style={{
          position: 'absolute',
          bottom: footerBottom - 3,
          left: circleCenterX - circleRadius - 3,
          width: circleSize + 6,
          height: circleSize + 6,
          borderRadius: circleRadius + 3,
          borderWidth: 4,
          borderColor: currentShotColor,
          opacity: colorWaveAnim.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 0.9, 0.7, 0]
          }),
          transform: [{
            scale: colorWaveAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.8]
            })
          }],
          zIndex: 98,
        }} />
      ) : null}

      {/* Laser Tracer Segments - simplified */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(idx => (
        <View
          key={idx}
          ref={el => { if (aimSegmentRefs.current) aimSegmentRefs.current[idx] = el; }}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 10,
            height: 4,
            backgroundColor: nextColor,
            borderRadius: 2,
            opacity: 0,
            zIndex: 100,
          }}
        />
      ))}

      {/* Ghost Prediction Bubble - simplified */}
      <View 
        ref={ghostRef} 
        pointerEvents="none" 
        style={{ 
          position: 'absolute', 
          left: 0, 
          top: 0, 
          width: cannonSize,
          height: cannonSize,
          borderRadius: cannonSize / 2,
          borderWidth: 2,
          borderColor: nextColor,
          borderStyle: 'dashed',
          backgroundColor: 'transparent',
          opacity: 0,
          zIndex: 95
        }}
      />

      {/* Shooting Laser Ball - removed from LaserSystem */}

      {/* Spaceship with recoil animation */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: footerBottom,
          left: circleCenterX - cannonSize / 2,
          width: cannonSize,
          height: cannonSize,
          transform: [{ translateY: recoilAnim }],
          zIndex: 100,
        }}
      >
        <LottieView
          source={require("../images/Spaceship.json")}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </>
  );
});

export default LaserSystem;