import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ImprovedLaserBeamProps {
    color: string;
}

// New improved laser beam with better visual design
const ImprovedLaserBeam = React.memo(({ color }: ImprovedLaserBeamProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fast energy pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true
                }),
            ])
        ).start();

        // Glow effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }),
            ])
        ).start();
    }, []);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 0.9]
    });

    return (
        <View style={styles.container}>
            {/* Outer energy field */}
            <Animated.View
                style={[
                    styles.energyField,
                    {
                        backgroundColor: color,
                        opacity: glowOpacity,
                        transform: [{ scaleY: pulseAnim }]
                    }
                ]}
            />

            {/* Main laser beam */}
            <Animated.View
                style={[
                    styles.mainLaser,
                    {
                        backgroundColor: color,
                        transform: [{ scaleY: pulseAnim }]
                    }
                ]}
            />

            {/* Bright core */}
            <View style={styles.laserCore}>
                <View style={styles.whiteLine} />
            </View>

            {/* Energy sparks */}
            <Animated.View
                style={[
                    styles.spark1,
                    {
                        backgroundColor: '#fff',
                        opacity: glowOpacity,
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.spark2,
                    {
                        backgroundColor: '#fff',
                        opacity: glowOpacity,
                    }
                ]}
            />

            {/* Laser head */}
            <Animated.View
                style={[
                    styles.laserHead,
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
        width: 60,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    energyField: {
        position: 'absolute',
        width: 50,
        height: 16,
        borderRadius: 8,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 15,
    },
    mainLaser: {
        position: 'absolute',
        width: 45,
        height: 10,
        borderRadius: 5,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 10,
    },
    laserCore: {
        position: 'absolute',
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    whiteLine: {
        width: '90%',
        height: 2,
        backgroundColor: '#fff',
        borderRadius: 1,
    },
    spark1: {
        position: 'absolute',
        left: 8,
        top: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    spark2: {
        position: 'absolute',
        left: 15,
        bottom: 6,
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    laserHead: {
        position: 'absolute',
        right: 5,
        width: 12,
        height: 12,
        borderRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 12,
    }
});

export default ImprovedLaserBeam;
