import { StyleSheet } from 'react-native';
import React from 'react';
import TeamListCard from './TeamListCard';

const TopTeamsList = ({ topTeams }) => {
    return (
        <>
            {topTeams.map((team, index) => (
                <TeamListCard
                    team={team}
                    key={`${team.name}${index}`}
                    index={index}
                />
            ))}
        </>
    );
};

export default TopTeamsList;

const styles = StyleSheet.create({});
