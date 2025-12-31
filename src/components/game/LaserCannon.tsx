import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LaserCannonProps {
    color: string;
    size?: number;
}

// Simple, optimized laser cannon design
const LaserCannon = ({ color, size = 80 }: LaserCannonProps) => {
    const glowAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Subtle glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        ).start();

        // Slow rotation for energy rings
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true
            })
        ).start();
    }, []);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7]
    });

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Outer energy ring */}
            <Animated.View
                style={[
                    styles.outerRing,
                    {
                        width: size,
                        height: size,
                        borderColor: color,
                        opacity: glowOpacity,
                        transform: [{ rotate: rotation }]
                    }
                ]}
            />

            {/* Main cannon body */}
            <View style={[styles.cannonBody, { width: size * 0.7, height: size * 0.7 }]}>
                {/* Core glow */}
                <Animated.View
                    style={[
                        styles.coreGlow,
                        {
                            backgroundColor: color,
                            opacity: glowOpacity,
                        }
                    ]}
                />

                {/* Cannon barrel */}
                <View style={styles.barrel}>
                    <View style={[styles.barrelCore, { backgroundColor: color }]} />
                    <View style={styles.barrelHighlight} />
                </View>

                {/* Side vents */}
                <View style={styles.ventLeft} />
                <View style={styles.ventRight} />

                {/* Center nozzle */}
                <View style={[styles.nozzle, { borderColor: color }]}>
                    <Animated.View
                        style={[
                            styles.nozzleGlow,
                            {
                                backgroundColor: color,
                                opacity: glowOpacity,
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Inner energy ring */}
            <Animated.View
                style={[
                    styles.innerRing,
                    {
                        borderColor: color,
                        opacity: glowOpacity,
                        transform: [{ rotate: rotation }]
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerRing: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    innerRing: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        borderStyle: 'dotted',
    },
    cannonBody: {
        borderRadius: 100,
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        borderWidth: 2,
        borderColor: '#00E0FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
    },
    coreGlow: {
        position: 'absolute',
        width: '80%',
        height: '80%',
        borderRadius: 100,
    },
    barrel: {
        position: 'absolute',
        top: -15,
        width: 20,
        height: 30,
        backgroundColor: 'rgba(50, 50, 60, 0.9)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#00E0FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    barrelCore: {
        width: 12,
        height: 20,
        borderRadius: 6,
    },
    barrelHighlight: {
        position: 'absolute',
        top: 5,
        left: 4,
        width: 4,
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
    },
    ventLeft: {
        position: 'absolute',
        left: 8,
        width: 3,
        height: 12,
        backgroundColor: '#00E0FF',
        borderRadius: 1.5,
        opacity: 0.6,
    },
    ventRight: {
        position: 'absolute',
        right: 8,
        width: 3,
        height: 12,
        backgroundColor: '#00E0FF',
        borderRadius: 1.5,
        opacity: 0.6,
    },
    nozzle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nozzleGlow: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});

export default LaserCannon;
