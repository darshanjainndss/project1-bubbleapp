import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import MaterialIcon from './MaterialIcon';
import ToastNotification, { ToastRef } from './ToastNotification';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../config/icons';
import BackendService, { LevelReward } from '../services/BackendService';

const { width, height } = Dimensions.get('window');

interface RewardHistoryProps {
    visible: boolean;
    onClose: () => void;
}

const RewardHistory: React.FC<RewardHistoryProps> = ({ visible, onClose }) => {
    const [rewards, setRewards] = useState<LevelReward[]>([]);
    const [totalCoins, setTotalCoins] = useState(0);
    const [loading, setLoading] = useState(true);
    const toastRef = useRef<ToastRef>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            loadRewardHistory();
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const loadRewardHistory = async () => {
        try {
            setLoading(true);
            const result = await BackendService.getRewardHistory(50);

            if (result.success && result.rewards) {
                setRewards(result.rewards);
                setTotalCoins(result.totalCoins || 0);
            } else {
                toastRef.current?.show(result.error || 'Failed to load rewards', 'error');
            }
        } catch (error) {
            console.error('Failed to load reward history:', error);
            toastRef.current?.show('Failed to load reward history', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStarColor = (stars: number) => {
        if (stars === 3) return '#FFD700';
        if (stars === 2) return '#C0C0C0';
        return '#CD7F32';
    };

    const renderRewardItem = (reward: LevelReward, index: number) => {
        const starColor = getStarColor(reward.stars);
        const date = new Date(reward.claimedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return (
            <View key={reward._id} style={styles.rewardCard}>
                <View style={styles.rewardHeader}>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Level {reward.level}</Text>
                    </View>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                </View>

                <View style={styles.rewardBody}>
                    {/* Stars Display */}
                    <View style={styles.starsContainer}>
                        {[1, 2, 3].map((starNum) => (
                            <MaterialIcon
                                key={starNum}
                                name="star"
                                family="material"
                                size={ICON_SIZES.MEDIUM}
                                color={starNum <= reward.stars ? starColor : 'rgba(255, 255, 255, 0.1)'}
                            />
                        ))}
                    </View>

                    {/* Coins Earned */}
                    <View style={styles.coinsEarned}>
                        <MaterialIcon
                            name={GAME_ICONS.COIN.name}
                            family={GAME_ICONS.COIN.family}
                            size={ICON_SIZES.MEDIUM}
                            color={ICON_COLORS.GOLD}
                        />
                        <Text style={styles.coinsEarnedText}>+{reward.coinsAwarded}</Text>
                    </View>

                    {/* Score */}
                    <View style={styles.scoreContainer}>
                        <MaterialIcon
                            name="analytics"
                            family="material"
                            size={ICON_SIZES.SMALL}
                            color={ICON_COLORS.INFO}
                        />
                        <Text style={styles.scoreText}>{reward.score.toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (!visible) return null;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height, 0],
    });

    const scale = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.container, { transform: [{ translateY }, { scale }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <MaterialIcon
                            name="emoji-events"
                            family="material"
                            size={ICON_SIZES.LARGE}
                            color={ICON_COLORS.GOLD}
                        />
                        <Text style={styles.title}>REWARD HISTORY</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <MaterialIcon
                            name="close"
                            family="material"
                            size={ICON_SIZES.MEDIUM}
                            color={ICON_COLORS.WHITE}
                        />
                    </TouchableOpacity>
                </View>

                {/* Total Coins Summary */}
                <View style={styles.summary}>
                    <Text style={styles.summaryLabel}>Total Coins from Rewards</Text>
                    <View style={styles.summaryCoins}>
                        <MaterialIcon
                            name={GAME_ICONS.COIN.name}
                            family={GAME_ICONS.COIN.family}
                            size={ICON_SIZES.XLARGE}
                            color={ICON_COLORS.GOLD}
                        />
                        <Text style={styles.summaryCoinsText}>{totalCoins.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.summaryCount}>{rewards.length} levels completed</Text>
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={ICON_COLORS.PRIMARY} />
                            <Text style={styles.loadingText}>Loading rewards...</Text>
                        </View>
                    ) : rewards.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcon
                                name="emoji-events"
                                family="material"
                                size={80}
                                color="rgba(255, 255, 255, 0.1)"
                            />
                            <Text style={styles.emptyText}>No rewards yet</Text>
                            <Text style={styles.emptySubtext}>
                                Complete levels with 2 or 3 stars to earn coins!
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.rewardsList}>
                            {rewards.map((reward, index) => renderRewardItem(reward, index))}
                        </View>
                    )}
                </ScrollView>

                {/* Reward Info Footer */}
                <View style={styles.footer}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoStars}>⭐⭐</Text>
                            <Text style={styles.infoText}>10 coins</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoItem}>
                            <Text style={styles.infoStars}>⭐⭐⭐</Text>
                            <Text style={styles.infoText}>15 coins</Text>
                        </View>
                    </View>
                    <Text style={styles.footerNote}>One-time reward per level</Text>
                </View>
            </Animated.View>
            <ToastNotification ref={toastRef} />
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
        padding: 20,
    },
    container: {
        backgroundColor: '#0A0A12',
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFD700',
        width: '100%',
        height: '90%',
        maxHeight: 600,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 25,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
        textShadowColor: 'rgba(255, 215, 0, 0.8)',
        textShadowRadius: 15,
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    summary: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 215, 0, 0.1)',
    },
    summaryLabel: {
        color: '#AAA',
        fontSize: 12,
        marginBottom: 8,
        fontFamily: 'monospace',
    },
    summaryCoins: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryCoinsText: {
        color: '#FFD700',
        fontSize: 32,
        fontWeight: '900',
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowRadius: 10,
        fontFamily: 'monospace',
    },
    summaryCount: {
        color: '#777',
        fontSize: 11,
        marginTop: 4,
        fontFamily: 'monospace',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 15,
        fontSize: 16,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        fontFamily: 'monospace',
    },
    emptySubtext: {
        color: '#777',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    rewardsList: {
        padding: 16,
    },
    rewardCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.15)',
        padding: 16,
        marginBottom: 12,
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    levelBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    levelText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    dateText: {
        color: '#777',
        fontSize: 11,
        fontFamily: 'monospace',
    },
    rewardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    coinsEarned: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    coinsEarnedText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scoreText: {
        color: '#00E0FF',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 215, 0, 0.2)',
        padding: 16,
        backgroundColor: 'rgba(255, 215, 0, 0.03)',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    infoStars: {
        fontSize: 16,
        marginBottom: 4,
    },
    infoText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    separator: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    footerNote: {
        color: '#777',
        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontStyle: 'italic',
    },
});

export default RewardHistory;
