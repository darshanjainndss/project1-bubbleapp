import React, { useRef, useEffect } from "react";
import { View, Image, Animated } from "react-native";
import MaterialIcon from "../MaterialIcon";
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from "../../config/icons";
import {
    styles,
    BUBBLE_SIZE,
    ROW_HEIGHT,
    GRID_TOP
} from "../../styles/GameScreenStyles";

const COLOR_MAP: Record<string, any> = {
    "#ff3b30": require("../../images/red.webp"),
    "#ff9500": require("../../images/orange.webp"),
    "#ffd60a": require("../../images/yellow.webp"),
    "#34c759": require("../../images/green.webp"),
    "#007aff": require("../../images/blue.webp"),
    "#af52de": require("../../images/purple.webp"),
};

// 1. MEMOIZED BUBBLE COMPONENT
export const Bubble = React.memo(({ x, y, color, anim, entryOffset, isGhost, hasMetalGrid, isFrozen, hasLightning, hasBomb, hasFreeze, hasFire, metalPulseAnim, metalRotateAnim }: any) => {
    const imageSource = COLOR_MAP[color.toLowerCase()];

    const rotateInterpolate = metalRotateAnim ? metalRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    }) : '0deg';

    return (
        <Animated.View
            style={[
                styles.bubble,
                {
                    backgroundColor: imageSource && !isGhost ? "transparent" : color,
                    opacity: anim || 1,
                    borderWidth: imageSource && !isGhost ? 0 : 1.5,
                    borderRadius: imageSource && !isGhost ? 0 : BUBBLE_SIZE / 2,
                    shadowOpacity: imageSource && !isGhost ? 0 : 0.4,
                    elevation: imageSource && !isGhost ? 0 : 5,
                    overflow: imageSource && !isGhost ? 'visible' : 'hidden',
                    transform: [
                        { translateX: x - BUBBLE_SIZE / 2 },
                        { translateY: y - BUBBLE_SIZE / 2 },
                        { translateY: entryOffset || 0 },
                        { scale: anim || 1 }
                    ],
                    ...(isGhost ? styles.ghostBubble : {})
                }
            ]}
        >
            {imageSource && !isGhost ? (
                <Image
                    source={imageSource}
                    style={{ width: "120%", height: "120%", resizeMode: "contain" }}
                />
            ) : (
                <>
                    {/* Planetary Elements (Only for ghosts or fallback) */}
                    {!isGhost && (
                        <>
                            <View style={styles.planetBands} />
                            <View style={styles.planetCrater1} />
                            <View style={styles.planetCrater2} />
                            <View style={styles.planetCrater3} />
                            <View style={styles.planetRing} />
                        </>
                    )}
                    <View style={styles.bubbleInner} />
                    <View style={styles.bubbleHighlight} />
                    <View style={styles.bubbleGloss} />
                </>
            )}

            {/* Metal Grid Overlay - Circular Design */}
            {hasMetalGrid && !isGhost && !isFrozen && (
                <Animated.View style={[styles.metalGridOverlay, { transform: [{ scale: metalPulseAnim || 1 }] }]}>
                    <View style={styles.metalOuterRing} />
                    <View style={styles.metalInnerRing} />
                    <Animated.View style={[styles.metalCrossContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
                        <View style={styles.metalCrossHorizontal} />
                        <View style={styles.metalCrossVertical} />
                        <View style={styles.metalDiagonal1} />
                        <View style={styles.metalDiagonal2} />
                    </Animated.View>
                    <View style={[styles.metalBolt, { top: '15%', left: '15%' }]} />
                    <View style={[styles.metalBolt, { top: '15%', right: '15%' }]} />
                    <View style={[styles.metalBolt, { bottom: '15%', left: '15%' }]} />
                    <View style={[styles.metalBolt, { bottom: '15%', right: '15%' }]} />
                    <View style={styles.metallicShine} />
                </Animated.View>
            )}

            {/* Power-up Icons */}
            {!isGhost && !hasMetalGrid && !isFrozen && (
                <View style={styles.bubbleIconContainer}>
                    {hasLightning && (
                        <MaterialIcon name={GAME_ICONS.LIGHTNING.name} family={GAME_ICONS.LIGHTNING.family} size={ICON_SIZES.SMALL} color="#FFF" />
                    )}
                    {hasBomb && (
                        <MaterialIcon name={GAME_ICONS.BOMB.name} family={GAME_ICONS.BOMB.family} size={ICON_SIZES.SMALL} color="#FFF" />
                    )}
                    {hasFreeze && (
                        <MaterialIcon name={GAME_ICONS.FREEZE.name} family={GAME_ICONS.FREEZE.family} size={ICON_SIZES.SMALL} color="#FFF" />
                    )}
                    {hasFire && (
                        <MaterialIcon name={GAME_ICONS.FIRE.name} family={GAME_ICONS.FIRE.family} size={ICON_SIZES.SMALL} color="#FFF" />
                    )}
                </View>
            )}

            {/* Ice Overlay */}
            {isFrozen && !isGhost && (
                <View style={styles.iceOverlay}>
                    <View style={styles.iceGlaze} />
                    <View style={styles.iceCrystal1} />
                    <View style={styles.iceCrystal2} />
                    <View style={styles.iceShine} />
                </View>
            )}
        </Animated.View>
    );
});

