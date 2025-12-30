import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface BubbleBlastProps {
    x: number;
    y: number;
    color: string;
    onComplete: () => void;
}

const PARTICLE_COUNT = 12; // Shards
const LIQUID_COUNT = 6;    // Liquid blobs

const BubbleBlast = ({ x, y, color, onComplete }: BubbleBlastProps) => {
    // 1. Flash Animation
    const flashOpacity = useRef(new Animated.Value(1)).current;
    const flashScale = useRef(new Animated.Value(0.5)).current;

    // 2. Shockwave Ring
    const ringScale = useRef(new Animated.Value(0.5)).current;
    const ringOpacity = useRef(new Animated.Value(1)).current;

    // 3. Particles
    const particles = useRef([...Array(PARTICLE_COUNT)].map(() => ({
        dist: new Animated.Value(0),
        opacity: new Animated.Value(1),
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.8 + 0.5,
        size: Math.random() * 6 + 3,
    }))).current;

    // 4. Liquid Blobs
    const liquids = useRef([...Array(LIQUID_COUNT)].map(() => ({
        dist: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1),
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.2, // Slower moving
    }))).current;

    useEffect(() => {
        // Run all animations
        Animated.parallel([
            // Flash: Quick burst
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(flashScale, { toValue: 2, duration: 150, useNativeDriver: true }),
                    Animated.timing(flashOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                ])
            ]),

            // Ring: Expanding wave
            Animated.parallel([
                Animated.timing(ringScale, {
                    toValue: 2.5,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true
                }),
                Animated.timing(ringOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true
                })
            ]),

            // Particles: "Explosion with subtle slow-down" (easeOut)
            ...particles.map(p =>
                Animated.parallel([
                    Animated.timing(p.dist, {
                        toValue: 80 * p.speed, // Travel distance based on speed
                        duration: 500,
                        easing: Easing.out(Easing.exp), // Fast start, slow end
                        useNativeDriver: true
                    }),
                    Animated.timing(p.opacity, {
                        toValue: 0,
                        duration: 500,
                        delay: 100, // Slight delay before fading
                        useNativeDriver: true
                    })
                ])
            ),

            // Liquid Blobs: Slower, viscous feel
            ...liquids.map(l =>
                Animated.parallel([
                    Animated.timing(l.dist, {
                        toValue: 50 * l.speed,
                        duration: 700,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true
                    }),
                    Animated.sequence([
                        Animated.delay(200),
                        Animated.timing(l.opacity, { toValue: 0, duration: 500, useNativeDriver: true })
                    ]),
                    Animated.timing(l.scale, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true
                    })
                ])
            )

        ]).start(({ finished }) => {
            if (finished) {
                onComplete();
            }
        });
    }, []);

    return (
        <View style={[styles.container, { left: x, top: y }]} pointerEvents="none">

            {/* 2. Expanding Ring */}
            <Animated.View style={[
                styles.ring,
                {
                    borderColor: color,
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }]
                }
            ]} />

            {/* 3. Particles (Shards) */}
            {particles.map((p, i) => (
                <Animated.View
                    key={`p-${i}`}
                    style={[
                        styles.particle,
                        {
                            backgroundColor: color,
                            width: p.size,
                            height: p.size,
                            opacity: p.opacity,
                            transform: [
                                { translateX: Animated.multiply(p.dist, Math.cos(p.angle)) },
                                { translateY: Animated.multiply(p.dist, Math.sin(p.angle)) },
                                { rotate: `${p.angle}rad` } // Face direction of travel roughly
                            ]
                        }
                    ]}
                />
            ))}

            {/* 4. Liquid Fragments */}
            {liquids.map((l, i) => (
                <Animated.View
                    key={`l-${i}`}
                    style={[
                        styles.liquid,
                        {
                            backgroundColor: color,
                            opacity: l.opacity,
                            transform: [
                                { translateX: Animated.multiply(l.dist, Math.cos(l.angle)) },
                                { translateY: Animated.multiply(l.dist, Math.sin(l.angle)) },
                                { scale: l.scale }
                            ]
                        }
                    ]}
                />
            ))}

            {/* 1. Central Flash (On top of particles to obscure start) */}
            <Animated.View style={[
                styles.flash,
                {
                    opacity: flashOpacity,
                    transform: [{ scale: flashScale }]
                }
            ]} />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 0,
        height: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999, // High z-index to be above grid
    },
    flash: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#fff',
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 10,
    },
    ring: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        shadowColor: '#fff',
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    particle: {
        position: 'absolute',
        borderRadius: 2, // Slightly rounded squares
    },
    liquid: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7, // Circles
    }
});

export default BubbleBlast;
