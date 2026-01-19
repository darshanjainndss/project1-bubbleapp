import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import MaterialIcon from '../common/MaterialIcon';
import BaseModal from '../common/BaseModal';
import ToastNotification, { ToastRef } from '../common/ToastNotification';
import { ICON_COLORS } from '../../config/icons';
import BackendService, { WithdrawHistoryItem } from '../../services/BackendService';

interface WithdrawHistoryProps {
    visible: boolean;
    onClose: () => void;
}

const WithdrawHistory: React.FC<WithdrawHistoryProps> = ({ visible, onClose }) => {
    const [history, setHistory] = useState<WithdrawHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const toastRef = useRef<ToastRef>(null);

    useEffect(() => {
        if (visible) {
            loadHistory();
        }
    }, [visible]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const result = await BackendService.getWithdrawHistoryOnly();

            if (result.success && result.history) {
                setHistory(result.history);
            } else {
                toastRef.current?.show(result.error || 'Failed to load history', 'error');
            }
        } catch (error) {
            console.error('Failed to load withdraw history:', error);
            toastRef.current?.show('Failed to load history', 'error');
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
                        <MaterialIcon name="payments" family="material" size={16} color="#00E0FF" />
                        <Text style={styles.amountText}>{displayAmount.toFixed(8)} {item.token || 'SHIB'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
        );
    };

    const filteredHistory = history.filter(item =>
        activeTab === 'pending' ? item.status === 'pending' : item.status !== 'pending'
    );

    return (
        <>
            <BaseModal
                visible={visible}
                onClose={onClose}
                title="WITHDRAW HISTORY"
                icon="account-balance-wallet"
                iconColor="#00E0FF"
                showCloseButton={true}
                primaryAction={{
                    label: "CLOSE",
                    onPress: onClose,
                }}
            >
                <View style={styles.container}>
                    {/* Tabs */}
                    <View style={styles.tabs}>
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
                            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>COMPLETED</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollList}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#00E0FF" />
                            </View>
                        ) : filteredHistory.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No {activeTab} history</Text>
                            </View>
                        ) : (
                            filteredHistory.map(item => renderItem(item))
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
    tabs: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.2)',
    },
    tabText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#00E0FF',
    },
    scrollList: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingBottom: 10,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.1)',
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
        gap: 6,
    },
    amountText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
    },
    dateText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
        fontStyle: 'italic',
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
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
    },
});

export default WithdrawHistory;
