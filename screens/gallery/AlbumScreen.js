import React, { useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Header, SubTitle } from '../components';
import { checkCameraRollPermission } from '../../utils/permissions';
import AlbumList from './galleryComponents/AlbumList';

const AlbumScreen = ({ navigation }) => {

    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        checkGalleryPermission();
    }, []);

    /**
     * fn to check for cameraroll/gallery permissions
     * if permissions granted setState, else navigate to GalleryPermissionScreen
     */

    const checkGalleryPermission = async () => {
        const result = await checkCameraRollPermission();

        if (result === 'granted' || result === 'limited')
        {
            setHasPermission(true);
        }
        else
        {
            navigation.navigate('PERMISSION', {
                screen: 'GALLERY_PERMISSION'
            });
        }
    }

    return (
        <>
            <Header
                leftContent={
                    <Pressable
                        onPress={() => { navigation.goBack(); }}
                    >
                        <Icon
                            name="chevron-back-outline"
                            size={24}
                            color="white"
                        />
                    </Pressable>
                }
                centerContent={
                    <SubTitle color="white">Album</SubTitle>
                }
            />
            {
                hasPermission && (
                    <View style={{ flex: 1 }}>
                        <AlbumList
                            navigation={navigation}
                        />
                    </View>
                )
            }
        </>
    );
}

export default AlbumScreen;
