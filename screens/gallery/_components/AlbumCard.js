import React, { Component } from 'react';
import { Text, StyleSheet, View, Pressable, Image } from 'react-native';
import { Colors } from '../../components';

export default class AlbumCard extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let { albumName, thumbnail, counter, navigation } = this.props;
        // console.log(navigation);
        return (
            <Pressable
                style={[styles.base]}
                onPress={() => navigation.navigate('GALLERY')}>
                <Image source={{ uri: thumbnail }} style={styles.thumb} />
                <View style={styles.textWrapper}>
                    <Text style={styles.name}>{albumName}</Text>
                    <Text style={styles.counter}>{`${counter} ${
                        counter && counter > 1 ? 'Photos' : 'Photo'
                    }`}</Text>
                </View>
            </Pressable>
        );
    }
}

const styles = StyleSheet.create({
    base: {
        // flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 30,
        marginTop: 20,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: Colors.muted
    },
    thumb: {
        width: 70,
        height: 70,
        resizeMode: 'cover',
        borderRadius: 8
    },
    textWrapper: {
        marginLeft: 10
    },
    name: {
        fontSize: 18,
        fontWeight: '500'
    },
    counter: {
        fontSize: 12
    }
});
