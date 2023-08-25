import React, {ReactElement} from 'react';
import {
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import {Colors} from './theme';

// const {height: SCREEN_HEIGHT} = Dimensions.get('window');

interface HeaderProps {
    leftContent?: ReactElement;
    rightContent?: ReactElement;
    centerContent?: ReactElement;
    containerStyle?: React.CSSProperties | React.CSSProperties[];
    leftContainerStyle?: React.CSSProperties | React.CSSProperties[];
    rightContainerStyle?: React.CSSProperties | React.CSSProperties[];
    centerContainerStyle?: React.CSSProperties | React.CSSProperties[];
}

const Header: React.FC<HeaderProps> = ({
    leftContent,
    centerContent,
    rightContent,
    containerStyle,
    leftContainerStyle,
    centerContainerStyle,
    rightContainerStyle
}) => {
    // @ts-ignore
    // @ts-ignore
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
