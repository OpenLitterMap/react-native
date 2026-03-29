import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../../components';

/**
 * Floating tooltip for onboarding guidance.
 * Does NOT block touches on the UI underneath — uses pointerEvents="box-none"
 * so the user can interact with chips, search bar, and buttons while the tooltip is visible.
 * Tapping the tooltip itself dismisses it.
 *
 * @param {Object} props
 * @param {string} props.message - Main tooltip text
 * @param {string} [props.hint] - Secondary hint text (e.g. "You can always edit this later")
 * @param {string} [props.position] - 'top' | 'bottom' — where the tooltip appears (default: 'bottom')
 * @param {Function} [props.onDismiss] - Called when the tooltip is tapped
 * @param {boolean} [props.visible] - Whether to show the tooltip
 */
const TooltipOverlay = ({message, hint, position = 'bottom', onDismiss, visible}) => {
    const {t} = useTranslation();
    if (!visible) return null;

    return (
        <View
            style={styles.container}
            pointerEvents="box-none">
            <Pressable
                onPress={onDismiss}
                style={[
                    styles.tooltip,
                    position === 'top'
                        ? styles.tooltipTop
                        : position === 'mid'
                            ? styles.tooltipMid
                            : styles.tooltipBottom
                ]}>
                <View style={styles.tooltipBubble}>
                    <Body color="white" family="medium" style={styles.tooltipText}>
                        {message}
                    </Body>
                    {hint && (
                        <Caption color="white" style={styles.tooltipHint}>
                            {hint}
                        </Caption>
                    )}
                    <Caption color="white" style={styles.dismissHint}>
                        {t('Tap to dismiss')}
                    </Caption>
                </View>
                <View
                    style={[
                        styles.arrow,
                        position === 'top' ? styles.arrowDown : styles.arrowUp
                    ]}
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000
    },
    tooltip: {
        position: 'absolute',
        left: 24,
        right: 24,
        alignItems: 'center'
    },
    tooltipTop: {
        top: '15%'
    },
    tooltipMid: {
        bottom: '20%'
    },
    tooltipBottom: {
        bottom: '15%'
    },
    tooltipBubble: {
        backgroundColor: Colors.accent,
        borderRadius: 12,
        padding: 16,
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6
    },
    tooltipText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center'
    },
    tooltipHint: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        opacity: 0.85
    },
    dismissHint: {
        marginTop: 6,
        fontSize: 11,
        textAlign: 'center',
        opacity: 0.6
    },
    arrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent'
    },
    arrowUp: {
        borderBottomWidth: 8,
        borderBottomColor: Colors.accent
    },
    arrowDown: {
        borderTopWidth: 8,
        borderTopColor: Colors.accent
    }
});

export default TooltipOverlay;
