import React, {useState, useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {checkValidToken} from '../reducers/auth_reducer';

import AuthStack from './AuthStack';
import TabRoutes from './TabRoutes';
import PermissionStack from './PermissionStack';
import {GalleryScreen, NewUpdateScreen, SettingScreen} from '../screens';
import AddTagScreen from '../screens/addTag/AddTagScreen';
import MyUploads from '../screens/userStats/userComponents/MyUploads';

const Stack = createNativeStackNavigator();

/**
 * Root navigator — decides auth vs app tree.
 *
 * Auth bootstrap uses redux-persist as single source of truth:
 * - PersistGate rehydrates auth.token from persisted Redux state
 * - If a token exists after rehydration, we validate it with the backend
 * - No direct AsyncStorage reads — redux-persist owns auth persistence
 */
const MainRoutes = () => {
    const dispatch = useDispatch();
    const [isValidating, setIsValidating] = useState(true);
    const token = useSelector(state => state.auth.token);

    // Validate persisted token once on mount (after redux-persist rehydration).
    // Does NOT depend on `token` — a fresh login already validates via fetchUser,
    // so re-running checkValidToken when the token changes is redundant and slow.
    useEffect(() => {
        (async () => {
            if (token) {
                await dispatch(checkValidToken(token));
            }
            setIsValidating(false);
        })();
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isValidating) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{headerShown: false, contentStyle: {backgroundColor: 'white'}}}>
            {token === null ? (
                <Stack.Screen name="AUTH_HOME" component={AuthStack} />
            ) : (
                <>
                    <Stack.Screen name="APP" component={TabRoutes} />
                    {/* Standard stack push — core workflow / destination screens */}
                    <Stack.Screen name="ADD_TAGS" component={AddTagScreen} options={{headerShown: false}} />
                    <Stack.Screen name="SETTING" component={SettingScreen} options={{headerShown: false}} />
                    <Stack.Screen name="MY_UPLOADS" component={MyUploads} options={{headerShown: false}} />
                    {/* fullScreenModal — unchanged, these are genuinely modal/interruptive */}
                    <Stack.Screen name="ALBUM" component={GalleryScreen} options={{presentation: 'fullScreenModal', gestureEnabled: false}} />
                    <Stack.Screen name="PERMISSION" component={PermissionStack} options={{presentation: 'fullScreenModal', gestureEnabled: false}} />
                    <Stack.Screen name="UPDATE" component={NewUpdateScreen} options={{presentation: 'fullScreenModal', gestureEnabled: false}} />
                </>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default MainRoutes;
