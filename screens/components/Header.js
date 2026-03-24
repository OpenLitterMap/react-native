import React from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from './theme';

const Header = ({
    leftContent,
    centerContent,
    rightContent,
    containerStyle,
    leftContainerStyle,
    centerContainerStyle,
    rightContainerStyle
}) => {
    const insets = useSafeAreaInsets();

    return (
        <>
            <StatusBar
                translucent
                barStyle="light-content"
                backgroundColor={`${Colors.accent}`}
            />
            <View
                style={[
                    styles.headerSafeView,
                    {
                        paddingTop: insets.top,
                        paddingLeft: insets.left,
                        paddingRight: insets.right
                    }
                ]}>
                <View style={[styles.headerContainer, containerStyle]}>
                    {/* left icon */}
                    {leftContent && (
                        <View style={[{flex: 1}, leftContainerStyle]}>
                            {leftContent}
                        </View>
                    )}

                    {/* center content */}
                    {centerContent && (
                        <View
                            style={[
                                {flex: 1, alignItems: 'center'},
                                centerContainerStyle
                            ]}>
                            {centerContent}
                        </View>
                    )}

                    {/* right content */}
                    {rightContent && (
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
                    )}
                </View>
            </View>
        </>
    );
};

export default Header;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: `${Colors.accent}`,
        minHeight: 60
    },
    headerSafeView: {
        backgroundColor: `${Colors.accent}`
    }
});
