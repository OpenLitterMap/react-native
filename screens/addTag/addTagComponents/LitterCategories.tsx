import React, {PureComponent} from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import * as actions from '../../../actions';
import {connect} from 'react-redux';
import {Body, Colors} from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Category {
    id: string;
    title: string;
    path: any; // Replace 'any' with the type of 'category.path'
}

interface Props {
    categories: Category[];
    category: Category;
    lang: string;
    changeCategory: (id: string) => void;
}

class LitterCategories extends PureComponent<Props> {
    /**
     * Change Category
     *
     * litter_actions, litter_reducer
     */
    changeCategory(id: string) {
        this.props.changeCategory(id);
    }

    /**
     * Each category to display
     */
    renderCategory(category: Category) {
        const cardStyle = Platform.select({
            ios: styles.cardiOS,
            android: styles.cardAndroid
        });

        return (
            <Pressable
                onPress={this.changeCategory.bind(this, category.title)}
                key={category.id}>
                <View
                    style={[
                        cardStyle,
                        category.title === this.props.category.title &&
                            styles.selectedCard
                    ]}>
                    <Image source={category.path} style={styles.image} />
                    <Body
                        color={
                            category.title === this.props.category.title
                                ? 'text'
                                : 'muted'
                        }
                        dictionary={`${this.props.lang}.litter.categories.${category.title}`}
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
            <View style={{marginVertical: 20}}>
                <FlatList
                    contentContainerStyle={{paddingHorizontal: 10}}
                    showsHorizontalScrollIndicator={false}
                    data={this.props.categories}
                    horizontal={true}
                    renderItem={({item}) => this.renderCategory(item)}
                    keyExtractor={category => category.title}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    cardiOS: {
        height: SCREEN_HEIGHT * 0.085,
        minWidth: SCREEN_WIDTH * 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: 12,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.accentLight,
        backgroundColor: Colors.white
    },
    cardAndroid: {
        height: SCREEN_HEIGHT * 0.1,
        minWidth: SCREEN_WIDTH * 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: 12,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.accentLight,
        backgroundColor: Colors.white
    },
    selectedCard: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accentLight
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

export default connect(null, actions)(LitterCategories);
