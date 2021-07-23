import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Fab = () => {
    return (
        <View>
            <View
                style={{
                    position: 'absolute',
                    bottom: 100,
                    right: 30,
                    width: 80,
                    height: 80,
                    backgroundColor: '#396AFC',
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                <Icon name="camera-outline" color="white" size={32} />
            </View>
        </View>
    );
};
export default Fab;
