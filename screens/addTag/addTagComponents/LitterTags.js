import React, {Component, createRef} from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {Body, Caption, Colors} from '../../components';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Tags not being deleted when using PureComponent
class LitterTags extends Component {
    constructor(props) {
        super(props);

        this.scrollRef = createRef();
    }

    /**
     * Display a card for each tag
     */
    renderTags() {
        if (this.props.tags) {
            return Object.keys(this.props.tags).map(category => {
                return Object.keys(this.props.tags[category]).map(tag => {
                    const value = this.props.tags[category][tag];

                    return (
                        <Pressable
                            key={tag}
                            onPress={this.removeTag.bind(this, category, tag)}
                            onLayout={event => this.scrollTo(event)}>
                            <View style={styles.card}>
                                <Caption
                                    dictionary={`${this.props.lang}.litter.categories.${category}`}
                                />
                                <View style={{flexDirection: 'row'}}>
                                    <Body
                                        dictionary={`${this.props.lang}.litter.${category}.${tag}`}
                                    />
                                    <Body>&nbsp; ({value})</Body>
                                </View>
                            </View>
                        </Pressable>
                    );
                });
            });
        }
    }

    /**
     * Remove a tag from a category,
     *
     * From a specific image.
     */
    removeTag(category, tag) {
        const currentIndex = this.props.swiperIndex;
        this.props.removeTagFromImage({
            category,
            tag,
            currentIndex
        });
    }

    /**
     * fn to render custom tags
     * Array<string> customTags is present in image object
     */

    renderCustomTags() {
        if (this.props.customTags) {
            return this.props.customTags.map((customTag, index) => {
                return (
                    <Pressable
                        key={customTag}
                        onPress={() =>
                            this.props.removeCustomTagFromImage({
                                tagIndex: index,
                                currentIndex: this.props.swiperIndex
                            })
                        }
                        onLayout={event => this.scrollTo(event)}>
                        <View style={styles.card}>
                            <Caption>Custom Tag</Caption>

                            <Body>{customTag}</Body>
                        </View>
                    </Pressable>
                );
            });
        }
    }

    /**
     * fn to scroll scrollview to location of the new tag
     */
    scrollTo(event) {
        const layout = event.nativeEvent.layout;

        this.scrollRef.current.scrollTo({
            x: layout.x,
            y: layout.y,
            animated: true
        });
    }

    /**
     * Loop over each category, and loop over each item in each category
     */
    render() {
        return (
            <View
                style={{
                    width: SCREEN_WIDTH
                }}>
                <ScrollView
                    contentContainerStyle={{
                        paddingLeft: 20,
                        marginBottom: 10
                    }}
                    ref={this.scrollRef}
                    bounces={false}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}>
                    {this.renderCustomTags()}
                    {this.renderTags()}
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderWidth: 1,
        padding: 10,
        marginRight: 10,
        borderRadius: 12,
        borderColor: Colors.muted
    }
});

const mapStateToProps = state => {
    return {
        item: state.litter.item,
        items: state.litter.items
    };
};
export default connect(mapStateToProps, actions)(LitterTags);
