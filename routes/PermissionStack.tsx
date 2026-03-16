import React, { FC } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GalleryPermissionScreen } from '../screens';

type PermissionStackParamList = {
    GalleryPermissionScreen: any;
}

const Stack = createNativeStackNavigator<PermissionStackParamList>();

const PermissionStack: FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* @ts-ignore */}
            <Stack.Screen name="GALLERY_PERMISSION" component={GalleryPermissionScreen} />
        </Stack.Navigator>
    );
};

export default PermissionStack;
