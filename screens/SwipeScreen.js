import React, { Component } from 'react'

import Swiper from 'react-native-swiper'
import CameraPage from './pages/CameraPage'
import LeftPage from './pages/LeftPage'
import RightPage from './pages/RightPage'

class SwipeScreen extends React.Component {

    static navigationOptions = {
        tabBarVisible: false
    }

    viewStyle ()
    {
        return {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        }
    }

    jumpToSlide (n)
    {
        this.refs.swiper.scrollBy(n) // n is the number of places to move the swipe, eg: 2, -1, etc.
    }

    render ()
    {
        return (
            <Swiper
                index={1}
                loop={false}
                showsPagination={false}
                ref="swiper"
                keyboardShouldPersistTaps="handled"
            >
                <LeftPage navigation={this.props.navigation} swiper={this.refs.swiper} />
                {/*
                    <Swiper
                      horizontal={false}
                      loop={false}
                      showsPagination={false}
                      index={1}>
                        <View style={this.viewStyle()}>
                          <TitleText label="Top" />
                          </View>
                      */}
                <CameraPage swipe={(value) => this.jumpToSlide(value)} />
                {/*
                    <View style={this.viewStyle()}>
                      <TitleText label="Bottom - Verify Images Page." />
                    </View>
                    </Swiper>

                <RightPage navigation={this.props.navigation} swiper={this.refs.swiper} />

                */}
            </Swiper>
        );
    }
}

export default SwipeScreen;
