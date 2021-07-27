import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';

const Body = ({ children }) => {
    return (
        <View>
            <Text>{children}</Text>
        </View>
    );
};

Body.propTypes = {
    children: PropTypes.node,
    style: PropTypes.object,
    family: PropTypes.string,
    color: PropTypes.string
};

//

export default Body;

const styles = StyleSheet.create({});
