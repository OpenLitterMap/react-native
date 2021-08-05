import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    SafeAreaView,
    Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import { Colors } from './theme';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const Header = ({
    leftContent,
    centerContent,
    rightContent,
    containerStyle
}) => {
    return (
        <>
            <StatusBar
                translucent
                // hidden
                barStyle="light-content"
                backgroundColor={`${Colors.accent}`}
            />
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

Header.propTypes = {
    leftContent: PropTypes.element,
    rightContent: PropTypes.element,
    centerContent: PropTypes.element,
    containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
};

export default Header;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        // paddingVertical: 12,
        paddingTop: 30,
        alignItems: 'center',
        backgroundColor: `${Colors.accent}`,
        minHeight: SCREEN_HEIGHT * 0.1
    },
    headerSafeView: {
        backgroundColor: `${Colors.accent}`
    }
});
