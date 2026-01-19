import React from 'react';
import BaseModal from './BaseModal';

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
        <BaseModal
            visible={visible}
            onClose={onCancel}
            title={title}
            message={message}
            icon="help-outline"
            primaryAction={{
                label: confirmLabel,
                onPress: onConfirm,
            }}
            secondaryAction={{
                label: cancelLabel,
                onPress: onCancel,
            }}
        />
    );
};

export default ConfirmationModal;
