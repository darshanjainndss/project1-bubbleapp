import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ViewStyle,
    TextStyle,
    ScrollView,
    Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcon from './MaterialIcon';
import { ICON_SIZES } from '../../config/icons';
import { baseModalStyles as styles } from '../../styles/components/BaseModalStyles';

interface BaseModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    icon?: string;
    iconColor?: string;
    primaryAction?: {
        label: string;
        onPress: () => void;
        style?: ViewStyle;
        textStyle?: TextStyle;
        disabled?: boolean;
        gradientColors?: string[];
    };
    secondaryAction?: {
        label: string;
        onPress: () => void;
        style?: ViewStyle;
        textStyle?: TextStyle;
        disabled?: boolean;
    };
    children?: React.ReactNode;
    showCloseButton?: boolean;
    contentStyle?: ViewStyle;
    containerStyle?: ViewStyle;
    scrollable?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
    visible,
    onClose,
    title,
    message,
    icon,
    iconColor = '#00E0FF',
    primaryAction,
    secondaryAction,
    children,
    showCloseButton = false,
    contentStyle,
    containerStyle,
    scrollable = false,
}) => {
    const { height: screenHeight } = Dimensions.get('window');
    const maxHeight = screenHeight * 0.9;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[styles.overlay, containerStyle]}>
                    <TouchableWithoutFeedback>
                        <View style={[
                            styles.content, 
                            contentStyle,
                            scrollable && { maxHeight }
                        ]}>
                            {scrollable ? (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    bounces={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{ flexGrow: 1 }}
                                >
                                    <View style={{ flex: 1 }}>
                                        {(icon || title) && (
                                            <View style={styles.header}>
                                                {icon && (
                                                    <MaterialIcon
                                                        name={icon}
                                                        size={ICON_SIZES.XLARGE || 48}
                                                        color={iconColor}
                                                    />
                                                )}
                                                {title && <Text style={styles.title}>{title}</Text>}
                                            </View>
                                        )}

                                        {message && <Text style={styles.message}>{message}</Text>}

                                        {children}
                                    </View>

                                    {(primaryAction || secondaryAction) && (
                                        <View style={styles.footer}>
                                            {secondaryAction && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.secondaryBtn,
                                                        secondaryAction.style,
                                                        secondaryAction.disabled && { opacity: 0.5 }
                                                    ]}
                                                    onPress={secondaryAction.onPress}
                                                    disabled={secondaryAction.disabled}
                                                >
                                                    <Text style={[styles.secondaryBtnText, secondaryAction.textStyle]}>
                                                        {secondaryAction.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            {primaryAction && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.primaryBtn,
                                                        primaryAction.style,
                                                        { backgroundColor: primaryAction.gradientColors ? 'transparent' : (primaryAction.style?.backgroundColor || '#00E0FF') },
                                                        primaryAction.disabled && { opacity: 0.5 }
                                                    ]}
                                                    onPress={primaryAction.onPress}
                                                    disabled={primaryAction.disabled}
                                                    activeOpacity={0.8}
                                                >
                                                    {primaryAction.gradientColors ? (
                                                        <LinearGradient
                                                            colors={primaryAction.gradientColors}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderRadius: (primaryAction.style?.borderRadius as number) || 16
                                                            }}
                                                        >
                                                            <Text style={[styles.primaryBtnText, primaryAction.textStyle]}>
                                                                {primaryAction.label}
                                                            </Text>
                                                        </LinearGradient>
                                                    ) : (
                                                        <Text style={[styles.primaryBtnText, primaryAction.textStyle]}>
                                                            {primaryAction.label}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </ScrollView>
                            ) : (
                                <>
                                    {(icon || title) && (
                                        <View style={styles.header}>
                                            {icon && (
                                                <MaterialIcon
                                                    name={icon}
                                                    size={ICON_SIZES.XLARGE || 48}
                                                    color={iconColor}
                                                />
                                            )}
                                            {title && <Text style={styles.title}>{title}</Text>}
                                        </View>
                                    )}

                                    {message && <Text style={styles.message}>{message}</Text>}

                                    {children}

                                    {(primaryAction || secondaryAction) && (
                                        <View style={styles.footer}>
                                            {secondaryAction && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.secondaryBtn,
                                                        secondaryAction.style,
                                                        secondaryAction.disabled && { opacity: 0.5 }
                                                    ]}
                                                    onPress={secondaryAction.onPress}
                                                    disabled={secondaryAction.disabled}
                                                >
                                                    <Text style={[styles.secondaryBtnText, secondaryAction.textStyle]}>
                                                        {secondaryAction.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            {primaryAction && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.primaryBtn,
                                                        primaryAction.style,
                                                        { backgroundColor: primaryAction.gradientColors ? 'transparent' : (primaryAction.style?.backgroundColor || '#00E0FF') },
                                                        primaryAction.disabled && { opacity: 0.5 }
                                                    ]}
                                                    onPress={primaryAction.onPress}
                                                    disabled={primaryAction.disabled}
                                                    activeOpacity={0.8}
                                                >
                                                    {primaryAction.gradientColors ? (
                                                        <LinearGradient
                                                            colors={primaryAction.gradientColors}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderRadius: (primaryAction.style?.borderRadius as number) || 16
                                                            }}
                                                        >
                                                            <Text style={[styles.primaryBtnText, primaryAction.textStyle]}>
                                                                {primaryAction.label}
                                                            </Text>
                                                        </LinearGradient>
                                                    ) : (
                                                        <Text style={[styles.primaryBtnText, primaryAction.textStyle]}>
                                                            {primaryAction.label}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </>
                            )}

                            {showCloseButton && (
                                <TouchableOpacity
                                    style={[styles.closeButton, { zIndex: 999 }]}
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                >
                                    <View style={{
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        borderRadius: 20,
                                        padding: 8,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)'
                                    }}>
                                        <MaterialIcon name="close" size={20} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default BaseModal;
