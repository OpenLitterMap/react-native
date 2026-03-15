import React from 'react';
import {View, StyleSheet, useWindowDimensions, Pressable} from 'react-native';
import {Body} from '../../components';

const ShowMyUploadsButton = ({navigation}) => {
    const {width: SCREEN_WIDTH} = useWindowDimensions();
    return (
        <View style={[styles.container, {marginLeft: SCREEN_WIDTH * 0.25, marginRight: SCREEN_WIDTH * 0.25}]}>
            <Pressable onPress={() => navigation.navigate('MY_UPLOADS')}>
                <Body
                    color="white"
                    family="semiBold"
                    style={styles.text}
                    dictionary="View My Uploads"
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#27ae60',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 20,
        marginTop: 10
    },
    text: {
        fontSize: 20,
        textAlign: 'center'
    }
});

export default ShowMyUploadsButton;
