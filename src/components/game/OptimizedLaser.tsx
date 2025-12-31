import React, { useRef, useEffect, memo } from 'react';
import { View, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

// ============================================================================
// OPTIMIZED LASER SYSTEM - ALL-IN-ONE COMPONENT
// ============================================================================

interface OptimizedLaserProps {
  cannonPos: { x: number; y: number };
  cannonSize: number;
  footerBottom: number;
  nextColor: string;
  currentShotColor: string;
  aimDots: any[];
  ghostBubble: { x: number; y: number; visible: boolean };
  shootingBubble: any;
  colorWaveAnim: Animated.Value;
  recoilAnim: Animated.Value;
  shootingRef: React.RefObject<any>;
  blastsActive: boolean;
}

const OptimizedLaser = memo(({
  cannonPos,
  cannonSize,
  footerBottom,
  nextColor,
  currentShotColor,
  aimDots,
  ghostBubble,
  shootingBubble,
  colorWaveAnim,
  recoilAnim,
  shootingRef,
  blastsActive
}: OptimizedLaserProps) => {
  const dotRefs = useRef<any[]>([]);
  const ghostRef = useRef<any>(null);

  // Calculate circle dimensions and position
  const circleSize = cannonSize + 30;
  const circleRadius = circleSize / 2;
  const circleCenterX = cannonPos.x;

  // ============================================================================
  // AIM DOTS UPDATE - OPTIMIZED
  // ============================================================================
  useEffect(() => {
    if (!aimDots.length) {
      // Hide all dots when no aiming
      for (let i = 0; i < 40; i++) {
        const ref = dotRefs.current?.[i];
        if (ref) ref.setNativeProps({ style: { opacity: 0 } });
      }
      return;
    }

    // Update visible dots
    aimDots.forEach((dot, idx) => {
      const ref = dotRefs.current?.[idx];
      if (ref && dot && idx < 40) {
        ref.setNativeProps({
          style: {
            opacity: dot.opacity || 1,
            transform: [
              { translateX: dot.x - 3 },
              { translateY: dot.y - 3 }
            ]
          }
        });
      }
    });

    // Hide unused dots
    for (let idx = aimDots.length; idx < 40; idx++) {
      const ref = dotRefs.current?.[idx];
      if (ref) ref.setNativeProps({ style: { opacity: 0 } });
    }
  }, [aimDots]);

  // ============================================================================
  // GHOST BUBBLE UPDATE - OPTIMIZED
  // ============================================================================
  useEffect(() => {
    if (ghostRef.current) {
      const smallerSize = cannonSize * 0.6;
      ghostRef.current.setNativeProps({
        style: {
          opacity: ghostBubble.visible ? 0.6 : 0,
          transform: [
            { translateX: ghostBubble.x - smallerSize / 2 },
            { translateY: ghostBubble.y - smallerSize / 2 }
          ]
        }
      });
    }
  }, [ghostBubble.visible, ghostBubble.x, ghostBubble.y, cannonSize]);

  return (
    <>
      {/* ================================================================== */}
      {/* FIRING CIRCLE - SHOWS DISABLED STATE WHEN BLASTS ACTIVE */}
      {/* ================================================================== */}
      <View style={{
        position: 'absolute',
        bottom: footerBottom,
        left: circleCenterX - circleRadius,
        width: circleSize,
        height: circleSize,
        borderRadius: circleRadius,
        borderWidth: 2,
        borderColor: blastsActive ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 224, 255, 0.8)',
        borderStyle: 'dashed',
        zIndex: 99,
        opacity: blastsActive ? 0.3 : 1,
      }} />

      {/* ================================================================== */}
      {/* COLOR WAVE EFFECT - CONDITIONAL RENDER */}
      {/* ================================================================== */}
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

      {/* ================================================================== */}
      {/* LASER TRACER DOTS - ULTRA OPTIMIZED */}
      {/* ================================================================== */}
      {Array.from({ length: 40 }).map((_, idx) => (
        <View
          key={idx}
          ref={el => { if (dotRefs.current) dotRefs.current[idx] = el; }}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 6,
            height: 6,
            backgroundColor: nextColor,
            borderRadius: 3,
            opacity: 0,
            zIndex: 100,
            shadowColor: nextColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 5,
          }}
        />
      ))}

      {/* ================================================================== */}
      {/* GHOST PREDICTION BUBBLE - SMALLER AND MORE PRECISE */}
      {/* ================================================================== */}
      <View
        ref={ghostRef}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: cannonSize * 0.6,
          height: cannonSize * 0.6,
          borderRadius: (cannonSize * 0.6) / 2,
          borderWidth: 2,
          borderColor: nextColor,
          borderStyle: 'dashed',
          backgroundColor: 'transparent',
          opacity: 0,
          zIndex: 95,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Inner prediction dot - shows exact hit point */}
        <View style={{
          width: cannonSize * 0.2,
          height: cannonSize * 0.2,
          borderRadius: (cannonSize * 0.2) / 2,
          backgroundColor: nextColor,
          opacity: 0.8,
        }} />
      </View>

      {/* ================================================================== */}
      {/* SHOOTING LASER BALL - WITH BURNING ANIMATION */}
      {/* ================================================================== */}
      {shootingBubble && (
        <View
          ref={shootingRef}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 32,
            height: 32,
            zIndex: 101,
            opacity: 0,
          }}
        >
          <BurningLaserBall color={shootingBubble.color} />
        </View>
      )}

      {/* ================================================================== */}
      {/* SPACESHIP WITH RECOIL - SIMPLIFIED */}
      {/* ================================================================== */}
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
          source={require("../../images/Spaceship.json")}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </>
  );
});

