import React, { Component } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    View
} from 'react-native';
import PageControl from 'react-native-page-control';
import { getLanguage, TransText } from 'react-native-translation';
import { Title, Body, Colors } from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class Slides extends Component {
    constructor(props) {
        super(props);

        this.state = {
            fontLoaded: false
        };
    }

    // for android only
    // async
    componentDidMount() {
        this.setState({ fontLoaded: true });
    }

    /**
     * For langs with longer text, we need to change flexDirection
     */
    getInnerTextContainer() {
        let flexDirection = 'row';

        if (getLanguage() === 'nl') {
            flexDirection = 'column';
        }

        return { flexDirection: flexDirection, alignSelf: 'center' };
    }

    renderSlides() {
        const lang = this.props.lang;

        return this.props.data.map((slide, i) => {
            return (
                <View key={slide.id} style={styles.slide}>
                    <Image source={slide.image} style={styles.slideImage} />

                    <View style={styles.textContainer}>
                        <View style={this.getInnerTextContainer()}>
                            <Title
                                style={styles.slideTitle}
                                dictionary={`${lang}.welcome.its`}
                            />
                            <Title
                                color="accent"
                                style={styles.slideTitle}
                                dictionary={`${lang}.${slide.title}`}
                            />
                        </View>
                        <Body
                            style={{ textAlign: 'center' }}
                            dictionary={`${lang}.${slide.text}`}
                        />
                    </View>

                    <PageControl
                        style={styles.pageControl}
                        numberOfPages={this.props.data.length}
                        currentPage={slide.id - 1}
                        // hidesForSinglePage
                        pageIndicatorTintColor="white"
                        currentPageIndicatorTintColor={`${Colors.accent}`}
                        indicatorStyle={{ borderRadius: 15 }}
                        currentIndicatorStyle={{ borderRadius: 5 }}
                        indicatorSize={styles.indicatorSize}
                        onPageIndicatorPress={this.onItemTap}
                    />
                </View>
            );
        });
    }

    render() {
        if (this.state.fontLoaded === false) {
            return <ActivityIndicator />;
        }

        return (
            <ScrollView
                horizontal
                style={{ flex: 1 }}
                pagingEnabled
                showsHorizontalScrollIndicator={false}>
                {this.renderSlides()}
            </ScrollView>
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
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.45,
        marginTop: SCREEN_HEIGHT * 0.15
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
        flex: 1,
        width: SCREEN_WIDTH
    },
    slideTitle: {
        fontSize: 36,
        textAlign: 'center'
    },
    slideText: {
        fontSize: 18,
        textAlign: 'center'
    },
    textContainer: {
        // position: 'absolute',
        // display: 'flex',
        // bottom: SCREEN_HEIGHT * 0.22,
        // marginLeft: SCREEN_HEIGHT * 0.05,
        // marginRight: SCREEN_HEIGHT * 0.05
    },
    titleLabel: {
        textAlign: 'center',
        fontWeight: 'bold'
    }
};

export default Slides;
