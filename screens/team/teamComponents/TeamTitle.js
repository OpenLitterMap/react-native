import {Animated, Easing, Pressable, StyleSheet, View} from 'react-native';
import React, {Component} from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import {Body, Caption, Colors, Title} from '../../components';

/**
 * @prop {string} identifier
 * @prop {string} teamName
 */
export class TeamTitle extends Component {
    constructor(props) {
        super(props);

        this.state = {
            opacityAnimation: new Animated.Value(0)
        };
    }

    /**
     * copy team unique identifier to Clipboard
     */
    copyIdentifier = async () => {
        // Clipboard.setString(this.props.identifier);
        this.opacityAnmiation();
    };

    /**
     * opactity animations for Copied message
     */
    opacityAnmiation = async () => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(this.returnOpacityAnmiation);
    };

    returnOpacityAnmiation = async () => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    render() {
        const opacityStyle = {
            opacity: this.state.opacityAnimation
        };

        const {identifier, teamName} = this.props;
        return (
            <View>
                <Pressable
                    onPress={this.copyIdentifier}
                    style={styles.titleContainer}>
                    <Title>{teamName}</Title>
                    <View style={{flexDirection: 'row'}}>
                        <Body color="accent" style={{marginRight: 10}}>
                            {identifier}
                        </Body>
                        <Icon
                            name="ios-copy-outline"
                            color={Colors.accent}
                            size={18}
                        />
                    </View>
                </Pressable>
                {/* Copied message */}
                <Animated.View style={opacityStyle}>
                    <Caption color="accent" style={{textAlign: 'center'}}>
                        Copied
                    </Caption>
                </Animated.View>
            </View>
        );
    }
}

export default TeamTitle;

const styles = StyleSheet.create({
    titleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    }
});
