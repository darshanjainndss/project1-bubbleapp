import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import SettingsService from '../services/SettingsService';

interface BubbleBlastProps {
    x: number;
    y: number;
    color: string;
    delay?: number;
    onComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUBBLE_SIZE = Math.floor(SCREEN_WIDTH / 10);
const SPARKLE_COUNT = 5;

/* Replicate Color Map */
const COLOR_MAP: Record<string, any> = {
    "#ff3b30": require("../images/red.webp"),
    "#ff9500": require("../images/orange.webp"),
    "#ffd60a": require("../images/yellow.webp"),
    "#34c759": require("../images/green.webp"),
    "#007aff": require("../images/blue.webp"),
    "#af52de": require("../images/purple.webp"),
};

const BubbleBlast = React.memo(({ x, y, color, delay = 0, onComplete }: BubbleBlastProps) => {
    const [showBlast, setShowBlast] = useState(false);

    // Animation Values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const ringScale = useRef(new Animated.Value(0)).current;
    const ringOpacity = useRef(new Animated.Value(0.8)).current;

    const sparkles = useRef([...Array(SPARKLE_COUNT)].map(() => ({
        dist: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        angle: Math.random() * Math.PI * 2,
    }))).current;

    const colorKey = color ? color.toLowerCase() : "";
    const bubbleImage = COLOR_MAP[colorKey];

    useEffect(() => {
        let timer: any;
        const trigger = () => {
            setShowBlast(true);
            runPopAnimation();
        };

        if (delay > 0) {
            timer = setTimeout(trigger, delay);
        } else {
            trigger();
        }
        return () => clearTimeout(timer);
    }, [delay]);

    const runPopAnimation = () => {
        // Light vibration feedback for individual bubble blast
        SettingsService.vibrateClick();
        
        Animated.parallel([
            // 1. Bubble "Pop" (Scale Up -> Shrink & Fade)
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 100,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 0.1,
                        duration: 150,
                        useNativeDriver: true
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true
                    })
                ])
            ]),

            // 2. Shockwave Ring (Expand & Fade)
            Animated.parallel([
                Animated.timing(ringScale, {
                    toValue: 2.0,
                    duration: 250,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.timing(ringOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true
                })
            ]),

            // 3. Sparkles (Fly Out & Vanish)
            ...sparkles.map(s =>
                Animated.parallel([
                    Animated.timing(s.dist, {
                        toValue: BUBBLE_SIZE * 1.5,
                        duration: 350,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true
                    }),
                    Animated.timing(s.scale, {
                        toValue: 0,
                        duration: 350,
                        useNativeDriver: true
                    })
                ])
            )
        ]).start(({ finished }) => {
            if (finished) onComplete();
        });
    };

    if (!showBlast) {
        return (
            <View style={[styles.container, { left: x, top: y }]} pointerEvents="none">
                <View style={styles.fakeBubbleContainer}>
                    {bubbleImage ? (
                        <Image source={bubbleImage} style={styles.fakeBubbleImage} />
                    ) : (
                        <View style={[styles.fakeBubbleFallback, { backgroundColor: color }]} />
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { left: x, top: y }]} pointerEvents="none">
            {/* Red Lightning Lottie Background */}
            <LottieView
                source={require("../images/Spark.json")}
                autoPlay
                loop={false}
                style={styles.lottie}
            />

            {/* Main Bubble Pop Effect */}
            <Animated.View style={[styles.fakeBubbleContainer, {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }]
            }]}>
                {bubbleImage ? (
                    <Image source={bubbleImage} style={styles.fakeBubbleImage} />
                ) : (
                    <View style={[styles.fakeBubbleFallback, { backgroundColor: color }]} />
                )}
            </Animated.View>

            {/* Shockwave Ring */}
            <Animated.View style={[styles.ring, {
                borderColor: color || '#fff',
                opacity: ringOpacity,
                transform: [{ scale: ringScale }]
            }]} />

            {/* Sparkles */}
            {sparkles.map((s, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.sparkle,
                        {
                            backgroundColor: color || '#fff',
                            transform: [
                                { translateX: Animated.multiply(s.dist, Math.cos(s.angle)) },
                                { translateY: Animated.multiply(s.dist, Math.sin(s.angle)) },
                                { scale: s.scale }
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
        position: 'absolute',
        width: 0,
        height: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    lottie: {
        width: BUBBLE_SIZE * 2.5,
        height: BUBBLE_SIZE * 2.5,
        position: 'absolute',
    },
    fakeBubbleContainer: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fakeBubbleImage: {
        width: "120%",
        height: "120%",
        resizeMode: "contain"
    },
    fakeBubbleFallback: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        backgroundColor: 'red'
    },
    ring: {
        position: 'absolute',
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        borderWidth: 3,
        borderColor: '#fff',
    },
    sparkle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    }
});

export default BubbleBlast;
