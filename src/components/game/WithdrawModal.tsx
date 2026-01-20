import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import BackendService from '../../services/BackendService';
import MessageModal from '../common/MessageModal';
import MaterialIcon from '../common/MaterialIcon';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WithdrawModalProps {
    visible: boolean;
    onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ visible, onClose }) => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [claimedEarnings, setClaimedEarnings] = useState(0);
    const [walletAddress, setWalletAddress] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [minWithdrawAmount, setMinWithdrawAmount] = useState(0.00000001);
    const [msgModal, setMsgModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info'
    });

    const textInputRef = useRef<TextInput>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animations (Matching HelpSlider)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Card Animations
    const cardPulse = useRef(new Animated.Value(1)).current;
    const shineAnim = useRef(new Animated.Value(-1)).current;

    useEffect(() => {
        if (visible) {
            loadData();
            fetchConfig();
            setIsInputFocused(false);
            setWalletAddress('');

            // Open Animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();

            // Start Card Animations
            startCardAnimations();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);

            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
                focusTimeoutRef.current = null;
            }
        }
    }, [visible]);

    const startCardAnimations = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(cardPulse, {
                    toValue: 1.02,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(cardPulse, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(shineAnim, {
                    toValue: 2,
                    duration: 2500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.delay(3000),
            ])
        ).start();
    };

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
        try {
            const rewardRes = await BackendService.getRewardHistoryOnly();
            if (rewardRes.success && rewardRes.history) {
                const total = rewardRes.history
                    .filter(r => r.status === 'claimed')
                    .reduce((sum, r) => sum + (r.reward || r.scoreEarning || 0), 0);
                setClaimedEarnings(total);
            }
        } catch (error) {
            console.error('Failed to load withdrawal data:', error);
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
    const progressPercent = Math.min((claimedEarnings / minWithdrawAmount) * 100, 100);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop Click Handler */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardAvoid}
                >
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>SECURE WITHDRAW</Text>
                                <View style={styles.underline} />
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <MaterialIcon name="close" family="material" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ width: '100%' }}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Premium Card Display */}
                            <Animated.View style={[styles.cardContainer, { transform: [{ scale: cardPulse }] }]}>
                                <LinearGradient
                                    colors={['#1a1d2d', '#0f1219']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.card}
                                >
                                    {/* Card Shine Effect */}
                                    <Animated.View
                                        style={[
                                            styles.shineOverlay,
                                            {
                                                transform: [
                                                    {
                                                        translateX: shineAnim.interpolate({
                                                            inputRange: [-1, 2],
                                                            outputRange: [-300, 600]
                                                        })
                                                    },
                                                    { rotate: '45deg' }
                                                ]
                                            }
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{ flex: 1 }}
                                        />
                                    </Animated.View>

                                    {/* Card Content */}
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardLabel}>CRYPTO ASSET CARD</Text>
                                        <MaterialIcon name="wifi" size={20} color="rgba(255,255,255,0.4)" style={{ transform: [{ rotate: '90deg' }] }} />
                                    </View>

                                    <View style={styles.chipContainer}>
                                        <LinearGradient
                                            colors={['#FFD700', '#FDB931', '#FFD700']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.chip}
                                        >
                                            <View style={styles.chipLine1} />
                                            <View style={styles.chipLine2} />
                                        </LinearGradient>
                                        <MaterialIcon name="nfc" size={24} color="rgba(255,255,255,0.3)" />
                                    </View>

                                    <View style={styles.balanceContainer}>
                                        <Text style={styles.balanceLabel}>Available Balance</Text>
                                        <View style={styles.balanceRow}>
                                            <View style={styles.logoBadge}>
                                                <Text style={styles.logoText}>SHIB</Text>
                                            </View>
                                            <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
                                                {claimedEarnings.toFixed(8)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <View>
                                            <Text style={styles.cardFooterLabel}>HOLDER</Text>
                                            <Text style={styles.cardFooterValue}>
                                                {user?.email?.split('@')[0] || user?.displayName || 'PLAYER'}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.cardFooterLabel}>STATUS</Text>
                                            <Text style={[styles.cardFooterValue, { color: isAmountMet ? '#00FF88' : '#FF4444' }]}>
                                                {isAmountMet ? 'ACTIVE' : 'LOCKED'}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </Animated.View>

                            {/* Progress Section */}
                            <View style={styles.progressSection}>
                                <View style={styles.progressLabels}>
                                    <Text style={styles.progressText}>Withdrawal Limit Progress</Text>
                                    <Text style={styles.progressValue}>{progressPercent.toFixed(0)}%</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={['#FF4444', '#FFD700', '#00FF88']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                                    />
                                </View>
                                <Text style={styles.minRequirement}>
                                    Minimum Required: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{minWithdrawAmount.toFixed(8)} SHIB</Text>
                                </Text>
                            </View>

                            {/* Input Field */}
                            <View style={styles.formSection}>
                                <Text style={styles.inputLabel}>DESTINATION WALLET ADDRESS</Text>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
                                        focusTimeoutRef.current = setTimeout(() => textInputRef.current?.focus(), 50);
                                    }}
                                    style={[
                                        styles.inputContainer,
                                        isInputFocused && styles.inputContainerFocused
                                    ]}
                                >
                                    <View style={styles.inputIconBg}>
                                        <MaterialIcon name="account-balance-wallet" size={20} color={isInputFocused ? "#00E0FF" : "#64748B"} />
                                    </View>
                                    <TextInput
                                        ref={textInputRef}
                                        style={styles.textInput}
                                        placeholder="Paste ERC-20 / BEP-20 Address"
                                        placeholderTextColor="#475569"
                                        value={walletAddress}
                                        onChangeText={setWalletAddress}
                                        onFocus={() => setIsInputFocused(true)}
                                        onBlur={() => setIsInputFocused(false)}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isSubmitting}
                                    />
                                    {walletAddress.length > 0 && (
                                        <TouchableOpacity
                                            onPress={() => setWalletAddress('')}
                                            style={styles.clearButton}
                                        >
                                            <MaterialIcon name="cancel" size={18} color="#64748B" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.warningContainer}>
                                    <MaterialIcon name="warning" size={12} color="#FBBF24" />
                                    <Text style={styles.scamWarning}>
                                        Double check your address. Transactions cannot be reversed.
                                    </Text>
                                </View>
                            </View>

                        </ScrollView>

                        {/* Action Filter */}
                        <View style={styles.actionFooter}>
                            <TouchableOpacity
                                style={[styles.cancelBtn]}
                                onPress={onClose}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelBtnText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmBtn,
                                    (!isAmountMet || isSubmitting) && styles.disabledBtn
                                ]}
                                onPress={handleWithdraw}
                                disabled={!isAmountMet || isSubmitting}
                            >
                                <LinearGradient
                                    colors={isAmountMet ? ['#00E0FF', '#007AFF'] : ['#334155', '#1E293B']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientBtn}
                                >
                                    <Text style={[styles.confirmBtnText, !isAmountMet && { color: '#64748B' }]}>
                                        {isSubmitting ? "PROCESSING..." : "CONFIRM WITHDRAWAL"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </KeyboardAvoidingView>

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
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 5, 10, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoid: {
        width: '100%',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 450,
        maxHeight: SCREEN_HEIGHT * 0.9,
        backgroundColor: '#0A0F20',
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 224, 255, 0.4)',
        overflow: 'hidden',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 224, 255, 0.05)',
    },
    headerTitle: {
        color: '#00E0FF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0, 224, 255, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    underline: {
        width: 40,
        height: 3,
        backgroundColor: '#00E0FF',
        marginTop: 4,
        borderRadius: 2,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    scrollContent: {
        padding: 20,
    },
    // Card Styles
    cardContainer: {
        borderRadius: 20,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        minHeight: 200,
        justifyContent: 'space-between',
    },
    shineOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 100,
        height: '200%',
        zIndex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    chipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginVertical: 16,
    },
    chip: {
        width: 44,
        height: 34,
        borderRadius: 6,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    chipLine1: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    chipLine2: {
        position: 'absolute',
        left: '40%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    balanceContainer: {
        marginBottom: 16,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoBadge: {
        backgroundColor: '#FFA500',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    logoText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 10,
    },
    balanceAmount: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 1,
        fontFamily: 'monospace',
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardFooterLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 8,
        fontWeight: '700',
        marginBottom: 2,
    },
    cardFooterValue: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    progressSection: {
        marginBottom: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
    },
    progressValue: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    minRequirement: {
        color: '#64748B',
        fontSize: 11,
        textAlign: 'right',
    },
    // Form Styles
    formSection: {
        gap: 8,
    },
    inputLabel: {
        color: '#E2E8F0',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 4,
        marginBottom: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: 60,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    inputContainerFocused: {
        borderColor: '#00E0FF',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    inputIconBg: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        paddingVertical: 10,
    },
    clearButton: {
        padding: 8,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 4,
    },
    scamWarning: {
        color: '#94A3B8',
        fontSize: 11,
    },
    actionFooter: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 0,
        gap: 12,
        marginTop: 10, // Ensure space from scroll view
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cancelBtnText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
    confirmBtn: {
        flex: 2,
        height: 50,
        borderRadius: 16,
        overflow: 'hidden',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    gradientBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default WithdrawModal;
