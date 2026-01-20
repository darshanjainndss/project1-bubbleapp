import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import MaterialIcon from '../common/MaterialIcon';
import BaseModal from '../common/BaseModal';
import RewardsCard from './RewardsCard';
import { GAME_ICONS, ICON_COLORS } from '../../config/icons';
import SettingsService from '../../services/SettingsService';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfilePopupProps {
    visible: boolean;
    onClose: () => void;
    user: any;
    userGameData: any;
    coins: number;
    currentLevel: number;
    onLogout: () => void;
    onWithdrawPress: () => void;
    onRewardHistoryPress: () => void;
    onWithdrawHistoryPress: () => void;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({
    visible,
    onClose,
    user,
    userGameData,
    coins,
    currentLevel,
    onLogout,
    onWithdrawPress,
    onRewardHistoryPress,
    onWithdrawHistoryPress,
}) => {
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [vibrationSupported, setVibrationSupported] = useState(true);

    useEffect(() => {
        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const loadSettings = async () => {
        try {
            await SettingsService.ensureLoaded();
            setVibrationEnabled(SettingsService.getSetting('vibrationEnabled'));
            setVibrationSupported(SettingsService.isVibrationSupported());
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const toggleVibration = async () => {
        if (!vibrationSupported) return;
        try {
            const newValue = !vibrationEnabled;
            setVibrationEnabled(newValue);
            await SettingsService.setVibrationEnabled(newValue);
            if (newValue) {
                SettingsService.vibrateClick();
            }
        } catch (error) {
            console.error('Error toggling vibration:', error);
        }
    };

    if (!user) return null;

    const rawName = user.displayName || user.email?.split('@')[0] || 'Explorer';
    const cleanName = rawName.replace(/@.*/, '');

    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            showCloseButton={true}
            scrollable={true}
            contentStyle={{ 
                padding: 0, 
                overflow: 'hidden', 
                backgroundColor: '#0A0F1A',
                maxWidth: 720,
                width: '95%'
            }}
        >
            <View style={styles.contentWrapper}>
                {/* Custom Header inside ScrollView */}
                <View style={styles.modalHeader}>
                    {/* <MaterialIcon
                        name="account-circle"
                        family="material"
                        size={48}
                        color={ICON_COLORS.PRIMARY}
                    /> */}
                    <Text style={styles.modalTitle}>COMMANDER PROFILE</Text>
                </View>

                {/* Profile Header Card */}
                <LinearGradient
                    colors={['rgba(0, 224, 255, 0.15)', 'rgba(0, 224, 255, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerCard}
                >
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={['#00E0FF', '#00FF88']}
                                style={styles.avatarBorder}
                            >
                                <View style={styles.avatarInner}>
                                    <MaterialIcon name="person" family="material" size={50} color="#00E0FF" />
                                </View>
                            </LinearGradient>
                            <View style={styles.onlineStatus} />
                        </View>
                        <View style={styles.nameSection}>
                            <Text style={styles.userName}>{cleanName}</Text>

                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>COMMANDER STATS</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="trending-up"
                            value={currentLevel}
                            label="LEVEL"
                            color="#00E0FF"
                        />
                        <StatCard
                            icon="monetization-on"
                            value={coins.toLocaleString()}
                            label="COINS"
                            color="#FFD700"
                        />
                        <StatCard
                            icon="stars"
                            value={(userGameData?.totalScore || 0).toLocaleString()}
                            label="EXP"
                            color="#FF3B30"
                        />
                        <StatCard
                            icon="visibility"
                            value={(userGameData?.totalAdEarnings || 0).toLocaleString()}
                            label="AD REWARDS"
                            color="#5856D6"
                        />
                    </View>
                </View>

                {/* Rewards Card Integration */}
                <RewardsCard
                    onWithdrawPress={onWithdrawPress}
                    onRewardHistoryPress={onRewardHistoryPress}
                    onWithdrawHistoryPress={onWithdrawHistoryPress}
                    style={styles.rewardsCardPadding}
                />

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>SYSTEM SETTINGS</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, !vibrationSupported && styles.settingDisabled]}
                        onPress={toggleVibration}
                        disabled={!vibrationSupported}
                    >
                        <View style={styles.settingInfo}>
                            <View style={[styles.settingIconBox, { backgroundColor: vibrationEnabled ? 'rgba(0, 224, 255, 0.1)' : 'rgba(100, 116, 139, 0.1)' }]}>
                                <MaterialIcon
                                    name={GAME_ICONS.VIBRATION.name}
                                    family={GAME_ICONS.VIBRATION.family}
                                    size={18}
                                    color={vibrationEnabled ? "#00E0FF" : "#64748B"}
                                />
                            </View>
                            <Text style={styles.settingText}>Haptic Feedback</Text>
                        </View>
                        <View style={[styles.toggle, vibrationEnabled && styles.toggleActive]}>
                            <View style={[styles.toggleCircle, vibrationEnabled && styles.circleActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                    <LinearGradient
                        colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.logoutGradient}
                    >
                        <MaterialIcon name="power-settings-new" family="material" size={18} color="#FF4444" />
                        <Text style={styles.logoutText}>DISCONNECT SESSION</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </BaseModal>
    );
};

const StatCard = ({ icon, value, label, color }: any) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
            <MaterialIcon name={icon} family="material" size={18} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    contentWrapper: {
        paddingTop: 10,
        paddingBottom: 30,
        paddingHorizontal: 16,
    },
    modalHeader: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 20,
        gap: 12,
    },
    modalTitle: {
        paddingTop: 40,
        color: '#00E0FF',
        fontSize: SCREEN_WIDTH > 380 ? 24 : 20,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
    },
    headerCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.2)',
        overflow: 'hidden',
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarBorder: {
        padding: 2,
        borderRadius: 40,
        width: 76,
        height: 76,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#0A0A14',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#00FF88',
        borderWidth: 2,
        borderColor: '#0A0A14',
        shadowColor: '#00FF88',
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
    },
    nameSection: {
        flex: 1,
    },
    userName: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.2)',
    },
    rankText: {
        color: '#00FF88',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 6,
        letterSpacing: 1,
    },
    statsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 15,
        textTransform: 'uppercase',
        marginLeft: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        columnGap: 8,
    },
    statCard: {
        width: '23%',
        minWidth: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    statValue: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        fontFamily: 'monospace',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        fontWeight: '800',
        marginTop: 4,
        letterSpacing: 1,
    },
    rewardsCardPadding: {
        marginBottom: 20,
    },
    settingsSection: {
        marginBottom: 25,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    settingDisabled: {
        opacity: 0.5,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingText: {
        color: '#E2E8F0',
        fontSize: 15,
        fontWeight: '700',
    },
    toggle: {
        width: 48,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 4,
    },
    toggleActive: {
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        borderColor: 'rgba(0, 255, 136, 0.4)',
        borderWidth: 1,
    },
    toggleCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#64748B',
    },
    circleActive: {
        backgroundColor: '#00FF88',
        transform: [{ translateX: 22 }],
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    logoutBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        marginBottom: 10,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    logoutText: {
        color: '#FF4444',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
});

export default ProfilePopup;
