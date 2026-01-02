import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import MaterialIcon from './MaterialIcon';
import { ICON_COLORS } from '../config/icons';

const { width } = Dimensions.get('window');

export interface ToastRef {
    show: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
    hide: () => void;
}

interface ToastProps { }

type ToastType = 'success' | 'error' | 'info' | 'warning';

const ToastNotification = forwardRef<ToastRef, ToastProps>((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');
    const [timer, setTimer] = useState<any>(null);

    // Animation values
    const [translateY] = useState(new Animated.Value(-100));
    const [opacity] = useState(new Animated.Value(0));

    useImperativeHandle(ref, () => ({
        show: (msg: string, toastType: ToastType = 'info', duration: number = 3000) => {
            if (timer) clearTimeout(timer);

            setMessage(msg);
            setType(toastType);
            setVisible(true);

            // Animation In
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 40
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto Hide
            const newTimer = setTimeout(() => {
                hideToast();
            }, duration);
            setTimer(newTimer);
        },
        hide: () => hideToast(),
    }));

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            if (timer) clearTimeout(timer);
            setTimer(null);
        });
    };

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return { name: 'check-circle', color: ICON_COLORS.SUCCESS };
            case 'error': return { name: 'error', color: ICON_COLORS.ERROR };
            case 'warning': return { name: 'warning', color: ICON_COLORS.WARNING };
            default: return { name: 'info', color: ICON_COLORS.INFO };
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return ICON_COLORS.SUCCESS;
            case 'error': return ICON_COLORS.ERROR;
            case 'warning': return ICON_COLORS.WARNING;
            default: return ICON_COLORS.INFO;
        }
    };

    const iconInfo = getIcon();
    const borderColor = getBorderColor();

    return (
        <SafeAreaView style={styles.container} pointerEvents="box-none">
            <Animated.View
                style={[
                    styles.toast,
                    {
                        borderColor: borderColor,
                        transform: [{ translateY }],
                        opacity,
                    },
                ]}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${iconInfo.color}20` }]}>
                    <MaterialIcon name={iconInfo.name} family="material" size={24} color={iconInfo.color} />
                </View>
                <Text style={styles.message}>{message}</Text>
                <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                    <MaterialIcon name="close" family="material" size={18} color="#FFFFFF80" />
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        width: width * 0.9,
        backgroundColor: 'rgba(10, 10, 20, 0.95)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    message: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: 4,
    },
});

export default ToastNotification;
