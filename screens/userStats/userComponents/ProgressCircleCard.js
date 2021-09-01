import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import ProgressStatCard from './ProgressStatCard';
import { AnimatedCircle } from '../../components';
const { width } = Dimensions.get('window');

const ProgressCircleCard = ({
    lang,
    level,
    levelPercentage,
    xpRequired,
    totalLittercoin,
    littercoinPercentage
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.circleContainer}>
                <View style={{ position: 'absolute' }}>
                    <AnimatedCircle
                        isValueDisplayed={false}
                        strokeWidth={10}
                        percentage={levelPercentage}
                        color="#e268b3"
                        value={levelPercentage}
                        delay={500}
                        duration={5000}
                        radius={(width - 40) / 4 - 16}
                    />
                </View>

                <View>
                    <AnimatedCircle
                        isValueDisplayed={false}
                        strokeWidth={10}
                        percentage={littercoinPercentage}
                        color="#A46EDA"
                        value={littercoinPercentage}
                        delay={500}
                        duration={5000}
                        radius={(width - 40) / 4}
                    />
                </View>
            </View>

            <View style={{ flexShrink: 1, padding: 10 }}>
                <ProgressStatCard
                    color="#e268b3"
                    value={`${lang}.user.level`}
                    title="Level"
                    tagline={`${xpRequired}XP more to level up`}
                />
                <ProgressStatCard
                    style={{ marginTop: 20 }}
                    color="#A46EDA"
                    value={totalLittercoin}
                    title={`${lang}.user.littercoin`}
                    tagline={`${100 -
                        littercoinPercentage} images more for next littercoin`}
                />
            </View>
        </View>
    );
};

export default ProgressCircleCard;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 20
    },
    circleContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
