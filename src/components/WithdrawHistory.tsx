
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
import BackendService, { WithdrawHistoryItem } from '../services/BackendService';

const { width, height } = Dimensions.get('window');

interface WithdrawHistoryProps {
    visible: boolean;
    onClose: () => void;
}

const WithdrawHistory: React.FC<WithdrawHistoryProps> = ({ visible, onClose }) => {
    const [history, setHistory] = useState<WithdrawHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const toastRef = useRef<ToastRef>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            loadHistory();
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

    const loadHistory = async () => {
        try {
            setLoading(true);
            const result = await BackendService.getWithdrawHistoryOnly();

            if (result.success && result.history) {
                setHistory(result.history);
            } else {
                toastRef.current?.show(result.error || 'Failed to load withdraw history', 'error');
            }
        } catch (error) {
            console.error('Failed to load withdraw history:', error);
            toastRef.current?.show('Failed to load withdraw history', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid': return '#00FF88';
            case 'pending': return '#FFA500';
            case 'rejected': return '#FF3B30';
            default: return '#AAA';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid': return 'rgba(0, 255, 136, 0.2)';
            case 'pending': return 'rgba(255, 165, 0, 0.2)';
            case 'rejected': return 'rgba(255, 59, 48, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    };

    const renderItem = (item: WithdrawHistoryItem) => {
        const date = new Date(item.date || item.createdDate);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const displayAmount = item.reward || item.scoreEarning || 0;

        return (
            <View key={item._id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.amountContainer}>
                        <MaterialIcon name="payments" family="material" size={20} color="#00E0FF" />
                        <Text style={styles.amountText}>{displayAmount.toFixed(8)} {item.token || 'SHIB'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.dateText}>{formattedDate}</Text>
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
                            name="history"
                            family="material"
                            size={ICON_SIZES.LARGE}
                            color="#00E0FF"
                        />
                        <Text style={styles.title}>WITHDRAW HISTORY</Text>
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

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>PENDING</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                        onPress={() => setActiveTab('completed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>PAID</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#00E0FF" />
                            <Text style={styles.loadingText}>Loading history...</Text>
                        </View>
                    ) : history.filter(item => activeTab === 'pending' ? item.status === 'pending' : item.status !== 'pending').length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcon
                                name="history-edu"
                                family="material"
                                size={80}
                                color="rgba(255, 255, 255, 0.1)"
                            />
                            <Text style={styles.emptyText}>
                                No {activeTab === 'pending' ? 'pending' : 'completed'} withdrawals yet
                            </Text>
                            <Text style={styles.emptySubText}>
                                {activeTab === 'pending' 
                                    ? 'Your pending withdrawals will appear here' 
                                    : 'Your completed withdrawals will appear here'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {history
                                .filter(item => activeTab === 'pending' ? item.status === 'pending' : item.status !== 'pending')
                                .map((item) => renderItem(item))}
                        </View>
                    )}
                </ScrollView>
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
        borderColor: '#00E0FF',
        width: '100%',
        height: '80%',
        maxHeight: 600,
        shadowColor: '#00E0FF',
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
        borderBottomColor: 'rgba(0, 224, 255, 0.2)',
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
        textShadowColor: 'rgba(0, 224, 255, 0.8)',
        textShadowRadius: 15,
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.3)',
    },
    content: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    loadingContainer: {
        flex: 1,
        paddingVertical: 80,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    loadingText: {
        color: '#00E0FF',
        marginTop: 15,
        fontSize: 16,
        fontFamily: 'monospace',
        letterSpacing: 1,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        paddingVertical: 80,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        fontFamily: 'monospace',
        textAlign: 'center',
        lineHeight: 24,
        letterSpacing: 0.5,
    },
    emptySubText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '400',
        marginTop: 8,
        fontFamily: 'monospace',
        textAlign: 'center',
        lineHeight: 18,
        letterSpacing: 0.3,
    },
    list: {
        padding: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 224, 255, 0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#00E0FF',
    },
    tabText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
        fontFamily: 'monospace',
    },
    activeTabText: {
        color: '#00E0FF',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.15)',
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amountText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    dateText: {
        color: '#777',
        fontSize: 12,
        fontFamily: 'monospace',
        fontStyle: 'italic',
    },
});

export default WithdrawHistory;
