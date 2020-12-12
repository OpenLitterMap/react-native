import React, { Component } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    Text,
    View
} from 'react-native';
import PageControl from 'react-native-page-control';

import Swiper from 'react-native-swiper';

// import * as Font from 'expo-font'

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class Slides extends Component {

    constructor (props)
    {
        super(props);

        this.state = {
            fontLoaded: false
        };
    }

    // for android only
    // async
    componentDidMount ()
    {
        this.setState({ fontLoaded: true });
    }

    renderSlides ()
    {
        return this.props.data.map((slide, i) => {
            return (
                <View key={slide.id} style={styles.slide}>
                    <Image source={slide.image} style={styles.slideImage} />
                    <View style={styles.textContainer}>
                        <View
                            style={{ flex: 1, flexDirection: 'row', alignSelf: 'center' }}>
                            <Text style={styles.slideTitle1}>{slide.title1}</Text>
                            <Text style={styles.slideTitle2}>{slide.title2}</Text>
                        </View>
                        <Text style={styles.slideText}>{slide.text}</Text>
                    </View>
                    <PageControl
                        style={styles.pageControl}
                        numberOfPages={this.props.data.length}
                        currentPage={slide.id - 1}
                        // hidesForSinglePage
                        pageIndicatorTintColor="gray"
                        currentPageIndicatorTintColor="white"
                        indicatorStyle={{ borderRadius: 15 }}
                        currentIndicatorStyle={{ borderRadius: 5 }}
                        indicatorSize={styles.indicatorSize}
                        onPageIndicatorPress={this.onItemTap}
                    />
                </View>
            );
        });
    }

    render ()
    {
        if (this.state.fontLoaded === false)
        {
            return <ActivityIndicator />;
        }

        return (
            <ScrollView
                horizontal
                style={{ flex: 1 }}
                pagingEnabled
                showsHorizontalScrollIndicator={false}
            >{this.renderSlides()}</ScrollView>
        );
    }
}

const styles = {
    buttonContainer: {
        alignItems: 'center',
        backgroundColor: 'green',
        padding: 20
    },
    buttonStyle: {
        backgroundColor: '#0288D1',
        marginTop: 15
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    formLabel: {
        color: 'white'
    },
    slideImage: {
        // backgroundColor: 'red',
        height: SCREEN_HEIGHT * 0.45,
        position: 'absolute',
        resizeMode: 'contain',
        top: SCREEN_HEIGHT * 0.15,
        width: SCREEN_WIDTH * 0.7
    },
    indicatorSize: {
        height: SCREEN_HEIGHT * 0.01,
        width: SCREEN_WIDTH * 0.02
    },
    inputStyle: {
        backgroundColor: 'white',
        marginBottom: 20,
        textColor: 'white'
    },
    linearGradient: {
        flex: 1
    },
    logo: {
        width: SCREEN_WIDTH * 0.7,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 25
    },
    mainTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        position: 'absolute',
        top: 50
    },
    pageControl: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: SCREEN_HEIGHT * 0.02
    },
    slide: {
        alignItems: 'center',
        // backgroundColor: '#2ecc71',
        flex: 1,
        justifyContent: 'center',
        width: SCREEN_WIDTH
    },
    slideTitle1: {
        color: '#18181a',
        fontSize: SCREEN_HEIGHT * 0.06, // 40
        fontFamily: 'Avenir-Black',
        textAlign: 'center'
    },
    slideTitle2: {
        color: '#4cd137',
        fontSize: SCREEN_HEIGHT * 0.06, // 40
        fontFamily: 'Avenir-Black',
        textAlign: 'center'
    },
    slideText: {
        color: '#18181a',
        fontSize: SCREEN_WIDTH * 0.05, // 20
        fontWeight: 'bold',
        textAlign: 'center'
    },
    textContainer: {
        position: 'absolute',
        display: 'flex',
        bottom: SCREEN_HEIGHT * 0.22,
        marginLeft: SCREEN_HEIGHT * 0.05,
        marginRight: SCREEN_HEIGHT * 0.05
    },
    titleLabel: {
        textAlign: 'center',
        fontWeight: 'bold'
    }
};

export default Slides;
