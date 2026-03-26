import {
    View,
    Pressable,
    Image,
    StyleSheet,
    Text,
    useWindowDimensions
} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../components';

const AnimatedImage = ({ image, isImageGeotagged, selected, onPress, columns = 3 }) => {
    const { width } = useWindowDimensions();
    const gridSize = width / columns - 2;

    return (
        <Pressable key={image.uri} onPress={onPress}>
            <View style={[styles.grid, {width: gridSize, height: gridSize}]}>
                <Image
                    source={{ uri: image.uri }}
                    style={[
                        styles.imageStyle,
                        !isImageGeotagged && { opacity: 0.4 }
                    ]}
                />
            </View>

            {selected && (
                <>
                    {/* overlay */}
                    <View
                        style={[
                            styles.grid,
                            {
                                width: gridSize,
                                height: gridSize,
                                position: 'absolute',
                                backgroundColor: Colors.muted,
                                opacity: 0.3
                            }
                        ]}
                    />
                    {/* Selected check mark icon */}
                    <View style={[styles.selectedIcon, styles.iconBorderStyle]}>
                        <Icon
                            name="checkmark-outline"
                            size={20}
                            color="white"
                        />
                    </View>
                </>
            )}

            {isImageGeotagged ? (
                <View style={[styles.geotaggedIcon]}>
                    <Text>📍</Text>
                </View>
            ) : (
                <View style={styles.noGpsIcon}>
                    <Icon
                        name="location-outline"
                        size={16}
                        color="#cc0000"
                    />
                    <View style={styles.strikethrough} />
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    grid: {
        margin: 1
    },
    geotaggedIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        right: 5,
        bottom: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    noGpsIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        right: 5,
        bottom: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    strikethrough: {
        position: 'absolute',
        width: 20,
        height: 2,
        backgroundColor: '#cc0000',
        transform: [{ rotate: '45deg' }]
    },
    selectedIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: '#0984e3',
        right: 35,
        bottom: 5,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconBorderStyle: {
        borderWidth: 1,
        borderColor: Colors.accentLight
    },
    imageStyle: {
        width: '100%',
        height: '100%'
    }
});

export default AnimatedImage;
