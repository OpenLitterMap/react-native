import React, { Component } from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { Text, TouchableHighlight } from 'react-native';
import { TransText } from 'react-native-translation';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import DeviceInfo from 'react-native-device-info';
import { Body, Caption, Colors } from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Tags not being deleted when using PureComponent
class LitterTags extends Component {
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
                            onPress={this.removeTag.bind(this, category, tag)}>
                            <View style={styles.card}>
                                <Caption
                                    dictionary={`${
                                        this.props.lang
                                    }.litter.categories.${category}`}
                                />
                                <View style={{ flexDirection: 'row' }}>
                                    <Body
                                        dictionary={`${
                                            this.props.lang
                                        }.litter.${category}.${tag}`}
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
     * Loop over each category, and loop over each item in each category
     */
    render() {
        return (
            <View
                style={{
                    // height: 60,
                    width: SCREEN_WIDTH
                }}>
                <ScrollView
                    bounces={false}
                    horizontal={true}
                    style={styles.innerTagsContainer}
                    keyboardShouldPersistTaps="handled"
                    ref={ref => {
                        this.scrollview_ref = ref;
                    }}>
                    {this.renderTags()}
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    aTagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        // top: SCREEN_HEIGHT * .175,
        bottom: SCREEN_HEIGHT * 0.25,
        zIndex: 5
        //backgroundColor: 'yellow',
    },
    androidTagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.255,
        left: SCREEN_WIDTH * 0.01
    },
    card: {
        backgroundColor: 'white',
        borderWidth: 1,
        padding: 10,
        margin: 10,
        borderRadius: 12,
        borderColor: Colors.muted
    },
    category: {
        position: 'absolute',
        left: 5,
        top: 5,
        color: '#636360'
    },
    item: {
        fontSize: SCREEN_HEIGHT * 0.02
    },

    // iPhone 11
    iTagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.635,
        marginLeft: SCREEN_WIDTH * 0.01
    },
    iTagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.33,
        marginLeft: SCREEN_WIDTH * 0.01,
        zIndex: 1
    },

    // iPhone 11 Pro
    iPhone11ProTagsContainerKeyboardOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.325,
        marginLeft: SCREEN_WIDTH * 0.01,
        zIndex: 1
    },
    iPhone11ProTagsContainerKeyboardClosed: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.63,
        marginLeft: SCREEN_WIDTH * 0.01
    },

    // iPhone 8, iPhone 8 Plus
    tagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.595, // just below 6 to give marginBottom
        left: SCREEN_WIDTH * 0.01
    },
    tagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.295,
        left: SCREEN_WIDTH * 0.01,
        zIndex: 1
    },
    val: {
        fontSize: SCREEN_HEIGHT * 0.02
    }
});

const mapStateToProps = state => {
    return {
        item: state.litter.item,
        items: state.litter.items
    };
};
export default connect(
    mapStateToProps,
    actions
)(LitterTags);
