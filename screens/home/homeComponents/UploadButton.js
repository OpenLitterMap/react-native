import React from 'react';
import { StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, SubTitle } from '../../components';
const UploadButton = ({ onPress }) => {
    const { width } = useWindowDimensions();
    return (
        <Pressable onPress={() => onPress()} style={[styles.buttonStyle, {width: Math.min(width - 150, 400)}]}>
            <Icon
                name="cloud-upload-outline"
                color="white"
                size={32}
                style={{ marginRight: 20 }}
            />
            <SubTitle
                color="white"
                dictionary={'Upload'}
            />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    buttonStyle: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        height: 80,
        borderRadius: 100,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    }
});

export default UploadButton;
