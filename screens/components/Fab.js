import React from 'react';
import { View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Fab = ({ navigation }) => {
    return (
        <View>
            <Pressable
                onPress={() => navigation.navigate('CAMERA')}
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
            </Pressable>
        </View>
    );
};
export default Fab;
