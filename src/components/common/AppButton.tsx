import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    disabled?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    style,
    textStyle,
    variant = 'primary',
    loading = false,
    disabled = false,
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondary;
            case 'outline':
                return styles.outline;
            case 'danger':
                return styles.danger;
            default:
                return styles.primary;
        }
    };

    const getVariantTextStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineText;
            case 'secondary':
                return styles.secondaryText;
            default:
                return styles.primaryText;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.base, getVariantStyle(), style, (disabled || loading) && styles.disabled]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#00E0FF' : '#000'} size="small" />
            ) : (
                <Text style={[styles.baseText, getVariantTextStyle(), textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        flexDirection: 'row',
    },
    primary: {
        backgroundColor: '#00E0FF',
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#00E0FF',
    },
    danger: {
        backgroundColor: '#FF3B30',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabled: {
        opacity: 0.5,
    },
    baseText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    primaryText: {
        color: '#000',
    },
    secondaryText: {
        color: '#FFF',
    },
    outlineText: {
        color: '#00E0FF',
    },
});

export default AppButton;
