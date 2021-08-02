import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { Body, Caption, Colors } from '../../components';

const RewardCard = () => {
    return (
        <View style={styles.cardContainer}>
            <View style={styles.imagesContainer}>
                <Image
                    source={require('../../../assets/easy.png')}
                    resizeMode="cover"
                    style={styles.imageStyles}
                />
            </View>

            <View style={{ marginLeft: 20 }}>
                <Caption color="accent">3 days ago</Caption>
                <Body>First Littercoin</Body>
            </View>
        </View>
    );
};

const RewardsList = () => {
    return (
        <ScrollView
            horizontal
            style={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}>
            <RewardCard />
            <RewardCard />
        </ScrollView>
    );
};

export default RewardsList;

const styles = StyleSheet.create({
    cardContainer: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: `${Colors.accentLight}`,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20
    },
    imagesContainer: {
        width: 60,
        height: 60,
        padding: 10,
        borderColor: 'pink',
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageStyles: {
        width: 50,
        height: 50
    }
});
