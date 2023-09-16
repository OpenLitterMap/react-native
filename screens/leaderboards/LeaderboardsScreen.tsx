import React, {PureComponent} from 'react';
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
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {Header, Title} from '../components';
import {flags} from '../../assets/icons/flags';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface User {
    global_flag: string;
    name: string;
    rank: number;
    social: any;
    team: string;
    username: string;
    xp: string;
}

interface Flag {
    [key: string]: any;
}

interface PickerItem {
    label: string;
    value: string;
    visible: boolean;
}

interface LeaderboardScreenState {
    loading: boolean;
    flags: Flag;
    pickerItems: PickerItem[];
    selectedValue: string;
}

interface LeaderboardScreenProps {
    lang: string;
    paginated: {
        users: User[];
    };
}

class LeaderboardsScreen extends PureComponent<
    LeaderboardScreenProps,
    LeaderboardScreenState
> {
    constructor(props: LeaderboardScreenProps) {
        super(props);

        this.state = {
            loading: true,
            flags: {},
            pickerItems: [
                {label: 'Today', value: 'today', visible: true},
                {label: 'Yesterday', value: 'yesterday', visible: true},
                {label: 'This Month', value: 'this-month', visible: true},
                {label: 'Last Month', value: 'last-month', visible: true},
                {label: 'All Time', value: 'all-time', visible: true}
            ],
            selectedValue: 'today'
        };
    }

    async componentDidMount() {
        // @ts-ignore
        await this.props.getLeaderboardData('today');

        this.setState({
            flags: flags
        });

        this.setState({
            loading: false
        });
    }

    setSelectedValue = async (value: string) => {
        this.setState({
            selectedValue: value,
            loading: true
        });

        // dispatch
        // @ts-ignore
        await this.props.getLeaderboardData(value);

        this.setState({
            loading: false
        });
    };

    render() {
        if (this.state.loading) {
            return (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <ActivityIndicator />
                </View>
            );
        }

        const {lang, paginated} = this.props;
        const {pickerItems, selectedValue} = this.state;

        return (
            <>
                <Header
                    leftContent={
                        <Title
                            color="white"
                            dictionary={`${lang}.leftpage.leaderboard`}
                        />
                    }
                />

                <View style={styles.container}>
                    <Text style={styles.label}>Select Timeframe:</Text>
                    <Picker
                        selectedValue={selectedValue}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        onValueChange={itemValue =>
                            this.setSelectedValue(itemValue)
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

                <FlatList
                    data={paginated.users}
                    keyExtractor={user =>
                        user.rank + user.username || user.rank + user.name
                    }
                    renderItem={({item}) => (
                        <View style={styles.row}>
                            <Text style={styles.rank}>{item.rank}</Text>
                            <Image
                                source={this.state.flags[item.global_flag]}
                                resizeMethod="auto"
                                resizeMode="cover"
                                style={{
                                    height: SCREEN_HEIGHT * 0.02,
                                    width: SCREEN_WIDTH * 0.05
                                }}
                            />
                            <Text style={styles.username}>
                                {item.username || item.name || 'Anon'}
                            </Text>
                            <Text style={styles.xp}>{item.xp} XP</Text>
                        </View>
                    )}
                />
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        padding: 10,
        borderRadius: 5,
        marginVertical: 10
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

const mapStateToProps = (state: any) => {
    return {
        lang: state.auth.lang,
        paginated: state.leaderboard.paginated
    };
};

export default connect(mapStateToProps, actions)(LeaderboardsScreen);
