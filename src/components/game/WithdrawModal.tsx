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
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [minWithdrawAmount, setMinWithdrawAmount] = useState(0.00000001);
    const [msgModal, setMsgModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info'
    });

    useEffect(() => {
        if (visible) {
            loadData();
            fetchConfig();
        }
    }, [visible]);

    const fetchConfig = async () => {
        try {
            const res = await BackendService.getGameConfig();
            if (res.success && res.config?.gameSettings?.minWithdrawAmount) {
                setMinWithdrawAmount(res.config.gameSettings.minWithdrawAmount);
            }
        } catch (error) {
            console.error('Failed to fetch game config:', error);
        }
    };

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
        if (claimedEarnings < minWithdrawAmount) {
            setMsgModal({
                visible: true,
                title: 'THRESHOLD NOT MET',
                message: `A minimum balance of ${minWithdrawAmount.toFixed(8)} SHIB is required to initiate a withdrawal. Keep playing to earn more!`,
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
                    title: 'TRANSFER INITIATED',
                    message: `Your withdrawal of ${result.amount?.toFixed(8)} SHIB is being processed. It will arrive in your wallet shortly!`,
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

    const isAmountMet = claimedEarnings >= minWithdrawAmount;

    return (
        <>
            <BaseModal
                visible={visible}
                onClose={onClose}
                showCloseButton={true}
                scrollable={true}
                contentStyle={{ padding: 0, overflow: 'hidden', backgroundColor: '#0A0F1A', paddingBottom: 24 }}
                primaryAction={{
                    label: isSubmitting ? "PROCESSING..." : (isAmountMet ? "TRANSFER SHIB NOW" : "INSUFFICIENT BALANCE"),
                    onPress: handleWithdraw,
                    disabled: isSubmitting || !isAmountMet,
                    gradientColors: isAmountMet ? ['#00FF88', '#00CC6A'] : ['#FF4444', '#CC3333'],
                }}
                secondaryAction={{
                    label: "GO BACK",
                    onPress: onClose,
                    disabled: isSubmitting,
                }}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={['rgba(0, 224, 255, 0.2)', 'transparent']}
                    style={styles.headerGradient}
                >
                        <View style={styles.modalHeader}>
                            <View style={styles.headerIconBg}>
                                <MaterialIcon
                                    name="account-balance-wallet"
                                    family="material"
                                    size={36}
                                    color="#00E0FF"
                                />
                                <View style={styles.pulseDot} />
                            </View>
                            <Text style={styles.modalTitle}>Redeem SHIB</Text>
                            <Text style={styles.modalSubtitle}>Secure blockchain transfer enabled</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.contentPadding}>
                        {/* Balance Card */}
                        <LinearGradient
                            colors={['#161B22', '#0D1117']}
                            style={styles.rewardPanel}
                        >
                            <View style={styles.rewardHeader}>
                                <View style={styles.rewardLabelContainer}>
                                    <MaterialIcon name="stars" size={14} color="#FFD700" />
                                    <Text style={styles.rewardLabel}>CLAIMABLE REWARD</Text>
                                </View>
                                <View style={styles.tokenBadge}>
                                    <Text style={styles.tokenLabel}>ERC-20</Text>
                                </View>
                            </View>

                            <View style={styles.amountContainer}>
                                <Text style={styles.rewardAmount}>{claimedEarnings.toFixed(8)}</Text>
                                <Text style={styles.shibSuffix}>SHIB</Text>
                            </View>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[
                                        styles.progressBarFill,
                                        { width: `${Math.min((claimedEarnings / minWithdrawAmount) * 100, 100)}%` }
                                    ]} />
                                </View>
                                <View style={styles.progressLabelRow}>
                                    <Text style={styles.progressLabel}>Min: {minWithdrawAmount.toFixed(8)} SHIB</Text>
                                    <Text style={[styles.progressStatus, { color: isAmountMet ? '#00FF88' : '#64748B' }]}>
                                        {isAmountMet ? 'READY' : `${((claimedEarnings / minWithdrawAmount) * 100).toFixed(0)}%`}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Input Section */}
                        <View style={styles.inputSection}>
                            <View style={styles.inputHeader}>
                                <Text style={styles.inputLabel}>RECIPIENT ADDRESS</Text>
                            </View>
                            <View style={[
                                styles.inputWrapper,
                                isInputFocused && styles.inputWrapperFocused
                            ]}>
                                <MaterialIcon
                                    name="link"
                                    size={20}
                                    color={isInputFocused ? "#00E0FF" : "#475569"}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your ETH / SHIB address"
                                    placeholderTextColor="#475569"
                                    value={walletAddress}
                                    onChangeText={setWalletAddress}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {walletAddress.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setWalletAddress('')}
                                        style={styles.clearBtn}
                                    >
                                        <MaterialIcon name="cancel" size={18} color="#475569" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
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
    headerGradient: {
        paddingTop: 36,
        paddingBottom: 24,
    },
    modalHeader: {
        alignItems: 'center',
        gap: 8,
    },
    headerIconBg: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 224, 255, 0.3)',
        marginBottom: 12,
        position: 'relative',
    },
    pulseDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF88',
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    contentPadding: {
        paddingHorizontal: 24,
    },
    rewardPanel: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 15,
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    rewardLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rewardLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    tokenBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tokenLabel: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
        opacity: 0.6,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10,
        marginBottom: 24,
    },
    rewardAmount: {
        color: '#FFF',
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: -1.5,
    },
    shibSuffix: {
        color: '#00E0FF',
        fontSize: 16,
        fontWeight: '800',
    },
    progressContainer: {
        gap: 10,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#00E0FF',
        borderRadius: 3,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '600',
    },
    progressStatus: {
        fontSize: 11,
        fontWeight: '900',
    },
    inputSection: {
        marginBottom: 36,
    },
    inputHeader: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    inputLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        height: 64,
        paddingHorizontal: 20,
    },
    inputWrapperFocused: {
        borderColor: '#00E0FF',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    clearBtn: {
        padding: 6,
    },
});

export default WithdrawModal;
