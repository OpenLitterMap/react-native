import React, { Component } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { Header, Title, SubTitle, Caption } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';

class TeamScreen extends Component {
    componentDidMount() {
        this.props.getTopTeams();
    }
    render() {
        return (
            <>
                <Header leftContent={<Title color="white">Teams</Title>} />
                <ScrollView style={styles.container}>
                    <View style={styles.headingRow}>
                        <SubTitle>Top Teams</SubTitle>
                        <Caption color="accent">View All</Caption>
                    </View>
                </ScrollView>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20
    },
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    }
});

const mapStateToProps = state => {
    return {
        topTeams: state.teams.topTeams,
        lang: state.auth.lang
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamScreen);
