import { StyleSheet, View } from 'react-native';
import React from 'react';
import moment from 'moment';
import { Body, Caption, SubTitle } from '../../components';
import RankingMedal from './RankingMedal';

const MemberCard = ({ data, teamId, index }) => {
    const isActiveTeam = teamId === data?.team?.id;
    const lastActivity = data?.pivot?.updated_at
        ? moment(data?.pivot?.updated_at).fromNow()
        : '-';
    return (
        <View
            style={{
                borderWidth: 1,
                borderColor: '#eee',
                padding: 8,
                borderRadius: 8,
                marginBottom: 20,
                backgroundColor: 'white'
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                <View style={{ flexDirection: 'row' }}>
                    <RankingMedal index={index} />
                    <View style={{ marginLeft: 10 }}>
                        <SubTitle>{data?.name || 'Anonymous'}</SubTitle>
                        <Caption>{data?.username}</Caption>
                    </View>
                </View>
                <Body color={isActiveTeam ? 'accent' : 'warn'}>
                    {isActiveTeam ? 'Active' : 'Inactive'}
                </Body>
            </View>
            <View
                style={{
                    marginTop: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Body>{data?.pivot?.total_photos}</Body>
                    <Caption>PHOTOS</Caption>
                </View>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Body>{data?.pivot?.total_litter}</Body>
                    <Caption>LITTER</Caption>
                </View>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Body>{lastActivity}</Body>
                    <Caption>LAST ACTIVITY</Caption>
                </View>
            </View>
        </View>
    );
};

export default MemberCard;

const styles = StyleSheet.create({});