// 2. MEMOIZED GRID COMPONENT
export const BubbleGrid = React.memo(({ bubbles, metalPulseAnim, metalRotateAnim }: { bubbles: any[], metalPulseAnim?: any, metalRotateAnim?: any }) => {
    return (
        <>
            {bubbles.map(b => b.visible && (
                <Bubble
                    key={b.id}
                    x={b.x}
                    y={b.y}
                    color={b.color}
                    anim={b.anim}
                    entryOffset={b.entryOffset}
                    hasMetalGrid={b.hasMetalGrid}
                    isFrozen={b.isFrozen}
                    hasLightning={b.hasLightning}
                    hasBomb={b.hasBomb}
                    hasFreeze={b.hasFreeze}
                    hasFire={b.hasFire}
                    metalPulseAnim={metalPulseAnim}
                    metalRotateAnim={metalRotateAnim}
                />
            ))}
        </>
    );
});

// 3. OPTIMIZED BORDER COMPONENT
export const PulsatingBorder = React.memo(({ pulse }: { pulse: any }) => {
    const gridHeight = 18.5 * ROW_HEIGHT + BUBBLE_SIZE;
    const padding = 10;

    return (
        <View style={[styles.borderContainer, { top: GRID_TOP - padding, height: gridHeight + padding * 2 }]} pointerEvents="none">
            <Animated.View style={[styles.borderBox, {
                opacity: pulse.interpolate({ inputRange: [0.4, 1], outputRange: [0.4, 0.8] }),
                borderColor: pulse.interpolate({
                    inputRange: [0.4, 1],
                    outputRange: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.6)']
                })
            }]} />
        </View>
    );
});

// 4. MEMOIZED AIM LINE COMPONENT
export const AimLine = React.memo(({ segments, color }: { segments: any[], color: string }) => {
    return (
        <>
            {segments.map((seg, i) => {
                const dx = seg.x2 - seg.x1;
                const dy = seg.y2 - seg.y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                return (
                    <View
                        key={`seg-${i}`}
                        style={{
                            position: 'absolute',
                            left: (seg.x1 + seg.x2) / 2 - length / 2,
                            top: (seg.y1 + seg.y2) / 2 - 2,
                            width: length,
                            height: 4,
                            backgroundColor: color,
                            opacity: Math.max(0.4, seg.opacity),
                            transform: [{ rotate: `${angle}rad` }],
                            borderRadius: 2,
                            shadowColor: color,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 1,
                            shadowRadius: 6,
                            elevation: 10,
                            zIndex: 99,
                        }}
                    >
                        <View style={{
                            width: '100%',
                            height: 1.5,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            marginTop: 1.25,
                            borderRadius: 1
                        }} />
                    </View>
                );
            })}
        </>
    );
});
