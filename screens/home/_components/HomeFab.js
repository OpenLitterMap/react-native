import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Body } from '../../components';

const HomeFab = ({ navigation, status, onPress }) => {
    let iconName;
    const disabled = status === 'SELECTING' ? true : false;
    switch (status) {
        case 'NO_IMAGES':
            iconName = 'ios-images-outline';
            break;
        case 'SELECTING':
            iconName = 'ios-trash-outline';
            break;
        case 'SELECTED':
            iconName = 'ios-trash-outline';
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
                style={styles.containerStyle}>
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
                    useAngle={true}
                    angle={145}
                    style={[
                        styles.buttonStyle,
                        {
                            opacity: disabled ? 0.3 : 1
                        }
                    ]}>
                    {/* <Body>{status}</Body> */}
                    <Icon
                        name={iconName}
                        color={disabled ? Colors.muted : 'white'}
                        size={32}
                    />
                </LinearGradient>
            </Pressable>
        </View>
    );
};
export default HomeFab;

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
