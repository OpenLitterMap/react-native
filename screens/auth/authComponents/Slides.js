import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
// import PageControl from 'react-native-page-control';
import { Body, Colors, Title } from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const Slides = ({ data, activeIndex, onScroll }) => {

    /**
     * For langs with longer text, we need to change flexDirection
     */
    const getInnerTextContainer = () => {
        let flexDirection = 'row';

        // if (getLanguage() === 'nl') {
        //     flexDirection = 'column';
        // }

        return {
            flexDirection: flexDirection,
            alignSelf: 'center'
        };
    }

    const renderDots = () => {
      return data.map((_, i) => {
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? Colors.accent : 'white'
              }
            ]}
          />
        );
      });
    }

    const renderSlides = () => {

        return data.map((slide, i) => {
            return (
                <View key={slide.id} style={styles.slide}>
                    <Image
                        source={slide.image}
                        style={styles.slideImage}
                        resizeMode="contain"
                        resizeMethod="resize"
                    />

                    <View>
                        <View style={getInnerTextContainer()}>
                            <Title
                                style={styles.slideTitle}
                                dictionary={'welcome.its'}
                            />
                            <Title
                                color="accent"
                                style={[styles.slideTitle, {marginLeft: 6}]}
                                dictionary={slide.title}
                            />
                        </View>
                        <Body
                            style={{
                                textAlign: 'center',
                                paddingHorizontal: 30,
                            }}
                            dictionary={slide.text}
                        />
                    </View>
                </View>
            );
        });
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                style={{flex: 1}}
                pagingEnabled
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}>
                {renderSlides()}
            </ScrollView>
            <View style={styles.dotContainer}>{renderDots()}</View>
        </View>
    );
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
    dotContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    dot: {
      width: SCREEN_WIDTH * 0.02,
      height: SCREEN_HEIGHT * 0.01,
      borderRadius: 5,
      marginHorizontal: 8,
    },
});

export default Slides;
