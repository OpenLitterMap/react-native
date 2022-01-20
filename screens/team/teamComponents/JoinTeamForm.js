import { StyleSheet, Pressable, View, TextInput } from 'react-native';
import React from 'react';
import { Body, CustomTextInput, Colors } from '../../components';

const JoinTeamForm = () => {
    return (
        <>
            <Body>Join team by identifier</Body>

            <TextInput
                style={styles.input}
                placeholder="Enter ID to join a team"
            />
            <Pressable
                onPress={() => this.setState({ showFormType: 'JOIN' })}
                style={[
                    styles.buttonStyle,
                    { backgroundColor: Colors.accent, marginVertical: 40 }
                ]}>
                <Body color="white">JOIN TEAM</Body>
            </Pressable>
        </>
    );
};

export default JoinTeamForm;

const styles = StyleSheet.create({
    input: {
        marginTop: 10,
        padding: 10,
        fontSize: 16,
        letterSpacing: 0.5,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.muted,
        borderRadius: 8,
        color: Colors.text,
        fontFamily: 'Poppins-Regular',
        textAlignVertical: 'top',
        height: 60
    },
    buttonStyle: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 20
    }
});
