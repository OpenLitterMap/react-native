import { View, Pressable, Image, Dimensions, StyleSheet } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../components';

const { width } = Dimensions.get('window');

const AnimatedImage = ({ image, isImageGeotagged, selected, onPress }) => {
    /**
     * only press image if its geoTagged
     *
     * run animation and call fn this.props.onPress() which will mark the image as selected
     */
    onImagePress = () => {
        if (isImageGeotagged) {
            onPress();
        }
    };

    return (
        <Pressable key={image.uri} onPress={this.onImagePress}>
            <View style={styles.grid}>
                <Image
                    source={{ uri: image.uri }}
                    style={[styles.imageStyle]}
                />
            </View>

            {selected && (
                <>
                    {/* overlay */}
                    <View
                        style={[
                            styles.grid,
                            {
                                position: 'absolute',
                                backgroundColor: Colors.muted,
                                opacity: 0.3
                            }
                        ]}
                    />
                    {/* Selected check mark icon */}
                    <View style={[styles.selectedIcon, styles.iconBorderStyle]}>
                        <Icon
                            name="ios-checkmark-outline"
                            size={20}
                            color="white"
                        />
                    </View>
                </>
            )}

            {isImageGeotagged && (
                <View style={[styles.geotaggedIcon, styles.iconBorderStyle]}>
                    <Icon name="ios-location-outline" size={16} color="white" />
                </View>
            )}
        </Pressable>
    );
};

export default AnimatedImage;

const styles = StyleSheet.create({
    grid: {
        width: width / 3 - 2,
        height: width / 3 - 2,
        margin: 1
    },
    geotaggedIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: '#0984e3',
        right: 5,
        top: 5,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectedIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: '#0984e3',
        right: 5,
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
