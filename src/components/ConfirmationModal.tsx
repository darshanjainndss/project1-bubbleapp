import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialIcon from './MaterialIcon';
import { ICON_COLORS, ICON_SIZES } from '../config/icons';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <MaterialIcon name="help-outline" family="material" size={ICON_SIZES.LARGE} color="#00E0FF" />
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelText}>{cancelLabel}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
                            <Text style={styles.confirmText}>{confirmLabel}</Text>
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
        borderColor: '#00E0FF',
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
        color: '#00E0FF',
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
        justifyContent: 'space-between',
        gap: 15,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cancelText: {
        color: '#aaa',
        fontSize: 14,
        fontWeight: '700',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00E0FF',
        borderRadius: 10,
        shadowColor: '#00E0FF',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    confirmText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '900',
    },
});

export default ConfirmationModal;
