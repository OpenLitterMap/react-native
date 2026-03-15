import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    Easing as ReanimatedEasing
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';

import { Body, Caption, Colors, Title } from '../../components';

/**
 * @prop {string} identifier
 * @prop {string} teamName
 */
const TeamTitle = ({ identifier, teamName }) => {

    const { t } = useTranslation();
    const opacityAnimation = useSharedValue(0);

    /**
     * copy team unique identifier to Clipboard
     */
    const copyIdentifier = async () => {
        Clipboard.setString(identifier);
        opacityAnimation.value = withSequence(
            withTiming(1, {duration: 500, easing: ReanimatedEasing.elastic(1)}),
            withTiming(0, {duration: 800, easing: ReanimatedEasing.elastic(1)})
        );
    };

    const opacityStyle = useAnimatedStyle(() => ({
        opacity: opacityAnimation.value
    }));

    return (
        <View>
            <Pressable
                onPress={copyIdentifier}
                style={styles.titleContainer}>
                <Title>{teamName}</Title>
                <View style={{flexDirection: 'row'}}>
                    <Body color="accent" style={{marginRight: 10}}>
                        {identifier}
                    </Body>
                    <Icon
                        name="copy-outline"
                        color={Colors.accent}
                        size={18}
                    />
                </View>
            </Pressable>

            {/* Copied message */}
            <Animated.View style={opacityStyle}>
                <Caption color="accent" style={{ textAlign: 'center' }}>
                    {t('Copied')}
                </Caption>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    }
});

export default TeamTitle;
