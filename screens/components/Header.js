import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const Header = ({
    leftContent,
    centerContent,
    rightContent,
    containerStyle,
    withBackButton = false
}) => {
    const navigation = useNavigation();
    return (
        <View style={[styles.headerContainer, containerStyle]}>
            {/* left icon */}
            {withBackButton ? (
                <Icon
                    name="ios-arrow-back-outline"
                    color="white"
                    size={24}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            ) : (
                <View>{leftContent}</View>
            )}

            {/* center content */}
            <View>{centerContent}</View>
            {/* right content */}
            <View>{rightContent}</View>
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: 'red'
    }
});
