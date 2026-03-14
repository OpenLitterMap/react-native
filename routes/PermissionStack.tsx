import React, { FC } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CameraPermissionScreen, GalleryPermissionScreen } from '../screens';

type PermissionStackParamList = {
    GalleryPermissionScreen: any;
    CameraPermissionScreen: any;
}

const Stack = createNativeStackNavigator<PermissionStackParamList>();

const PermissionStack: FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* @ts-ignore */}
            <Stack.Screen name="GALLERY_PERMISSION" component={GalleryPermissionScreen} />
            {/* @ts-ignore */}
            <Stack.Screen name="CAMERA_PERMISSION" component={CameraPermissionScreen} />
        </Stack.Navigator>
    );
};

export default PermissionStack;
