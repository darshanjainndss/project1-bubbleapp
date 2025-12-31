import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcon from "../MaterialIcon";
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from "../../config/icons";
import { styles } from "../../styles/GameScreenStyles";

interface GameHUDProps {
    score: number;
    moves: number;
    level: number;
    nextColor: string;
    onBackPress?: () => void;
    abilities: {
        lightning: boolean;
        bomb: boolean;
        freeze: boolean;
        fire: boolean;
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
    abilities,
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
                    </View>
                    <View style={styles.verticalDivider} />
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
                        >
                            <MaterialIcon
                                name={GAME_ICONS.LIGHTNING.name}
                                family={GAME_ICONS.LIGHTNING.family}
                                size={ICON_SIZES.MEDIUM}
                                color={abilities.lightning ? ICON_COLORS.SECONDARY : ICON_COLORS.INFO}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.freeze && styles.abilityBtnActive]}
                            onPress={onActivateFreeze}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.FREEZE.name}
                                family={GAME_ICONS.FREEZE.family}
                                size={ICON_SIZES.MEDIUM}
                                color={abilities.freeze ? ICON_COLORS.SECONDARY : ICON_COLORS.PRIMARY}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Center Ammo Module */}
                    <View style={styles.uCenterAmmo}>
                        <View style={styles.ammoRing}>
                            <View style={[styles.ammoBubble, { backgroundColor: nextColor }]} />
                        </View>
                        <Text style={[styles.statValue, { textAlign: 'center', marginTop: 8, fontSize: 18, color: moves < 5 ? '#ff4444' : '#fff' }]}>
                            {moves}
                        </Text>
                        <Text style={[styles.statLabel, { textAlign: 'center', fontSize: 9 }]}>AMMO</Text>
                    </View>

                    {/* Right Wing Abilities */}
                    <View style={styles.uWingRight}>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.fire && styles.abilityBtnActive]}
                            onPress={onActivateFire}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.FIRE.name}
                                family={GAME_ICONS.FIRE.family}
                                size={ICON_SIZES.MEDIUM}
                                color={abilities.fire ? ICON_COLORS.SECONDARY : ICON_COLORS.ERROR}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.abilityBtn, abilities.bomb && styles.abilityBtnActive]}
                            onPress={onActivateBomb}
                        >
                            <MaterialIcon
                                name={GAME_ICONS.BOMB.name}
                                family={GAME_ICONS.BOMB.family}
                                size={ICON_SIZES.MEDIUM}
                                color={abilities.bomb ? ICON_COLORS.SECONDARY : ICON_COLORS.WARNING}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );
};
