import React, { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Body, Caption, Colors, Title } from '../../components';

/**
 * @prop {string} identifier
 * @prop {string} teamName
 */
const TeamTitle = ({ identifier, teamName }) => {

    const opacityAnimation = useRef(new Animated.Value(0)).current;

    /**
     * copy team unique identifier to Clipboard
     */
    const copyIdentifier = async () => {
        // Clipboard.setString(this.props.identifier);
        await opacityAnmiation();
    };

    /**
     * opactity animations for Copied message
     */
    const opacityAnmiation = async () => {
        Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(returnOpacityAnimation);
    };

    const returnOpacityAnimation = async () => {
        Animated.timing(opacityAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    const opacityStyle = {
        opacity: opacityAnimation
    };

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
                    Copied
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
