import React, { PureComponent } from 'react';
import {Dimensions, Platform, ScrollView, View} from 'react-native';
import {
    Text,
    TouchableHighlight
} from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import DeviceInfo from 'react-native-device-info'

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class LitterTags extends PureComponent {

    /**
     * The tags container is positioned absolutely from the top
     *
     * Some devices need slightly different settings
     *
     * Todo - extract common css and update comment block with styles per device
     */
    _computeTagsContainer ()
    {
        if (Platform.OS === 'android')
        {
            return this.props.keyboardOpen ? styles.aTagsContainerOpen : styles.androidTagsContainer;
        }

        // if iPhone 10+, return 17% card height
        const x = DeviceInfo.getModel().split(' ');

        console.log('tagsContainer', x);

        if (x.includes('X') || parseInt(x[1]) >= 10)
        {
            if (x[1] === "11" && x[2] === 'Pro')
            {
                return this.props.keyboardOpen
                    ? styles.iPhone11ProTagsContainerKeyboardOpen
                    : styles.iPhone11ProTagsContainerKeyboardClosed;
            }

            if (x[1] === "12" && x[2] === "mini")
            {
                return this.props.keyboardOpen
                    ? styles.iPhone11ProTagsContainerKeyboardOpen
                    : styles.iPhone11ProTagsContainerKeyboardClosed;
            }

            // iPhone 11
            return this.props.keyboardOpen
                ? styles.iTagsContainerOpen
                : styles.iTagsContainer;
        }

        // iPhone 8, iPhone 8 Plus
        return (this.props.keyboardOpen && Object.keys(this.props.tags).length > 0)
            ? styles.tagsContainerOpen
            : styles.tagsContainer;
    }

    /**
     * Display a card for each tag
     */
    renderTags ()
    {
        return Object.keys(this.props.tags).map(category => {
            return Object.keys(this.props.tags[category]).map(item => {

                const value = this.props.tags[category][item];

                return (
                    <TouchableHighlight
                        key={item}
                        onPress={this.removeTag.bind(this, category, item)}
                        underlayColor='transparent'
                        onLayout={event => {
                            const layout = event.nativeEvent.layout;

                            // When layout is rendered, save its X-positions to this.props.positions
                            this.props.updateTagXPosition({x: layout.x, item});
                        }}
                    >
                        <View style={styles.card}>
                            <Text style={styles.category}>{category}</Text>
                            <Text style={styles.item}>{item}</Text>
                            <Text style={styles.val}>&nbsp; ({value})</Text>
                        </View>
                    </TouchableHighlight>
                );
            });
        });
    }

    /**
     * Remove a tag
     * @litter_actions
     */
    removeTag (category, item)
    {
        this.props.removeTag({ category, item });
    }

    /**
     * Loop over each category, and loop over each item in each category
     */
    render ()
    {
        return (
            <View
                style={this._computeTagsContainer()}
                key={Object.keys(this.props.positions).length}
                onLayout={event => {
                    this.scrollview_ref.scrollTo({
                        x: this.props.positions[this.props.item],
                        y: 0,
                        animated: true,
                    });
                }}
            >
                <ScrollView
                    bounces={false}
                    horizontal={true}
                    style={styles.innerTagsContainer}
                    keyboardShouldPersistTaps="handled"
                    ref={ref => {
                        this.scrollview_ref = ref;
                    }}
                >
                    {this.renderTags()}
                </ScrollView>
            </View>
        );
    }
}

const styles = {
    aTagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        // top: SCREEN_HEIGHT * .175,
        bottom: SCREEN_HEIGHT * 0.25,
        zIndex: 5,
        // backgroundColor: 'yellow',
    },
    androidTagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.2,
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.2
    },
    card: {
        backgroundColor: "white",
        padding: SCREEN_WIDTH * 0.02,
        borderRadius: 6,
        alignItems: 'center',
        flexDirection: 'row',
        paddingTop: SCREEN_HEIGHT * 0.025,
        height: '100%',
        marginRight: SCREEN_WIDTH * 0.01,
        zIndex: 9999
    },
    category: {
        position: 'absolute',
        left: 5,
        top: 5,
        color: '#636360'
    },
    item: {
        fontSize: SCREEN_HEIGHT * 0.02,
    },

    // iPhone 11
    iTagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * .635,
        marginLeft: SCREEN_WIDTH * 0.01
    },
    iTagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * .33,
        marginLeft: SCREEN_WIDTH * 0.01
    },

    // iPhone 11 Pro
    iPhone11ProTagsContainerKeyboardOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * .325,
        marginLeft: SCREEN_WIDTH * 0.01,
        zIndex: 1
    },
    iPhone11ProTagsContainerKeyboardClosed: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.08,
        position: 'absolute',
        top: SCREEN_HEIGHT * .63,
        marginLeft: SCREEN_WIDTH * 0.01
    },

    // iPhone 8, iPhone 8 Plus
    tagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        top: SCREEN_HEIGHT * .595, // just below 6 to give marginBottom
        left: SCREEN_WIDTH * 0.01
    },
    tagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.1,
        position: 'absolute',
        top: SCREEN_HEIGHT * .295,
        left: SCREEN_WIDTH * 0.01,
        zIndex: 1
    },
    val: {
        fontSize: SCREEN_HEIGHT * 0.02
    }
}

export default connect(null, actions)(LitterTags);
