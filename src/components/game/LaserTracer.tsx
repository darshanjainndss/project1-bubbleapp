import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LaserTracerProps {
    color: string;
    width: number;
    opacity?: number;
}

/**
 * A clean, high-tech laser tracer line component.
 * Features a bright white core and a vibrant neon aura.
 */
const LaserTracer = React.memo(({ color, width, opacity = 1 }: LaserTracerProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Subtle energy flicker/pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.9,
                    duration: 100,
                    useNativeDriver: true
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={[styles.container, { width, opacity }]}>
            {/* Outer Glow Area */}
            <Animated.View style={[
                styles.glowLayer,
                {
                    backgroundColor: color,
                    transform: [{ scaleY: pulseAnim }]
                }
            ]} />

            {/* Main Laser Line */}
            <View style={[styles.mainLine, { backgroundColor: color }]} />

            {/* White Core Line */}
            <View style={styles.whiteCore} />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        height: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowLayer: {
        position: 'absolute',
        width: '100%',
        height: 8,
        borderRadius: 4,
        opacity: 0.4,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
    },
    mainLine: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 5,
    },
    whiteCore: {
        position: 'absolute',
        width: '100%',
        height: 1.5,
        backgroundColor: '#fff',
        borderRadius: 1,
        opacity: 0.9,
    }
});

export default LaserTracer;
