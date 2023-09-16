import React, {PureComponent} from 'react';
import MapView, {UrlTile} from 'react-native-maps';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {Platform, SafeAreaView} from 'react-native';

class MapScreen extends PureComponent {
    render() {
        return (
            <SafeAreaView style={{flex: 1}}>
                <MapView
                    mapType={'standard'}
                    provider={null}
                    rotateEnabled={false}
                    style={{flex: 1}}
                    customMapStyle={[
                        {
                            featureType: 'all',
                            elementType: 'all',
                            stylers: [{visibility: 'off'}]
                        }
                    ]}
                />
            </SafeAreaView>
        );
    }
}

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        token: state.auth.token,
        user: state.auth.user
    };
};

export default connect(mapStateToProps, actions)(MapScreen);
