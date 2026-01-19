import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ViewStyle,
    TextStyle
} from 'react-native';
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
}) => {
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
                        <View style={[styles.content, contentStyle]}>
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
                                                primaryAction.disabled && { opacity: 0.5 }
                                            ]}
                                            onPress={primaryAction.onPress}
                                            disabled={primaryAction.disabled}
                                        >
                                            <Text style={[styles.primaryBtnText, primaryAction.textStyle]}>
                                                {primaryAction.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
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
