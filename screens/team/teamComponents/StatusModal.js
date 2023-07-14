import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import LottieView from 'lottie-react-native';
import { Body } from '../../components';

// animations
const SuccessAnimation = require('../../../assets/lottie/success.json');
const ErrorAnimation = require('../../../assets/lottie/error.json');

const StatusModal = ({ text, type }) => {
    let animationSource;
    switch (type) {
        case 'SUCCESS':
            animationSource = SuccessAnimation;
            break;

        case 'ERROR':
            animationSource = ErrorAnimation;
            break;
        default:
            animationSource = SuccessAnimation;
            break;
    }
    return (
        <View style={styles.container}>
            <LottieView
                source={animationSource}
                autoPlay
                loop
                style={{ width: 80, height: 80, marginBottom: 20 }}
            />
            <Body style={{ textAlign: 'center' }}>{text}</Body>
        </View>
    );
};

export default StatusModal;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 40,
        paddingBottom: 40,
        alignItems: 'center'
    }
});
