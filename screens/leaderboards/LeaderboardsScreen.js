import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Header, Title} from '../components';
import {flags} from '../../assets/icons/flags';
import {useDispatch, useSelector} from 'react-redux';
import {getLeaderboardData} from '../../reducers/leaderboards_reducer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const LeaderboardsScreen = () => {
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);
    const [selectedValue, setSelectedValue] = useState('today');

    const [pickerItems, setPickerItems] = useState([
        {label: 'Today', value: 'today', visible: true},
        {label: 'Yesterday', value: 'yesterday', visible: true},
        {label: 'This Month', value: 'this-month', visible: true},
        {label: 'Last Month', value: 'last-month', visible: true},
        {label: 'All Time', value: 'all-time', visible: true}
    ]);

    const paginated = useSelector(state => state.leaderboard.paginated);
    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getLeaderboardData({timeFilter: 'today', page: 1}));

            setLoading(false);
        };

        fetchData();
    }, []);

    const setSelectedValueWrapper = async value => {
        setSelectedValue(value);

        setLoading(true);

        await dispatch(getLeaderboardData({timeFilter: value, page: 1}));

        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <>
            <Header
                leftContent={<Title color="white" dictionary={'Leaderboard'} />}
            />

            <View style={styles.container}>
                <Text style={styles.label}>Select Timeframe:</Text>
                <Picker
                    selectedValue={selectedValue}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    onValueChange={itemValue =>
                        setSelectedValueWrapper(itemValue)
                    }
                    mode="dropdown">
                    {pickerItems.map(
                        item =>
                            item.visible && (
                                <Picker.Item
                                    key={item.value}
                                    label={item.label}
                                    value={item.value}
                                />
                            )
                    )}
                </Picker>
            </View>

            {!paginated?.users?.length ? (
                <View style={styles.loadingContainer}>
                    <Text>No data found</Text>
                </View>
            ) : (
                <FlatList
                    data={paginated.users}
                    keyExtractor={(user, index) =>
                        `${user.rank}-${user.username || user.name || index}`
                    }
                    renderItem={({item}) => (
                        <View style={styles.row}>
                            <Text style={styles.rank}>{item.rank}</Text>

                            {item.global_flag ? (
                                <Image
                                    source={flags[item.global_flag]}
                                    resizeMethod="auto"
                                    resizeMode="cover"
                                    style={{
                                        height: SCREEN_HEIGHT * 0.02,
                                        width: SCREEN_WIDTH * 0.05
                                    }}
                                />
                            ) : (
                                <View
                                    style={{
                                        height: SCREEN_HEIGHT * 0.02,
                                        width: SCREEN_WIDTH * 0.05
                                    }}
                                />
                            )}

                            <Text style={styles.username}>
                                {item.username || item.name || 'Anon'}
                            </Text>
                            <Text style={styles.xp}>
                                {(item.xp || 0).toLocaleString()} XP
                            </Text>
                        </View>
                    )}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        padding: 10,
        borderRadius: 5,
        marginVertical: 10
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10
    },
    picker: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        height: 50
    },
    pickerItem: {
        backgroundColor: '#f0f0f0',
        height: 50
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    rank: {
        width: 30,
        textAlign: 'center'
    },
    username: {
        flex: 1,
        marginLeft: 10
    },
    xp: {
        marginRight: 10,
        color: 'green'
    }
});

export default LeaderboardsScreen;
