import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LaserBallProps {
    color: string;
    size?: number;
}

// New laser-themed shooting ball design
const LaserBall = React.memo(({ color, size = 36 }: LaserBallProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Energy pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.95,
                    duration: 150,
                    useNativeDriver: true
                }),
            ])
        ).start();

        // Rotation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            })
        ).start();

        // Glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
            ])
        ).start();
    }, []);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1]
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Outer energy glow */}
            <Animated.View
                style={[
                    styles.outerGlow,
                    {
                        width: size + 8,
                        height: size + 8,
                        borderRadius: (size + 8) / 2,
                        backgroundColor: color,
                        opacity: glowOpacity,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            />

            {/* Rotating energy ring */}
            <Animated.View
                style={[
                    styles.energyRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: color,
                        transform: [{ rotate: rotation }]
                    }
                ]}
            />

            {/* Main ball */}
            <Animated.View
                style={[
                    styles.mainBall,
                    {
                        width: size - 4,
                        height: size - 4,
                        borderRadius: (size - 4) / 2,
                        backgroundColor: color,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            >
                {/* Inner bright core */}
                <View style={[styles.innerCore, {
                    width: size - 12,
                    height: size - 12,
                    borderRadius: (size - 12) / 2,
                }]}>
                    <View style={[styles.brightSpot, {
                        width: size / 3,
                        height: size / 3,
                        borderRadius: size / 6,
                    }]} />
                </View>
            </Animated.View>

            {/* Energy particles */}
            <Animated.View
                style={[
                    styles.particle1,
                    {
                        backgroundColor: '#fff',
                        opacity: glowOpacity,
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.particle2,
                    {
                        backgroundColor: '#fff',
                        opacity: glowOpacity,
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.particle3,
                    {
                        backgroundColor: '#fff',
                        opacity: glowOpacity,
                    }
                ]}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerGlow: {
        position: 'absolute',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 15,
    },
    energyRing: {
        position: 'absolute',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    mainBall: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 12,
    },
    innerCore: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brightSpot: {
        backgroundColor: '#fff',
    },
    particle1: {
        position: 'absolute',
        top: 2,
        right: 8,
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    particle2: {
        position: 'absolute',
        bottom: 4,
        left: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    particle3: {
        position: 'absolute',
        top: 10,
        left: 2,
        width: 2,
        height: 2,
        borderRadius: 1,
    },
});

export default LaserBall;
