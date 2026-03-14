import React from 'react';
import {
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
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
        paddingTop: StatusBar.currentHeight,
        alignItems: 'center',
        backgroundColor: `${Colors.accent}`,
        minHeight: Platform.OS === 'ios' ? 60 : 80
    },
    headerSafeView: {
        backgroundColor: `${Colors.accent}`
    }
});
