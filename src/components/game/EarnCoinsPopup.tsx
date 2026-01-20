import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import MaterialIcon from '../common/MaterialIcon';
import BaseModal from '../common/BaseModal';
import RewardedAdButton from '../common/RewardedAdButton';
import { GAME_ICONS, ICON_COLORS } from '../../config/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EarnCoinsPopupProps {
    visible: boolean;
    onClose: () => void;
    onWatchAd: (amount: number) => void;
    rewardAmount: number;
}

const EarnCoinsPopup: React.FC<EarnCoinsPopupProps> = ({
    visible,
    onClose,
    onWatchAd,
    rewardAmount,
}) => {
    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            title="EARN FREE COINS"
            icon="monetization-on"
            iconColor={ICON_COLORS.GOLD}
            showCloseButton={true}
        >
            <View style={styles.container}>
                <Text style={styles.description}>
                    Watch a short video ad to earn rewards! Use them to unlock powerful abilities and dominate the cosmos.
                </Text>

                <View style={styles.rewardBox}>
                    <View style={styles.coinIconWrap}>
                        <MaterialIcon
                            name={GAME_ICONS.COIN.name}
                            family={GAME_ICONS.COIN.family}
                            size={32}
                            color={ICON_COLORS.GOLD}
                        />
                    </View>
                    <Text style={styles.rewardText}>+{rewardAmount} Coins</Text>
                    <Text style={styles.rewardSubtext}>per completion</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <RewardedAdButton
                        onReward={(amount) => {
                            onWatchAd(amount);
                        }}
                        rewardAmount={rewardAmount}
                        style={styles.watchAdBtn}
                    />

                    <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
                        <Text style={styles.laterBtnText}>MAYBE LATER</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    description: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    rewardBox: {
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.1)',
    },
    coinIconWrap: {
        marginBottom: 10,
    },
    rewardText: {
        color: '#FFD700',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
    },
    rewardSubtext: {
        color: 'rgba(255, 215, 0, 0.5)',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    watchAdBtn: {
        width: '100%',
        height: 55,
    },
    laterBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    laterBtnText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default EarnCoinsPopup;