// ============================================================================
// BURNING LASER BALL COMPONENT WITH PARTICLE TRAILS
// ============================================================================
const BurningLaserBall = memo(({ color }: { color: string }) => {
  const flameAnim1 = useRef(new Animated.Value(0)).current;
  const flameAnim2 = useRef(new Animated.Value(0)).current;
  const flameAnim3 = useRef(new Animated.Value(0)).current;
  const coreAnim = useRef(new Animated.Value(1)).current;
  const sparkAnim = useRef(new Animated.Value(0)).current;

  // Particle trail animations
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;
  const particle6 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Flame animations - different speeds for realistic fire effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(flameAnim1, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim2, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flameAnim2, { toValue: 0, duration: 250, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim3, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(flameAnim3, { toValue: 0, duration: 220, useNativeDriver: true }),
      ])
    ).start();

    // Core pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(coreAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(coreAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ])
    ).start();

    // Sparks animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(sparkAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      ])
    ).start();

    // Particle trail animations - staggered for realistic trail effect
    const startParticleAnimation = (particleAnim: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(particleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(particleAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        ).start();
      }, delay);
    };

    startParticleAnimation(particle1, 0);
    startParticleAnimation(particle2, 50);
    startParticleAnimation(particle3, 100);
    startParticleAnimation(particle4, 150);
    startParticleAnimation(particle5, 200);
    startParticleAnimation(particle6, 250);
  }, []);

  return (
    <View style={{
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* ================================================================== */}
      {/* PARTICLE TRAILS */}
      {/* ================================================================== */}

      {/* Particle 1 - Large orange */}
      <Animated.View style={{
        position: 'absolute',
        left: -12,
        top: 2,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6500',
        opacity: particle1.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.8, 0]
        }),
        transform: [
          {
            translateX: particle1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -15]
            })
          },
          {
            scale: particle1.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [1, 1.2, 0.3]
            })
          }
        ]
      }} />

      {/* Particle 2 - Medium red */}
      <Animated.View style={{
        position: 'absolute',
        left: -10,
        top: 8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FF4500',
        opacity: particle2.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 0.9, 0]
        }),
        transform: [
          {
            translateX: particle2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -12]
            })
          },
          {
            translateY: particle2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 3]
            })
          },
          {
            scale: particle2.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [1, 1.3, 0.2]
            })
          }
        ]
      }} />

      {/* Particle 3 - Small yellow */}
      <Animated.View style={{
        position: 'absolute',
        left: -8,
        top: 12,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#FFD700',
        opacity: particle3.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, 1, 0]
        }),
        transform: [
          {
            translateX: particle3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10]
            })
          },
          {
            translateY: particle3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -2]
            })
          },
          {
            scale: particle3.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.4, 0.1]
            })
          }
        ]
      }} />

      {/* Particle 4 - Medium orange */}
      <Animated.View style={{
        position: 'absolute',
        left: -11,
        top: 18,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#FF8C00',
        opacity: particle4.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 0.7, 0]
        }),
        transform: [
          {
            translateX: particle4.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -13]
            })
          },
          {
            translateY: particle4.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 4]
            })
          },
          {
            scale: particle4.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [1, 1.1, 0.4]
            })
          }
        ]
      }} />

      {/* Particle 5 - Small red */}
      <Animated.View style={{
        position: 'absolute',
        left: -9,
        top: 24,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#FF3030',
        opacity: particle5.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0, 0.8, 0]
        }),
        transform: [
          {
            translateX: particle5.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -8]
            })
          },
          {
            translateY: particle5.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3]
            })
          },
          {
            scale: particle5.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [1, 1.5, 0.2]
            })
          }
        ]
      }} />

      {/* Particle 6 - Tiny spark */}
      <Animated.View style={{
        position: 'absolute',
        left: -7,
        top: 6,
        width: 1.5,
        height: 1.5,
        borderRadius: 0.75,
        backgroundColor: '#FFFF00',
        opacity: particle6.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 0]
        }),
        transform: [
          {
            translateX: particle6.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -6]
            })
          },
          {
            translateY: particle6.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1]
            })
          },
          {
            scale: particle6.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [1, 2, 0.1]
            })
          }
        ]
      }} />

      {/* ================================================================== */}
      {/* ORIGINAL BURNING BALL EFFECTS */}
      {/* ================================================================== */}

      {/* Outer fire glow */}
      <Animated.View style={{
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF4500',
        opacity: flameAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 0.4]
        }),
        transform: [{
          scale: flameAnim1.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.3]
          })
        }]
      }} />

      {/* Middle fire layer */}
      <Animated.View style={{
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF6500',
        opacity: flameAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.6]
        }),
        transform: [{
          scale: flameAnim2.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2]
          })
        }]
      }} />

      {/* Inner fire layer */}
      <Animated.View style={{
        position: 'absolute',
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FF8C00',
        opacity: flameAnim3.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 0.7]
        }),
        transform: [{
          scale: flameAnim3.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.15]
          })
        }]
      }} />

      {/* Main ball core */}
      <Animated.View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 10,
        transform: [{ scale: coreAnim }],
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Inner glow core */}
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }} />
      </Animated.View>

      {/* Fire sparks */}
      <Animated.View style={{
        position: 'absolute',
        top: -2,
        right: 2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFD700',
        opacity: sparkAnim,
        transform: [{
          scale: sparkAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1.5]
          })
        }]
      }} />

      <Animated.View style={{
        position: 'absolute',
        bottom: 0,
        left: -1,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#FF4500',
        opacity: sparkAnim,
        transform: [{
          scale: sparkAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.5]
          })
        }]
      }} />

      <Animated.View style={{
        position: 'absolute',
        top: 4,
        left: -2,
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#FFA500',
        opacity: sparkAnim,
        transform: [{
          scale: sparkAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.2]
          })
        }]
      }} />

      {/* Trailing fire effect */}
      <Animated.View style={{
        position: 'absolute',
        left: -8,
        width: 8,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6500',
        opacity: flameAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.6]
        }),
        transform: [{
          scaleX: flameAnim1.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
          })
        }]
      }} />
    </View>
  );
});

export default OptimizedLaser;