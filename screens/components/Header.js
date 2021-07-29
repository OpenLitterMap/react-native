import React from 'react';
import { StyleSheet, Text, View, StatusBar, SafeAreaView } from 'react-native';

const Header = ({
    leftContent,
    centerContent,
    rightContent,
    containerStyle
}) => {
    return (
        <>
            <StatusBar translucent={true} backgroundColor="#fff" />
            <SafeAreaView
                edges={['left', 'top', 'right']}
                style={styles.headerSafeView}>
                <View style={[styles.headerContainer, containerStyle]}>
                    {/* left icon */}

                    <View>{leftContent}</View>

                    {/* center content */}
                    <View>{centerContent}</View>
                    {/* right content */}
                    <View>{rightContent}</View>
                </View>
            </SafeAreaView>
        </>
    );
};

export default Header;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    headerSafeView: {
        backgroundColor: '#fff'
    }
});
