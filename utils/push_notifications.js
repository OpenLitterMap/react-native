import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import AsyncStorage from '@react-native-community/async-storage';
import axios from 'axios';

const PUSH_ENDPOINT = 'http://rallycoding.herokuapp.com/api/tokens';

export default async () => {
    let previousToken = await AsyncStorage.getItem('pushToken');
    // console.log("--= Previous Token =--");
    // console.log(previousToken);
    // if(previousToken) {
    //   return;
    // } else {
    //   let { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    //   if (status !== 'granted') {
    //     return;
    //   }
    //
    //   let token = await Notifications.getExponentPushTokenAsync();
    //   await axios.post(PUSH_ENDPOINT, { token: { token } });
    //   AsyncStorage.setItem('pushToken', token);
    // }
};
