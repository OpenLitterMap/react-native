import React, { PureComponent } from 'react'
import {
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableHighlight,
    View
} from 'react-native'

import DeviceInfo from 'react-native-device-info'
import { connect } from 'react-redux'
import * as actions from '../../../actions'
import { Icon } from 'react-native-elements'

const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

class LitterBottomSearch extends PureComponent {

    /**
     * Constructor
     */
    constructor (props)
    {
        super (props);

        this.state = {
            text: ''
        };
    }

    /**
     * Clear text input when keyboard has been closed
     */
    UNSAFE_componentWillReceiveProps (props)
    {
        if (props['keyboardOpen'] == false) this.setState({ text: '' });
    }

    /**
     * A tag has been selected
     */
    addTag (tag)
    {
        // update selected tag to execute scrollTo
        this.props.changeItem(tag.item);

        this.props.tagLitter({
            category: tag.cat,
            title: tag.item
        });
    }

    /**
     *
     */
    clear ()
    {
        this.setState({ text: '' });
    }

    /**
     * Close the litter picker and go back to the gallery screen
     */
    closeLitterPicker ()
    {
        // litter_reducer
        this.props.resetLitterObject();
        // shared_reducer
        this.props.closeLitterModal();
    };

    /**
     * iOS X+ needs bigger space (not perfect and needs another look)
     */
    _container ()
    {
        if (this.props.keyboardOpen)
        {
            return Platform.os === 'ios' ? styles.openContaineriOS : styles.openContainerAndroid;
        }

        // keyboard closed
        if (Platform.OS == 'android')
        {
            return styles.closedBottomContainer;
        }

        // if "iPhone 10+", return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.container;

        // iPhone 5,6,7,8
        return styles.closedBottomContainer;
    }

    /**
     *
     */
    filterStyle ()
    {
        return this.props.keyboardOpen ? styles.filterOpen : styles.filter;
    }

    /**
     * Get text value for the switch
     */
    _getSwitchTextValue = () => {
        return this.props.presence ? 'Removed' : 'Remaining';
    };

    /**
     * The switch has been pressed
     */
    handleToggleSwitch = async () => {
        await this.props.toggleSwitch();

        const A = 'The Litter has been picked up!';
        const B = 'The Litter is still there!';

        return this.props.presence ? alert(A) : alert(B);
    };

    /**
     * Render a suggested tag
     */
    renderTag = ({ item }) => {
        return (
            <TouchableOpacity style={styles.tag} onPress={this.addTag.bind(this, item)}>
                <Text style={styles.category}>{item.cat}</Text>
                <Text style={styles.item}>{item.item}</Text>
            </TouchableOpacity>
        );
    }

    /**
     * Update text
     */
    updateText (text)
    {
        this.setState({ text });
        this.props.suggestTags(text);
    }

    /**
     * Render function
     *
     * 0 height on iOS
     * was 33% height on Android
     * now 0 height on Android
     */
    render ()
    {
        return (
            <KeyboardAvoidingView
                style={{
                    position: 'absolute',
                    bottom: 0, // was this.props.bottomHeight
                    left: 0,
                    right: 0,
                    height: this.props.height,
                }}
                behavior={'padding'}
            >
                <View style={this._container()}>

                    <TouchableHighlight
                        onPress={this.closeLitterPicker.bind(this)}
                        style={this.props.keyboardOpen ? styles.hide : styles.icon}
                        disabled={this._checkForPhotos}
                    ><Icon color="red" name="close" size={SCREEN_HEIGHT * 0.05} />
                    </TouchableHighlight>

                    <TextInput
                        style={this.filterStyle()}
                        placeholder="Type to suggest tags"
                        placeholderTextColor="#ccc"
                        onChangeText={(text) => this.updateText(text)}
                        selectionColor="black"
                        blurOnSubmit={false}
                        value={this.state.text}
                    />

                    <View style={this.props.keyboardOpen ? styles.hide : styles.icon}>
                        {/*disabled={this._checkForPhotos}*/}
                        <Switch
                            onValueChange={this.handleToggleSwitch}
                            value={this.props.presence}
                        />
                    </View>

                    { this.props.keyboardOpen &&
                        <View style={styles.tagsOuterContainer}>
                            <Text style={styles.suggest}>Suggested tags: {this.props.suggestedTags.length}</Text>

                            <View style={styles.tagsInnerContainer}>
                                <FlatList
                                    data={this.props.suggestedTags}
                                    horizontal={true}
                                    renderItem={this.renderTag}
                                    keyExtractor={( {item}, index) => item + index}
                                    keyboardShouldPersistTaps="handled"
                                />
                            </View>
                        </View>
                    }
                </View>
            </KeyboardAvoidingView>
        );
    }
}

const styles = {

    category: {
        marginBottom: SCREEN_HEIGHT * 0.01
    },
    container: {
        position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.05,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH * 1
    },
    closedBottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.07,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH * 1,
    },
    openContainerAndroid: {
        position: 'absolute',
        // top: SCREEN_HEIGHT * 0.1,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.25,
    },
    openContaineriOS: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.2,
    },
    filter: {
        alignItems: 'center',
        borderRadius: 50,
        borderColor: 'gray',
        borderWidth: 1,
        padding: SCREEN_WIDTH * 0.001, // works better on android
        // height: SCREEN_HEIGHT * 0.045, // works better on iOS
        textAlign: 'center',
        width: '50%',
    },
    filterOpen: {
        borderRadius: 50,
        borderColor: 'gray',
        borderWidth: 1,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.045,
        paddingTop: 0, // android
        paddingBottom: 0, // android
        paddingLeft: SCREEN_WIDTH * 0.05,
        marginTop: SCREEN_HEIGHT * 0.01,
        marginLeft: SCREEN_WIDTH * 0.25,
        marginRight: SCREEN_WIDTH * 0.25,
        marginBottom: SCREEN_HEIGHT * 0.01,
        width: '50%',
    },
    hide: {
        display: 'none'
    },
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH * 0.25,
    },
    item: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    suggest: {
        marginBottom: SCREEN_HEIGHT * 0.01
    },
    tag: {
        padding: SCREEN_WIDTH * 0.02,
        backgroundColor: 'white',
        borderRadius: 10,
        marginRight: SCREEN_WIDTH * 0.02,
        borderWidth: 1
    },
    tagsOuterContainer: {
        marginLeft: SCREEN_WIDTH * 0.02,
        marginRight: SCREEN_WIDTH * 0.02,
        paddingBottom: SCREEN_HEIGHT * 0.02,
    },
    tagsInnerContainer: {
        flexDirection: 'row'
    }
}

export default connect(null, actions)(LitterBottomSearch);
