import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LaserBallProps {
    color: string;
    size?: number;
}

/**
 * A clean, modern laser-themed shooting ball.
 * Focuses on a bright core and soft neon glow without excessive visual clutter.
 */
const LaserBall = React.memo(({ color, size = 32 }: LaserBallProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Subtle constant pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true
                }),
            ])
        ).start();

        // Faster glow pulse for energy feel
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.5,
                    duration: 400,
                    useNativeDriver: true
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Outer soft glow layer */}
            <Animated.View
                style={[
                    styles.outerGlow,
                    {
                        width: size * 1.5,
                        height: size * 1.5,
                        borderRadius: (size * 1.5) / 2,
                        backgroundColor: color,
                        opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.15, 0.4]
                        }),
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            />

            {/* Middle neon aura */}
            <Animated.View
                style={[
                    styles.aura,
                    {
                        width: size * 1.1,
                        height: size * 1.1,
                        borderRadius: (size * 1.1) / 2,
                        backgroundColor: color,
                        opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 0.8]
                        }),
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            />

            {/* Core ball */}
            <View
                style={[
                    styles.core,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                        shadowColor: color,
                        shadowOpacity: 1,
                        shadowRadius: 10,
                        elevation: 5,
                    }
                ]}
            >
                {/* White hot center */}
                <View style={[styles.whiteCore, {
                    width: size * 0.6,
                    height: size * 0.6,
                    borderRadius: (size * 0.6) / 2,
                }]} />
            </View>
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
    },
    aura: {
        position: 'absolute',
    },
    core: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    whiteCore: {
        backgroundColor: '#fff',
        opacity: 0.9,
    },
});

export default LaserBall;
