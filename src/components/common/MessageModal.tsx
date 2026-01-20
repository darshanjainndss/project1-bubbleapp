import React from 'react';
import BaseModal from './BaseModal';
import { ICON_COLORS } from '../../config/icons';

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
    const getIconInfo = () => {
        switch (type) {
            case 'success': return { name: 'check-circle', color: ICON_COLORS.SUCCESS };
            case 'error': return { name: 'error', color: ICON_COLORS.ERROR };
            default: return { name: 'info', color: ICON_COLORS.INFO };
        }
    };

    const iconInfo = getIconInfo();

    return (
        <BaseModal
            visible={visible}
            onClose={onClose}
            title={title}
            message={message}
            icon={iconInfo.name}
            iconColor={iconInfo.color}
            primaryAction={{
                label: 'OK',
                onPress: onClose,
            }}
        />
    );
};

export default MessageModal;
