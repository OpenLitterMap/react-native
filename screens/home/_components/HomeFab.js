import React from 'react';
import { View, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../components';

const HomeFab = ({ navigation }) => {
    return (
        <View>
            <Pressable onPress={() => navigation.navigate('CAMERA')} style={{}}>
                <LinearGradient
                    colors={[
                        `${Colors.accentLight}`,
                        `${Colors.accent}`,
                        `${Colors.accent}`
                    ]}
                    useAngle={true}
                    angle={145}
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        right: 30,
                        width: 80,
                        height: 80,
                        borderRadius: 100,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Icon name="camera-outline" color="white" size={32} />
                </LinearGradient>
            </Pressable>
        </View>
    );
};
export default HomeFab;
