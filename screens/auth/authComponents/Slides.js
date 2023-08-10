import React, {Component} from 'react';
import {Dimensions, Image, ScrollView, StyleSheet, View} from 'react-native';
import PageControl from 'react-native-page-control';
import {getLanguage} from 'react-native-translation';
import {Body, Colors, Title} from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class Slides extends Component {
    constructor(props) {
        super(props);
    }

    /**
     * For langs with longer text, we need to change flexDirection
     */
    getInnerTextContainer() {
        let flexDirection = 'row';

        if (getLanguage() === 'nl') {
            flexDirection = 'column';
        }

        return {flexDirection: flexDirection, alignSelf: 'center'};
    }

    renderSlides() {
        const lang = this.props.lang;

        return this.props.data.map((slide, i) => {
            return (
                <View key={slide.id} style={styles.slide}>
                    <Image
                        source={slide.image}
                        style={styles.slideImage}
                        resizeMode="contain"
                        resizeMethod="resize"
                    />

                    <View>
                        <View style={this.getInnerTextContainer()}>
                            <Title
                                style={styles.slideTitle}
                                dictionary={`${lang}.welcome.its`}
                            />
                            <Title
                                color="accent"
                                style={[styles.slideTitle, {marginLeft: 6}]}
                                dictionary={`${lang}.${slide.title}`}
                            />
                        </View>
                        <Body
                            style={{
                                textAlign: 'center',
                                paddingHorizontal: 30,
                            }}
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
                        indicatorStyle={{borderRadius: 15}}
                        currentIndicatorStyle={{borderRadius: 5}}
                        indicatorSize={styles.indicatorSize}
                        onPageIndicatorPress={this.onItemTap}
                    />
                </View>
            );
        });
    }

    render() {
        return (
            <ScrollView
                horizontal
                style={{flex: 1}}
                pagingEnabled
                showsHorizontalScrollIndicator={false}>
                {this.renderSlides()}
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideImage: {
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.45,
        marginTop: 80,
    },
    indicatorSize: {
        height: SCREEN_HEIGHT * 0.01,
        width: SCREEN_WIDTH * 0.02,
    },
    pageControl: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: SCREEN_HEIGHT * 0.02,
    },
    slide: {
        alignItems: 'center',
        flex: 1,
        width: SCREEN_WIDTH,
    },
    slideTitle: {
        fontSize: 36,
        textAlign: 'center',
    },
    slideText: {
        fontSize: 18,
        textAlign: 'center',
    },
});

export default Slides;
