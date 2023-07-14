import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';

class RankingScreen extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Text> Ranking screen </Text>
            </View>
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
export default RankingScreen;
