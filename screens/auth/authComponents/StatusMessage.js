import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Caption} from '../../components';

const StatusMessage = ({
    serverStatusText = '',
    color = 'white',
    showError = true
}) => {
    return (
        <View style={styles.container}>
            <Caption
                color={color}
                style={{
                    textAlign: 'center'
                }}>
                {showError ? serverStatusText : ''}
            </Caption>
        </View>
    );
};

export default StatusMessage;

const styles = StyleSheet.create({
    container: {
        height: 20,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
