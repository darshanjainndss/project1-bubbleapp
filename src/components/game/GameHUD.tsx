import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import MaterialIcon from "../MaterialIcon";
import HelpButton from "../HelpButton";
import { GAME_ICONS, ICON_COLORS } from "../../config/icons";
import { styles } from "../../styles/GameScreenStyles";

const COLOR_MAP: Record<string, any> = {
    "#ff3b30": require("../../images/red.webp"),
    "#ff9500": require("../../images/orange.webp"),
    "#ffd60a": require("../../images/yellow.webp"),
    "#34c759": require("../../images/green.webp"),
    "#007aff": require("../../images/blue.webp"),
    "#af52de": require("../../images/purple.webp"),
};

interface GameHUDProps {
    score: number;
    moves: number;
    level: number;
    nextColor: string;
    onBackPress?: () => void;
    onShowInstructions?: () => void;
    abilities: {
        lightning: boolean;
        bomb: boolean;
        freeze: boolean;
        fire: boolean;
    };
    abilityCounts: {
        lightning: number;
        bomb: number;
        freeze: number;
        fire: number;
    };
    onActivateLightning: () => void;
    onActivateBomb: () => void;
    onActivateFreeze: () => void;
    onActivateFire: () => void;
}

export const GameHUD = ({
    score,
    moves,
    level,
    nextColor,
    onBackPress,
    onShowInstructions,
    abilities,
    abilityCounts,
    onActivateLightning,
    onActivateBomb,
    onActivateFreeze,
    onActivateFire
}: GameHUDProps) => {
    return (
        <>
            {/* Top HUD Card */}
            <View style={styles.hudTopContainer}>
                <View style={styles.topCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>LEVEL</Text>
                        <Text style={styles.statValue}>{level}</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>SCORE</Text>
                        <Text style={styles.statValue}>{score.toLocaleString()}</Text>
                        <View style={styles.starProgressContainer}>
                            <View style={[styles.starProgressDot, score >= 100 && styles.starProgressDotActive]} />
                            <View style={[styles.starProgressDot, score >= 400 && styles.starProgressDotActive]} />
                            <View style={[styles.starProgressDot, score >= 800 && styles.starProgressDotActive]} />
                        </View>
                    </View>
                    <HelpButton onPress={onShowInstructions || (() => { })} />
                    <TouchableOpacity
                        style={styles.topExitBtn}
                        onPress={onBackPress}
                    >
                        <MaterialIcon
                            name="close"
                            family="material"
                            size={20}
                            color="#ff4444"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom HUD Card */}
            <View style={styles.hudBottomContainer}>
                <View style={styles.uCard}>
                    {/* Left Wing Abilities */}
                    <View style={styles.uWingLeft}>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.lightning && styles.abilityBtnActive]}
                            onPress={onActivateLightning}
                            disabled={abilityCounts.lightning <= 0 && !abilities.lightning}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.LIGHTNING.name}
                                family={GAME_ICONS.LIGHTNING.family}
                                size={22}
                                color={abilities.lightning ? ICON_COLORS.SECONDARY : (abilityCounts.lightning > 0 ? ICON_COLORS.INFO : ICON_COLORS.DISABLED)}
                            />
                            {abilityCounts.lightning > 0 && (
                                <View style={styles.abilityBadge}>
                                    <Text style={styles.abilityBadgeText}>{abilityCounts.lightning}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.freeze && styles.abilityBtnActive]}
                            onPress={onActivateFreeze}
                            disabled={abilityCounts.freeze <= 0 && !abilities.freeze}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.FREEZE.name}
                                family={GAME_ICONS.FREEZE.family}
                                size={22}
                                color={abilities.freeze ? ICON_COLORS.SECONDARY : (abilityCounts.freeze > 0 ? ICON_COLORS.PRIMARY : ICON_COLORS.DISABLED)}
                            />
                            {abilityCounts.freeze > 0 && (
                                <View style={styles.abilityBadge}>
                                    <Text style={styles.abilityBadgeText}>{abilityCounts.freeze}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Raised Center Ammo Module */}
                    <View style={styles.raisedCenterContainer}>
                        <View style={styles.raisedAmmoRing}>
                            <View style={styles.ammoBubble}>
                                {COLOR_MAP[nextColor.toLowerCase()] ? (
                                    <Image
                                        source={COLOR_MAP[nextColor.toLowerCase()]}
                                        style={styles.ammoBubbleImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={[styles.ammoBubbleFallback, { backgroundColor: nextColor }]} />
                                )}
                            </View>
                        </View>
                        <View style={styles.ammoTextContainer}>
                            <Text style={styles.ammoValue}>{moves}</Text>
                        </View>
                    </View>

                    {/* Right Wing Abilities */}
                    <View style={styles.uWingRight}>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.fire && styles.abilityBtnActive]}
                            onPress={onActivateFire}
                            disabled={abilityCounts.fire <= 0 && !abilities.fire}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.FIRE.name}
                                family={GAME_ICONS.FIRE.family}
                                size={22}
                                color={abilities.fire ? ICON_COLORS.SECONDARY : (abilityCounts.fire > 0 ? ICON_COLORS.ERROR : ICON_COLORS.DISABLED)}
                            />
                            {abilityCounts.fire > 0 && (
                                <View style={styles.abilityBadge}>
                                    <Text style={styles.abilityBadgeText}>{abilityCounts.fire}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.bomb && styles.abilityBtnActive]}
                            onPress={onActivateBomb}
                            disabled={abilityCounts.bomb <= 0 && !abilities.bomb}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.BOMB.name}
                                family={GAME_ICONS.BOMB.family}
                                size={22}
                                color={abilities.bomb ? ICON_COLORS.SECONDARY : (abilityCounts.bomb > 0 ? ICON_COLORS.WARNING : ICON_COLORS.DISABLED)}
                            />
                            {abilityCounts.bomb > 0 && (
                                <View style={styles.abilityBadge}>
                                    <Text style={styles.abilityBadgeText}>{abilityCounts.bomb}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );
};
