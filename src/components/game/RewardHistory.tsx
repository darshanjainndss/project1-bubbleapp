import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import MaterialIcon from '../common/MaterialIcon';
import BaseModal from '../common/BaseModal';
import ToastNotification, { ToastRef } from '../common/ToastNotification';
import { GAME_ICONS, ICON_COLORS, ICON_SIZES } from '../../config/icons';
import BackendService, { RewardHistoryItem } from '../../services/BackendService';

interface RewardHistoryProps {
    visible: boolean;
    onClose: () => void;
}

const RewardHistory: React.FC<RewardHistoryProps> = ({ visible, onClose }) => {
    const [rewards, setRewards] = useState<RewardHistoryItem[]>([]);
    const [totalCoins, setTotalCoins] = useState(0);
    const [loading, setLoading] = useState(true);
    const toastRef = useRef<ToastRef>(null);

    useEffect(() => {
        if (visible) {
            loadRewardHistory();
        }
    }, [visible]);

    const loadRewardHistory = async () => {
        try {
            setLoading(true);
            const result = await BackendService.getRewardHistoryOnly();

            if (result.success && result.history) {
                setRewards(result.history);
                const coinsTotal = result.history.reduce((sum, r) => sum + r.coins, 0);
                setTotalCoins(coinsTotal);
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

    const renderRewardItem = (reward: RewardHistoryItem) => {
        const date = new Date(reward.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const isWithdrawn = reward.status === 'withdrawn';
        const displayReward = reward.reward || reward.scoreEarning || 0;

        return (
            <View key={reward._id} style={[styles.rewardCard, isWithdrawn && styles.withdrawnCard]}>
                <View style={styles.rewardHeader}>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Level {reward.level}</Text>
                    </View>
                    <View style={[styles.statusBadge, isWithdrawn ? styles.statusWithdrawn : styles.statusClaimed]}>
                        <Text style={styles.statusText}>{reward.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.rewardBody}>
                    <View style={styles.coinsEarned}>
                        <MaterialIcon
                            name={GAME_ICONS.COIN.name}
                            family={GAME_ICONS.COIN.family}
                            size={16}
                            color={ICON_COLORS.GOLD}
                        />
                        <Text style={styles.coinsEarnedText}>+{reward.coins}</Text>
                    </View>

                    <View style={styles.rewardContainer}>
                        <Text style={styles.rewardText}>{displayReward.toFixed(8)} {reward.token || 'SHIB'}</Text>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <>
            <BaseModal
                visible={visible}
                onClose={onClose}
                title="REWARD HISTORY"
                icon="emoji-events"
                iconColor={ICON_COLORS.GOLD}
                showCloseButton={true}
                primaryAction={{
                    label: "CLOSE",
                    onPress: onClose,
                }}
            >
                <View style={styles.container}>
                    {/* Summary Section */}
                    <View style={styles.summary}>
                        <View style={styles.summaryCoins}>
                            <MaterialIcon
                                name={GAME_ICONS.COIN.name}
                                family={GAME_ICONS.COIN.family}
                                size={24}
                                color={ICON_COLORS.GOLD}
                            />
                            <Text style={styles.summaryCoinsText}>{totalCoins.toLocaleString()}</Text>
                        </View>
                        <Text style={styles.summaryLabel}>Total Coins Harvested</Text>
                    </View>

                    {/* Content Section */}
                    <ScrollView
                        style={styles.scrollList}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#00E0FF" />
                            </View>
                        ) : rewards.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No rewards yet</Text>
                                <Text style={styles.emptySubtext}>Play more levels to earn!</Text>
                            </View>
                        ) : (
                            rewards.map(reward => renderRewardItem(reward))
                        )}
                    </ScrollView>
                </View>
            </BaseModal>
            <ToastNotification ref={toastRef} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 450,
    },
    summary: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderRadius: 16,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.1)',
    },
    summaryCoins: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryCoinsText: {
        color: '#FFD700',
        fontSize: 28,
        fontWeight: '900',
        fontFamily: 'monospace',
    },
    summaryLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    scrollList: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingBottom: 10,
    },
    rewardCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.1)',
    },
    withdrawnCard: {
        opacity: 0.6,
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    levelBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    levelText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusClaimed: {
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
    },
    statusWithdrawn: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statusText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    rewardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coinsEarned: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    coinsEarnedText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    rewardContainer: {
        alignItems: 'flex-end',
    },
    rewardText: {
        color: '#00FF88',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    dateText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 9,
        marginTop: 2,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptySubtext: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        marginTop: 4,
    },
});

export default RewardHistory;
