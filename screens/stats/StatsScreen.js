import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Header, Title, Colors } from '../components';
import Icon from 'react-native-vector-icons/Ionicons';

class StatsScreen extends Component {
    render() {
        return (
            <>
                <Header
                    leftContent={<Title>Stats</Title>}
                    rightContent={
                        <Icon
                            name="ios-share-outline"
                            size={24}
                            color={Colors.text}
                        />
                    }
                />
                <View style={styles.container}>
                    <Text> Stats screen </Text>
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default StatsScreen;
