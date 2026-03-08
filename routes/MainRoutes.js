import React, { useState, useEffect, FC } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { checkValidToken } from '../reducers/auth_reducer';

import AuthStack from './AuthStack';
import TabRoutes from './TabRoutes';
import PermissionStack from './PermissionStack';
import { GalleryScreen, NewUpdateScreen,  SettingScreen } from '../screens';
import AddTagScreen from '../screens/addTag/AddTagScreen';
import MyUploads from "../screens/userStats/userComponents/MyUploads";

const Stack = createStackNavigator();

const MainRoutes = () => {

    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const token = useSelector(state => state.auth.token);

    useEffect(() => {
        (async () => {
            const jwt = await AsyncStorage.getItem('jwt');

            if (jwt) {
                await dispatch(checkValidToken(jwt));
            }

            setIsLoading(false);
        })();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator />
            </View>
        );
    } else {
        return (
            <Stack.Navigator
                presentation="modal"
                screenOptions={{ headerShown: false }}
            >
                {token === null ? (
                    <Stack.Screen name="AUTH_HOME" component={AuthStack} />
                ) : (
                    <>
                        <Stack.Screen name="APP" component={TabRoutes} />
                        <Stack.Screen name="PERMISSION" component={PermissionStack} />
                        <Stack.Screen name="ADD_TAGS" component={AddTagScreen} />
                        <Stack.Screen name="ALBUM" component={GalleryScreen} />
                        <Stack.Screen name="SETTING" component={SettingScreen} />
                        <Stack.Screen name="UPDATE" component={NewUpdateScreen} />

                        <Stack.Screen name="MY_UPLOADS" component={MyUploads} />
                    </>
                )}
            </Stack.Navigator>
        );
    }
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default MainRoutes;
