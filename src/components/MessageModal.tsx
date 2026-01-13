import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialIcon from './MaterialIcon';
import { ICON_COLORS, ICON_SIZES } from '../config/icons';

interface MessageModalProps {
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({
    visible,
    title,
    message,
    type,
    onClose,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'check-circle', color: ICON_COLORS.SUCCESS || '#00FF88' };
            case 'error':
                return { name: 'error', color: ICON_COLORS.ERROR || '#FF3B30' };
            default:
                return { name: 'info', color: '#00E0FF' };
        }
    };

    const icon = getIcon();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { borderColor: icon.color }]}>
                    <View style={styles.header}>
                        <MaterialIcon name={icon.name} family="material" size={ICON_SIZES.LARGE} color={icon.color} />
                        <Text style={[styles.title, { color: icon.color }]}>{title}</Text>
                    </View>

                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: icon.color }]} onPress={onClose}>
                            <Text style={styles.closeText}>CONTINUE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'rgba(5, 5, 10, 0.98)',
        borderRadius: 20,
        borderWidth: 2,
        padding: 25,
        shadowColor: '#00E0FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1,
    },
    message: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 25,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    closeBtn: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        shadowColor: '#00E0FF',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    closeText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '900',
    },
});

export default MessageModal;
