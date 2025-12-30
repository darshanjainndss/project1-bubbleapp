import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const StarLayer = ({ count, duration, size, opacity }: any) => {
    const move = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(move, {
                toValue: SCREEN_HEIGHT,
                duration: duration,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const stars = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: move }] }]}>
                {stars.map(s => (
                    <View key={s.id} style={[styles.star, { left: s.x, top: s.y - SCREEN_HEIGHT, width: size, height: size, borderRadius: size / 2, opacity: opacity }]} />
                ))}
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: move }] }]}>
                {stars.map(s => (
                    <View key={`b-${s.id}`} style={[styles.star, { left: s.x, top: s.y, width: size, height: size, borderRadius: size / 2, opacity: opacity }]} />
                ))}
            </Animated.View>
        </View>
    );
};

const Galaxy = () => {
    const move = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Movement: Parallax drift
        Animated.loop(
            Animated.timing(move, {
                toValue: SCREEN_HEIGHT + 400,
                duration: 55000,
                useNativeDriver: true,
            })
        ).start();

        // Rotation: Constant slow spin
        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 25000,
                useNativeDriver: true,
            })
        ).start();

        // Core Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Animated.View
            style={[
                styles.galaxyContainer,
                {
                    transform: [
                        { translateY: move },
                        { rotate: spin }
                    ]
                }
            ]}
        >
            {/* Deep Space Haze (Background) */}
            <View style={styles.deepHaze} />

            {/* Dynamic Spiral Arms (Using Arcs) */}
            {/* Arm 1: Cyan/Blue - Large Sweep */}
            <View style={[styles.spiralArm, styles.arm1]} />
            {/* Arm 2: Purple/Magenta - Large Sweep Offset */}
            <View style={[styles.spiralArm, styles.arm2]} />
            {/* Arm 3: Pink/White - Tight Inner Sweep */}
            <View style={[styles.spiralArm, styles.arm3]} />

            {/* Secondary Detail Rings */}
            <View style={[styles.ringOrbit, { width: 80, height: 80, borderColor: 'rgba(64,196,255,0.1)' }]} />

            {/* Glowing Core */}
            <View style={styles.coreGlow} />
            <Animated.View style={[styles.solidCore, { transform: [{ scale: pulse }] }]} />

            {/* Star Cluster in Galaxy */}
            <GalaxyStars />
        </Animated.View>
    );
};

// Component for random stars inside the galaxy
const GalaxyStars = React.memo(() => (
    <>
        <View style={[styles.gStar, { top: 30, left: 40, backgroundColor: '#A0E7E5' }]} />
        <View style={[styles.gStar, { top: 80, left: 90, backgroundColor: '#FBE7C6' }]} />
        <View style={[styles.gStar, { top: 100, left: 30, backgroundColor: '#B4F8C8' }]} />
        <View style={[styles.gStar, { top: 50, left: 100, backgroundColor: '#FFAEBC' }]} />
        <View style={[styles.gStar, { top: 70, left: 70, width: 3, height: 3, opacity: 0.9 }]} />
    </>
));

const SpaceBackground = React.memo(() => {
    return (
        <View style={styles.spaceContainer}>
            {/* Render Galaxy BEHIND stars for depth */}
            <Galaxy />

            <StarLayer count={30} duration={12000} size={1.5} opacity={0.4} />
            <StarLayer count={20} duration={8000} size={2.5} opacity={0.6} />
            <StarLayer count={10} duration={5000} size={4} opacity={0.8} />
        </View>
    );
});

const styles = StyleSheet.create({
    spaceContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#050510', overflow: 'hidden' },
    star: { position: 'absolute', backgroundColor: '#fff' },

    // GALAXY COMPONENT STYLES
    galaxyContainer: {
        position: 'absolute',
        top: -200,
        right: SCREEN_WIDTH * 0.1,
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.85,
        zIndex: 0,
    },
    deepHaze: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(50, 20, 100, 0.2)', // Deep purple haze
        shadowColor: '#7c4dff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    // The trick to making curved arms: Use huge borders with transparent sides
    spiralArm: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 6,
        borderColor: 'transparent',
    },
    arm1: {
        width: 120,
        height: 120,
        borderTopColor: 'rgba(0, 224, 255, 0.5)', // Cyan
        borderRightColor: 'rgba(0, 224, 255, 0.2)', // Fade out
        transform: [{ rotate: '0deg' }],
    },
    arm2: {
        width: 120,
        height: 120,
        borderBottomColor: 'rgba(213, 0, 249, 0.5)', // Magenta top
        borderLeftColor: 'rgba(213, 0, 249, 0.2)', // Fade
        transform: [{ rotate: '45deg' }],
    },
    arm3: {
        width: 70,
        height: 70,
        borderTopColor: 'rgba(255, 255, 255, 0.4)', // White inner
        transform: [{ rotate: '200deg' }],
    },
    ringOrbit: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 1,
        transform: [{ rotate: '-30deg' }, { scaleY: 0.5 }], // Tilted orbit ring
    },
    // CORE
    coreGlow: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 200, 100, 0.2)',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
    },
    solidCore: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 10,
    },
    gStar: {
        position: 'absolute',
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#fff',
    }
});

export default SpaceBackground;
