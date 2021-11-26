import React, { PureComponent } from 'react';
import { Image, FlatList, StyleSheet, View, Pressable } from 'react-native';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import { Body, Colors } from '../../components';

class LitterCategories extends PureComponent {
    /**
     * Change Category
     *
     * litter_actions, litter_reducer
     */
    changeCategory(id) {
        this.props.changeCategory(id);

        // this.callback();
    }

    /**
     * Each category to display
     */
    renderCategory(category) {
        return (
            <Pressable
                onPress={this.changeCategory.bind(this, category.title)}
                key={category.id}>
                <View
                    style={[
                        styles.card,
                        category.title === this.props.category.title &&
                            styles.selectedCard
                    ]}>
                    <Image source={category.path} style={styles.image} />
                    <Body
                        color="muted"
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
            <View style={{ marginVertical: 20 }}>
                <FlatList
                    showsHorizontalScrollIndicator={false}
                    data={this.props.categories}
                    horizontal={true}
                    renderItem={({ item }) => this.renderCategory(item)}
                    keyExtractor={category => category.title}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    card: {
        height: 100,
        minWidth: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: 12,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.accentLight
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

    image: {
        borderRadius: 6,
        height: 30,
        resizeMode: 'contain',
        width: 30
    }
});

export default connect(
    null,
    actions
)(LitterCategories);
