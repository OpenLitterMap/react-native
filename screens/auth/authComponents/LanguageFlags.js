import React, { Component } from 'react';
import {
    Platform,
    Image,
    SafeAreaView,
    TouchableOpacity,
    StyleSheet,
    View
} from 'react-native';

// setLang not working
// import { getLanguage, setLanguage } from 'react-native-translation';
// import * as Animatable from 'react-native-animatable';

import { connect } from 'react-redux';
import * as actions from '../../../actions';

// const SCREEN_HEIGHT = Dimensions.get('window').height;
// const SCREEN_WIDTH = Dimensions.get('window').width;

class LanguageFlags extends Component {
    /**
     * We need to bind toggle to access state
     */
    constructor(props) {
        super(props);

        this.state = {
            show: false,
            langs: [
                {
                    lang: 'ar',
                    flag: require('../../../assets/icons/flags/sa.png')
                },
                {
                    lang: 'es',
                    flag: require('../../../assets/icons/flags/es.png')
                },
                {
                    lang: 'en',
                    flag: require('../../../assets/icons/flags/gb.png')
                },
                {
                    lang: 'fr',
                    flag: require('../../../assets/icons/flags/fr.png')
                },
                {
                    lang: 'de',
                    flag: require('../../../assets/icons/flags/de.png')
                },
                {
                    lang: 'nl',
                    flag: require('../../../assets/icons/flags/nl.png')
                },
                {
                    lang: 'pt',
                    flag: require('../../../assets/icons/flags/pt.png')
                }
            ]
        };

        this.change = this.change.bind(this);
        this.toggle = this.toggle.bind(this);
    }

    /**
     *
     */
    change(lang) {
        this.props.changeLang(lang);

        this.toggle();
    }

    /**
     * Return the flag image path for the currently active language
     */
    getCurrentFlag() {
        return this.state.langs.find(lng => lng.lang === this.props.lang).flag;
    }

    /**
     * Show or hide available languages
     */
    toggle() {
        this.setState({ show: !this.state.show });
    }

    render() {
        return (
            <SafeAreaView style={styles.top}>
                {this.state.show ? (
                    this.state.langs.map(lang => (
                        <TouchableOpacity
                            key={lang.lang}
                            onPress={() => this.change(lang.lang)}>
                            <Image
                                source={lang.flag}
                                resizeMethod="auto"
                                resizeMode="cover"
                                style={[
                                    styles.imageStyle,
                                    {
                                        marginBottom: 12
                                    }
                                ]}
                            />
                        </TouchableOpacity>
                    ))
                ) : (
                    <TouchableOpacity onPress={this.toggle}>
                        <Image
                            resizeMethod="auto"
                            resizeMode="cover"
                            style={styles.imageStyle}
                            source={this.getCurrentFlag()}
                        />
                    </TouchableOpacity>
                )}
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    top: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 20 : 40,
        left: 20,
        zIndex: 1
    },
    imageStyle: { borderRadius: 4, width: 60, height: 40 }
});

// LanguageFlags = Animatable.createAnimatableComponent(LanguageFlags);

export default connect(
    null,
    actions
)(LanguageFlags);
