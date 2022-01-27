import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import LottieView from 'lottie-react-native';
import { Body } from '../../components';

const SuccessModal = ({ text }) => {
    return (
        <View style={styles.container}>
            <LottieView
                source={require('../../../assets/lottie/success.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80, marginBottom: 20 }}
            />
            <Body style={{ textAlign: 'center' }}>{text}</Body>
        </View>
    );
};

export default SuccessModal;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 40,
        paddingBottom: 40,
        alignItems: 'center'
    }
});
