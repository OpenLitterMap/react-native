import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    SafeAreaView,
    Platform,
    Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import { Colors } from './theme';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const Header = ({
    leftContent,
    centerContent,
    rightContent,
    containerStyle,
    leftContainerStyle,
    centerContainerStyle,
    rightContainerStyle
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
                    {leftContent && (
                        <View style={[{ flex: 1 }, leftContainerStyle]}>
                            {leftContent}
                        </View>
                    )}

                    {/* center content */}
                    {centerContent && (
                        <View
                            style={[
                                { flex: 1, alignItems: 'center' },
                                centerContainerStyle
                            ]}>
                            {centerContent}
                        </View>
                    )}

                    {/* right content */}

                    <View
                        style={[
                            {
                                flex: 1,
                                alignItems: 'flex-end'
                            },
                            rightContainerStyle
                        ]}>
                        {rightContent}
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
};

Header.propTypes = {
    leftContent: PropTypes.element,
    rightContent: PropTypes.element,
    centerContent: PropTypes.element,
    containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    leftContainerStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    rightContainerStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    centerContainerStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ])
};

export default Header;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: StatusBar.currentHeight,
        alignItems: 'center',
        backgroundColor: `${Colors.accent}`,
        minHeight: Platform.OS === 'ios' ? 60 : 80
    },
    headerSafeView: {
        backgroundColor: `${Colors.accent}`
    }
});
