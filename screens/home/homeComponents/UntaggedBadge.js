import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Colors} from '../../components';

const UntaggedBadge = ({count, onPress, loading}) => {
    if (!count || count <= 0) return null;

    return (
        <Pressable
            onPress={onPress}
            disabled={loading}
            style={({pressed}) => [
                styles.badge,
                pressed && styles.pressed
            ]}>
            {loading ? (
                <ActivityIndicator size="small" color="white" />
            ) : (
                <>
                    <Icon name="cloud-outline" size={20} color="white" />
                    <Text style={styles.count}>{count}</Text>
                </>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        backgroundColor: Colors.accent,
        borderRadius: 24,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10
    },
    pressed: {
        opacity: 0.7
    },
    count: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 1
    }
});

export default UntaggedBadge;
