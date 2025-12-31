import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LaserBeamProps {
    color: string;
}

// Optimized, simple laser beam with minimal animations for better performance
const LaserBeam = React.memo(({ color }: LaserBeamProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Single optimized pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 80,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.9,
                    duration: 80,
                    useNativeDriver: true
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Outer glow */}
            <Animated.View
                style={[
                    styles.outerGlow,
                    {
                        backgroundColor: color,
                        opacity: 0.3,
                        transform: [{ scaleY: pulseAnim }]
                    }
                ]}
            />

            {/* Main beam */}
            <Animated.View
                style={[
                    styles.mainBeam,
                    {
                        backgroundColor: color,
                        transform: [{ scaleY: pulseAnim }]
                    }
                ]}
            />

            {/* Core white line */}
            <View style={styles.coreLine} />

            {/* Head point */}
            <Animated.View
                style={[
                    styles.headPoint,
                    {
                        backgroundColor: '#fff',
                        shadowColor: color,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 50,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerGlow: {
        position: 'absolute',
        width: 40,
        height: 14,
        borderRadius: 7,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 12,
    },
    mainBeam: {
        position: 'absolute',
        width: 35,
        height: 8,
        borderRadius: 4,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 8,
    },
    coreLine: {
        position: 'absolute',
        width: 30,
        height: 3,
        backgroundColor: '#fff',
        borderRadius: 1.5,
    },
    headPoint: {
        position: 'absolute',
        right: 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 10,
    }
});

export default LaserBeam;
