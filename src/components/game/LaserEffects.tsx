import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface LaserShotProps {
    color: string;
    size?: number;
}

/**
 * A clean, modern circular laser-themed shot.
 * Replaces the bullet shape for a more classic bubble-shooter feel with premium laser effects.
 */
/**
 * An ultra-optimized, high-performance laser shot.
 * Uses a single layer with a simple shadow for maximum smoothness during fast movement.
 */
export const LaserShot = React.memo(({ color, size = 32 }: LaserShotProps) => {
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                borderWidth: 2,
                borderColor: '#fff',
                shadowColor: color,
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: 10,
            }}
        />
    );
});

/**
 * A pulsing zone indicator around the spaceship muzzle.
 * Helps users identify where they should touch to start the laser aiming.
 */
export const AimingZone = React.memo(({ color, active }: { color: string, active: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[
            styles.aimingZone,
            {
                borderColor: color,
                opacity: active ? 0.8 : 0.4,
                transform: [{ scale: scaleAnim }]
            }
        ]} />
    );
});

interface LaserTracerSegmentProps {
    color: string;
    opacity?: number;
}

/**
 * A single segment of the laser aiming tracer.
 */
export const LaserTracerSegment = React.memo(({ color, opacity = 1 }: LaserTracerSegmentProps) => {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 150, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={[styles.tracerContainer, { opacity }]}>
            {/* Outer Glow */}
            <Animated.View style={[
                styles.tracerGlow,
                {
                    backgroundColor: color,
                    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }),
                    transform: [{ scaleY: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }]
                }
            ]} />

            {/* Core Beam */}
            <View style={[styles.tracerCore, { backgroundColor: color }]}>
                <View style={styles.tracerWhiteLine} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    // Shot (Ball) Styles
    shotContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerGlow: {
        position: 'absolute',
    },
    shotBody: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    shotCore: {
        backgroundColor: '#fff',
        opacity: 0.95,
    },
    sparkle: {
        position: 'absolute',
        backgroundColor: '#fff',
        opacity: 0.8,
    },

    // Tracer Styles
    tracerContainer: {
        height: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tracerGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    tracerCore: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fff',
        shadowRadius: 4,
        shadowOpacity: 0.5,
        elevation: 3,
    },
    tracerWhiteLine: {
        width: '100%',
        height: 1.5,
        backgroundColor: '#fff',
        borderRadius: 1,
        opacity: 0.8,
    },
    // Aiming Zone Styles
    aimingZone: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fff',
        shadowRadius: 10,
        shadowOpacity: 0.3,
    }
});
