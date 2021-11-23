import React, { PureComponent } from 'react';
import {
    Dimensions,
    Image,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
    Pressable
} from 'react-native';
import { TransText } from 'react-native-translation';
import { Card } from 'react-native-elements';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import { Body, Colors } from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

import DeviceInfo from 'react-native-device-info';

class LitterCategories extends PureComponent {
    /**
     * Change Category
     *
     * litter_actions, litter_reducer
     */
    changeCategory(id) {
        this.props.changeCategory(id);

        this.callback();
    }

    /**
     * Send callback to the parent method to trigger that a category was clicked
     *
     * This is needed for Android devices to close the keyboard
     */
    callback = () => {
        this.props.callback();
    };

    /**
     * Compute the style based on device type
     */
    computeStyle() {
        if (Platform.OS === 'android') return styles.container;

        // if "iPhone 10+", return 17% card height
        const x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.biggerContainer;

        return styles.container;
    }

    /**
     * Each category to display
     */
    renderCategory(category) {
        return (
            <Pressable
                onPress={this.changeCategory.bind(this, category.title)}
                key={category.id}
                underlayColor="transparent">
                <View
                    style={[
                        styles.card,
                        category.title === this.props.category.title &&
                            styles.selectedCard
                    ]}>
                    <Image source={category.path} style={styles.image} />
                    <Body
                        dictionary={`${this.props.lang}.litter.categories.${
                            category.title
                        }`}
                    />
                </View>
            </Pressable>
        );
    }

    /**
     * The list of categories
     */
    render() {
        return (
            <View style={this.computeStyle()}>
                <SafeAreaView>
                    <FlatList
                        showsHorizontalScrollIndicator={false}
                        data={this.props.categories}
                        horizontal={true}
                        renderItem={({ item }) => this.renderCategory(item)}
                        keyExtractor={category => category.title}
                        keyboardShouldPersistTaps="handled"
                    />
                </SafeAreaView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    biggerContainer: {
        height: SCREEN_HEIGHT * 0.17,
        position: 'absolute',
        zIndex: 1
    },
    card: {
        backgroundColor: Colors.white,
        height: 100,
        minWidth: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.white,
        padding: 8
    },
    container: {
        height: SCREEN_HEIGHT * 0.125,
        position: 'absolute',
        zIndex: 1
    },
    selectedCard: {
        backgroundColor: Colors.accentLight,
        borderColor: Colors.accent
    },
    category: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6
    },
    categoryPanel: {
        flexDirection: 'row'
    },
    image: {
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.05,
        resizeMode: 'contain',
        width: SCREEN_WIDTH * 0.09
    },
    text: {
        fontSize: SCREEN_HEIGHT * 0.02
    }
});

export default connect(
    null,
    actions
)(LitterCategories);
