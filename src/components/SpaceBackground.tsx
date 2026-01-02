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

const SpaceBackground = React.memo(() => {
    return (
        <View style={styles.spaceContainer}>
            <StarLayer count={30} duration={12000} size={1.5} opacity={0.4} />
            <StarLayer count={20} duration={8000} size={2.5} opacity={0.6} />
            <StarLayer count={10} duration={5000} size={4} opacity={0.8} />
        </View>
    );
});

const styles = StyleSheet.create({
    spaceContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#050510', overflow: 'hidden' },
    star: { position: 'absolute', backgroundColor: '#fff' },
});

export default SpaceBackground;
