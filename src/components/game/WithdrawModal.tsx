import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
} from 'react-native';
import BackendService from '../../services/BackendService';
import BaseModal from '../common/BaseModal';
import MessageModal from '../common/MessageModal';
import MaterialIcon from '../common/MaterialIcon';
import LinearGradient from 'react-native-linear-gradient';
import { ICON_COLORS } from '../../config/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WithdrawModalProps {
    visible: boolean;
    onClose: () => void;
    scoreEarnings?: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ visible, onClose, scoreEarnings = 0 }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [claimedEarnings, setClaimedEarnings] = useState(0);
    const [loading, setLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [msgModal, setMsgModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info'
    });

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rewardRes, withdrawRes] = await Promise.all([
                BackendService.getRewardHistoryOnly(),
                BackendService.getWithdrawHistoryOnly()
            ]);

            if (rewardRes.success && rewardRes.history) {
                const total = rewardRes.history
                    .filter(r => r.status === 'claimed')
                    .reduce((sum, r) => sum + (r.reward || r.scoreEarning || 0), 0);
                setClaimedEarnings(total);
            }

            if (withdrawRes.success && withdrawRes.history) {
                setHistory(withdrawRes.history);
            }
        } catch (error) {
            console.error('Failed to load withdrawal data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (claimedEarnings <= 0) {
            setMsgModal({
                visible: true,
                title: 'INSUFFICIENT FUNDS',
                message: 'You do not have any available earnings for withdrawal at this time.',
                type: 'error'
            });
            return;
        }

        if (!walletAddress.trim()) {
            setMsgModal({
                visible: true,
                title: 'WALLET REQUIRED',
                message: 'Please enter a valid SHIB wallet address to receive your rewards.',
                type: 'error'
            });
            return;
        }

        const isValidWallet = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
        if (!isValidWallet) {
            setMsgModal({
                visible: true,
                title: 'INVALID WALLET',
                message: 'The wallet address provided is not a valid Ethereum-compatible address. Please check and try again.',
                type: 'error'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await BackendService.requestWithdrawal(walletAddress);
            if (result.success) {
                setMsgModal({
                    visible: true,
                    title: 'REQUEST SENT',
                    message: `Your withdrawal request for ${result.amount?.toFixed(8)} SHIB has been submitted successfully! It will be processed shortly.`,
                    type: 'success'
                });
            } else {
                setMsgModal({
                    visible: true,
                    title: 'WITHDRAWAL FAILED',
                    message: result.error || 'The system could not process your withdrawal request. Please try again later.',
                    type: 'error'
                });
            }
        } catch (error) {
            setMsgModal({
                visible: true,
                title: 'SYSTEM ERROR',
                message: 'A connection error occurred. Please verify your internet and try again.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <BaseModal
                visible={visible}
                onClose={onClose}
                showCloseButton={true}
                contentStyle={{ padding: 0, overflow: 'hidden' }}
                primaryAction={{
                    label: isSubmitting ? "PROCESSING..." : "REQUEST WITHDRAWAL",
                    onPress: handleWithdraw,
                    disabled: isSubmitting || claimedEarnings <= 0,
                    style: styles.primaryBtn
                }}
                secondaryAction={{
                    label: "CLOSE",
                    onPress: onClose,
                    disabled: isSubmitting,
                    style: styles.secondaryBtn
                }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Custom Header inside ScrollView */}
                    <View style={styles.modalHeader}>
                        <MaterialIcon
                            name="account-balance-wallet"
                            family="material"
                            size={48}
                            color="#00E0FF"
                        />
                        <Text style={styles.modalTitle}>WITHDRAWAL</Text>
                    </View>

                    <View style={styles.contentPadding}>
                        <LinearGradient
                            colors={['rgba(0, 224, 255, 0.2)', 'rgba(0, 224, 255, 0.05)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.rewardPanel}
                        >
                            <View style={styles.glowOverlay} />
                            <Text style={styles.rewardLabel}>AVAILABLE REWARDS</Text>
                            <View style={styles.amountRow}>
                                <View style={styles.boltIconContainer}>
                                    <MaterialIcon name="bolt" family="material" size={28} color="#00FF88" />
                                </View>
                                <Text style={styles.rewardAmount}>{claimedEarnings.toFixed(8)}</Text>
                            </View>
                            <Text style={styles.currencyText}>SHIB TOKENS</Text>
                        </LinearGradient>

                        {/* Input Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>SHIB WALLET ADDRESS</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcon name="account-balance-wallet" size={20} color="rgba(0, 224, 255, 0.5)" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0x..."
                                    placeholderTextColor="rgba(255, 255, 255, 0.2)"
                                    value={walletAddress}
                                    onChangeText={setWalletAddress}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                                style={styles.tipBox}
                            >
                                <MaterialIcon name="info-outline" size={14} color="#00E0FF" />
                                <Text style={styles.tipText}>Supported Networks: Ethereum (ERC-20), Base, Arbitrum. Standard 0x format required.</Text>
                            </LinearGradient>
                        </View>

                        {/* Quick History Section */}
                        <View style={styles.historySection}>
                            <View style={styles.historyHeader}>
                                <MaterialIcon name="history" size={16} color="#94A3B8" />
                                <Text style={styles.historyLabel}>RECENT WITHDRAWALS</Text>
                            </View>
                            {loading ? (
                                <ActivityIndicator size="small" color="#00E0FF" style={{ marginTop: 10 }} />
                            ) : history.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No recent requests found</Text>
                                </View>
                            ) : (
                                <View style={styles.historyList}>
                                    {history.slice(0, 5).map((item) => (
                                        <LinearGradient
                                            key={item._id}
                                            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                                            style={styles.historyItem}
                                        >
                                            <View style={styles.historyInfo}>
                                                <View style={styles.tokenIconBox}>
                                                    <MaterialIcon name="toll" size={20} color="#00E0FF" />
                                                </View>
                                                <View>
                                                    <Text style={styles.historyAmount}>{(item.reward || item.scoreEarning || 0).toFixed(8)}</Text>
                                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                            <View style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor: item.status === 'pending'
                                                        ? 'rgba(255, 165, 0, 0.1)'
                                                        : item.status === 'approved'
                                                            ? 'rgba(0, 255, 136, 0.1)'
                                                            : 'rgba(239, 68, 68, 0.1)',
                                                    borderColor: item.status === 'pending'
                                                        ? 'rgba(255, 165, 0, 0.3)'
                                                        : item.status === 'approved'
                                                            ? 'rgba(0, 255, 136, 0.3)'
                                                            : 'rgba(239, 68, 68, 0.3)'
                                                }
                                            ]}>
                                                <MaterialIcon
                                                    name={item.status === 'pending' ? 'schedule' : item.status === 'approved' ? 'check-circle' : 'error'}
                                                    size={12}
                                                    color={item.status === 'pending' ? '#FFA500' : item.status === 'approved' ? '#00FF88' : '#FF4444'}
                                                />
                                                <Text style={[
                                                    styles.statusText,
                                                    {
                                                        color: item.status === 'pending'
                                                            ? '#FFA500'
                                                            : item.status === 'approved'
                                                                ? '#00FF88'
                                                                : '#FF4444'
                                                    }
                                                ]}>
                                                    {item.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    ))}
                                </View>
                            )}
                        </View>
                        <View style={styles.securitySeal}>
                            <MaterialIcon name="verified-user" size={12} color="rgba(255, 255, 255, 0.3)" />
                            <Text style={styles.securityText}>SECURE PROTOCOL ACTIVE</Text>
                        </View>
                    </View>
                </ScrollView>
            </BaseModal>

            <MessageModal
                visible={msgModal.visible}
                title={msgModal.title}
                message={msgModal.message}
                type={msgModal.type}
                onClose={() => {
                    setMsgModal(prev => ({ ...prev, visible: false }));
                    if (msgModal.type === 'success') {
                        onClose();
                        loadData();
                    }
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: Dimensions.get('window').height * 0.75,
        width: '100%',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    modalHeader: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 20,
        gap: 12,
    },
    modalTitle: {
        color: '#FFF',
        fontSize: SCREEN_WIDTH > 380 ? 24 : 20,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
    },
    contentPadding: {
        paddingHorizontal: 20,
    },
    rewardPanel: {
        alignItems: 'center',
        borderRadius: 24,
        padding: 24,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.3)',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
    },
    rewardLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rewardAmount: {
        color: '#FFF',
        fontSize: SCREEN_WIDTH > 380 ? 32 : 28,
        fontWeight: '900',
        fontFamily: 'monospace',
    },
    currencyText: {
        color: '#00E0FF',
        fontSize: SCREEN_WIDTH > 380 ? 14 : 12,
        fontWeight: '900',
        marginTop: 6,
        letterSpacing: 3,
        textShadowColor: 'rgba(0, 224, 255, 0.3)',
        textShadowRadius: 4,
    },
    boltIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.2)',
    },
    glowOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 224, 255, 0.05)',
        opacity: 0.5,
    },
    inputContainer: {
        marginBottom: 25,
    },
    inputLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        padding: 16,
        color: '#FFF',
        fontFamily: 'monospace',
        fontSize: 14,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.1)',
    },
    tipText: {
        flex: 1,
        color: 'rgba(0, 224, 255, 0.7)',
        fontSize: 10,
        fontWeight: '600',
        lineHeight: 14,
    },
    historySection: {
        marginTop: 5,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
        marginLeft: 4,
    },
    historyLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    historyList: {
        gap: 10,
    },
    emptyContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        fontStyle: 'italic',
        fontSize: 13,
    },
    historyItem: {
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 4,
    },
    historyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tokenIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.2)',
    },
    historyAmount: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '900',
        fontFamily: 'monospace',
    },
    historyDate: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        marginTop: 2,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    primaryBtn: {
        backgroundColor: '#00E0FF',
        borderRadius: 16,
        height: 56,
    },
    secondaryBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    securitySeal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 10,
        gap: 8,
        opacity: 0.6,
        backgroundColor: 'rgba(0, 255, 136, 0.05)',
        paddingVertical: 8,
        borderRadius: 30,
        alignSelf: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.1)',
    },
    securityText: {
        color: '#00FF88',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
});

export default WithdrawModal;
