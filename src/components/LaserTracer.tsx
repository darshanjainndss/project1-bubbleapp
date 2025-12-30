import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface LaserTracerProps {
    color: string;
    angle: number; // in radians
}

const LaserTracer = React.memo(({ color, angle }: LaserTracerProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const particlesAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // High-frequency pulsing for "intense energy"
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 80, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 80, useNativeDriver: true }),
            ])
        ).start();

        // Constant particle flow for tail
        Animated.loop(
            Animated.timing(particlesAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    return (
        <View style={[styles.container, { transform: [{ rotate: `${angle}rad` }] }]}>

            {/* 1. Long Trail / Motion Blur (Fade from color to transparent) */}
            <LinearGradient
                colors={['rgba(255,255,255,0)', color]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.trail}
            />

            {/* 2. Outer Glow (Soft Neon Halo) */}
            <Animated.View style={[
                styles.glow,
                {
                    backgroundColor: color,
                    opacity: 0.6,
                    transform: [{ scale: pulseAnim }]
                }
            ]} />

            {/* 3. The Solid Core Beam */}
            <View style={[styles.beam, { backgroundColor: color }]} />

            {/* 4. White Hot Center (Intensity) */}
            <View style={styles.whiteCore} />

            {/* 5. Trailing Particles/Sparks */}
            {[...Array(4)].map((_, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.spark,
                        {
                            backgroundColor: color,
                            left: -10 - (i * 15), // Staggered behind
                            opacity: particlesAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0] // Fade out as they move back? 
                                // Actually, let's just make them flicker or move back relative to the head
                            }),
                            transform: [
                                {
                                    translateX: particlesAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -30] // Move backward relative to laser
                                    })
                                },
                                { scale: Math.random() * 0.5 + 0.5 }
                            ]
                        }
                    ]}
                />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 60, // Length of the laser visuals
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        // We center the "head" of the laser at the pivot point
        // adjustments might be needed depending on how it's positioned in GameScreen
    },
    trail: {
        position: 'absolute',
        left: -40, // Extend behind
        width: 60,
        height: 12,
        borderRadius: 6,
    },
    glow: {
        position: 'absolute',
        width: 40,
        height: 14,
        borderRadius: 7,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10, // Android bright glow
    },
    beam: {
        position: 'absolute',
        width: 30, // The sharp part
        height: 8,
        borderRadius: 4,
    },
    whiteCore: {
        position: 'absolute',
        width: 20,
        height: 4,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        shadowColor: '#fff',
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 5,
    },
    spark: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        top: 8, // center vertically roughly
    }
});

export default LaserTracer;
