import React, { PureComponent } from 'react';
import {
    Dimensions,
    Image,
    FlatList,
    Platform,
    SafeAreaView,
    TouchableHighlight,
    View
} from 'react-native';
import { TransText } from "react-native-translation";
import { Card } from 'react-native-elements';
import * as actions from '../../../actions';
import { connect } from 'react-redux';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

import DeviceInfo from 'react-native-device-info';

class LitterCategories extends PureComponent {

    /**
     * Change Category
     *
     * litter_actions, litter_reducer
     */
    changeCategory (id)
    {
        this.props.changeCategory(id);
    }

    /**
     * Compute the style based on device type
     */
    computeStyle ()
    {
        if (Platform.OS === 'android') return styles.container;

        // if "iPhone 10+", return 17% card height
        const x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.biggerContainer;

        return styles.container;
    }

    /**
     * Each category to display
     */
    renderCategory (category)
    {
        return (
            <TouchableHighlight
                onPress={this.changeCategory.bind(this, category.title)}
                key={category.id}
                underlayColor='transparent'
            >
                <Card
                    containerStyle={[ styles.card, category.title === this.props.category.title ? styles.selectedCard : '' ]}
                    style={styles.category}
                    wrapperStyle={{ alignItems: 'center', justifyContent: 'center' }}
                >
                    <Image source={category.path} style={styles.image} />
                    <TransText
                        style={styles.text}
                        key={category.id}
                        dictionary={`${this.props.lang}.litter.categories.${category.title}`}
                    />
                </Card>
            </TouchableHighlight>
        );
    }

    /**
     * The list of categories
     */
    render ()
    {
        return (
            <View style={this.computeStyle()}>
                <SafeAreaView>
                    <FlatList
                        data={this.props.categories}
                        horizontal={true}
                        renderItem={({ item }) => (
                            this.renderCategory(item)
                        )}
                        keyExtractor={category => category.title}
                        keyboardShouldPersistTaps="handled"
                    />
                </SafeAreaView>
            </View>
        );
    }
}

const styles = {
    biggerContainer: {
        height: SCREEN_HEIGHT * 0.17,
        position: 'absolute',
        zIndex: 1
    },
    card: {
        marginBottom: 20,
        borderRadius: 6,
        paddingTop: 10
    },
    container: {
        height: SCREEN_HEIGHT * 0.125,
        position: 'absolute',
        zIndex: 1
    },
    selectedCard: {
        backgroundColor: '#0be881'
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
        width: SCREEN_WIDTH * 0.09,
    },
    text: {
        fontSize: SCREEN_HEIGHT * 0.02
    }
};

export default connect(null, actions)(LitterCategories);
