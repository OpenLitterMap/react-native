import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from '../../../utils/dayjs';
import { Body, Caption, SubTitle } from '../../components';
import RankingMedal from './RankingMedal';

const MemberCard = ({ data, teamId, index }) => {

    const {t} = useTranslation();

    const isActiveTeam = teamId === data?.team?.id;
    const lastActivity = data?.pivot?.updated_at
        ? dayjs(data?.pivot?.updated_at).fromNow()
        : '-';

    return (
        <View
            style={styles.memberCardContainer}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{flexDirection: 'row'}}>
                    <RankingMedal index={index} />

                    <View style={{marginLeft: 10}}>
                        {data?.name ? (
                            <>
                                <SubTitle>{data.name}</SubTitle>
                                {data.username && <Caption>{data.username}</Caption>}
                            </>
                        ) : (
                            <SubTitle>{data?.username || 'Anonymous'}</SubTitle>
                        )}
                    </View>
                </View>
                <Body color={isActiveTeam ? 'accent' : 'warn'}>
                    {isActiveTeam ? t('Active') : t('Inactive')}
                </Body>
            </View>
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Body>{data?.pivot?.total_photos}</Body>
                    <Caption>PHOTOS</Caption>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                    <Body>{data?.pivot?.total_litter}</Body>
                    <Caption>LITTER</Caption>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Body>{lastActivity}</Body>
                    <Caption>LAST ACTIVITY</Caption>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    memberCardContainer: {
        borderWidth: 1,
        borderColor: '#eee',
        padding: 8,
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: 'white'
    }
});

export default MemberCard;
