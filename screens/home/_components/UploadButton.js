import React from 'react';
import { StyleSheet, Pressable, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, SubTitle } from '../../components';
// ios-cloud-upload-outline
const { width } = Dimensions.get('window');
const UploadButton = ({ onPress }) => {
    return (
        <Pressable onPress={() => onPress()} style={styles.buttonStyle}>
            <Icon
                name="ios-cloud-upload-outline"
                color="white"
                size={32}
                style={{ marginRight: 20 }}
            />
            <SubTitle color="white">Upload</SubTitle>
        </Pressable>
    );
};

export default UploadButton;

const styles = StyleSheet.create({
    buttonStyle: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        width: width - 150,
        height: 80,
        borderRadius: 100,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    }
});
