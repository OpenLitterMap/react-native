import React from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { Body } from '../../components';
const medals = {
    gold: require('../../../assets/icons/gold-medal.png'),
    silver: require('../../../assets/icons/silver-medal.png'),
    bronze: require('../../../assets/icons/bronze-medal.png')
};

const RankingMedal = ({ index }) => {
    let medalSource;
    switch (index) {
        case 0:
            medalSource = medals.gold;
            break;
        case 1:
            medalSource = medals.silver;
            break;
        case 2:
            medalSource = medals.bronze;
            break;

        default:
            break;
    }
    return (
        <>
            {medalSource ? (
                <Image
                    source={medalSource}
                    style={styles.container}
                    resizeMethod="resize"
                    resizeMode="contain"
                />
            ) : (
                <View style={[styles.container]}>
                    <Body style={{ textAlign: 'center' }}>{index + 1}</Body>
                </View>
            )}
        </>
    );
};

export default RankingMedal;

const styles = StyleSheet.create({
    container: { height: 24, width: 24 }
});
