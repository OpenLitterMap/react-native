import React from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { Caption } from '../../components';

const StatusMessage = ({ isSubmitting, serverStatusText }) => {
    return (
        <View style={styles.container}>
            {isSubmitting ? (
                <ActivityIndicator color="white" />
            ) : (
                <Caption
                    color="white"
                    style={{
                        textAlign: 'center'
                    }}>
                    {serverStatusText}
                </Caption>
            )}
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
