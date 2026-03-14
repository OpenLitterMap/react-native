import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../components';

const ActionButton = ({ status, onPress }) => {
    let iconName;

    const disabled = status === 'SELECTING';

    switch (status) {
        case 'NO_IMAGES':
            iconName = 'images-outline';
            break;
        case 'SELECTING':
            iconName = 'trash-outline';
            break;
        case 'SELECTED':
            iconName = 'trash-outline';
            break;
        case 'FILTER':
            iconName = 'funnel-outline';
            break;
        default:
            iconName = 'camera-outline';
            break;
    }

    return (
        <View>
            <Pressable
                disabled={disabled}
                onPress={() => onPress()}
                style={styles.containerStyle}
            >
                <LinearGradient
                    colors={
                        disabled
                            ? [`${Colors.muted}`, `${Colors.muted}`]
                            : [
                                  `${Colors.accentLight}`,
                                  `${Colors.accent}`,
                                  `${Colors.accent}`
                              ]
                    }
                    start={{x: 0.2, y: 0}}
                    end={{x: 0.8, y: 1}}
                    style={[
                        styles.buttonStyle,
                        {
                            opacity: disabled ? 0.3 : 1
                        }
                    ]}
                >
                    {/* <Body>{status}</Body> */}
                    <Icon name={iconName} color={'white'} size={32} />
                </LinearGradient>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    containerStyle: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 80,
        height: 80,
        borderRadius: 100
    },
    buttonStyle: {
        height: 80,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default ActionButton;
