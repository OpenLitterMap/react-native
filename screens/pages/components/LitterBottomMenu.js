import React, { PureComponent } from 'react';
import {
    Dimensions,
    Platform,
    Switch,
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import * as actions from '../../../actions';

import DeviceInfo from 'react-native-device-info';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

/********************
 *                 *
 *  DEPRECATED  !  *
 *                 *
 ********************/
class LitterBottomMenu extends PureComponent {

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
     * Text to return in the alert when switch pressed
     */
    _getSwitchTextValue = () => {
        return this.props.presence ? 'Removed' : 'Remaining';
    };

    /**
     * The switch has been pressed
     * @toggle presence (Picked up, still there)
     */
    _handleToggleSwitch = async () => {
        await this.props.toggleSwitch();

        const A = 'The Litter has been picked up!';
        const B = 'The Litter is still there!';

        return this.props.presence ? alert(A) : alert(B);
    };

    /**
     * Modal to show total tags
     */
    _showCurrentLitter ()
    {
        this.props.showAllTags(true);
        this.props.toggleCollectionModal();
    };

    /**
     *
     * iOS X+ needs bigger space (not perfect and needs another look)
     *
     */
    _computeBottomContainer ()
    {
        if (Platform.OS == 'android') return styles.biggerContainer;

        // if "iPhone 10+", return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.container;

        return styles.biggerContainer;
    }

    render ()
    {
        return (
            <View style={this._computeBottomContainer()}>
                {/* Close Modal & Cancel Selection */}
                <TouchableHighlight
                    onPress={this.closeLitterPicker.bind(this)}
                    style={styles.icon}
                    disabled={this._checkForPhotos}
                ><Icon color="red" name="close" size={SCREEN_HEIGHT * 0.05} />
                </TouchableHighlight>
                {/* Switch */}
                <View style={styles.icon}>
                    {/* Todo - check for photos */}
                    <Switch
                        onValueChange={this._handleToggleSwitch}
                        value={this.props.presence}
                        disabled={this._checkForPhotos}
                    />
                </View>
                {/* Show Current Litter */}
                <TouchableHighlight
                    onPress={this._showCurrentLitter.bind(this)}
                    style={styles.icon}
                    disabled={this._checkForPhotos}
                ><Icon color="blue" name="list" size={SCREEN_HEIGHT * 0.05} />
                </TouchableHighlight>
                {/* Total Litter Count */}
                <View style={styles.icon}>
                    <Text style={{ color: 'black', fontSize: SCREEN_HEIGHT * 0.02 }}>
                        {this.props.totalLitterCount}
                    </Text>
                </View>
            </View>
        );
    }
}

const styles = {
    biggerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.07,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.05,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH * 0.25,
    }
}

export default connect(null, actions)(LitterBottomMenu);
