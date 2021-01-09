import React, { Component } from 'react';
import {
    Dimensions,
    Image,
    TouchableOpacity,
    View
} from 'react-native';

// setLang not working
// import { getLanguage, setLanguage } from 'react-native-translation';
// import * as Animatable from 'react-native-animatable';

import { connect } from 'react-redux'
import * as actions from '../../../actions'

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class LanguageFlags extends Component
{
    /**
     * We need to bind toggle to access state
     */
    constructor (props)
    {
        super(props);

        this.state = {
            show: false,
            langs: [
                { lang: 'es', flag: require('../../../assets/icons/flags/es.png') },
                { lang: 'en', flag: require('../../../assets/icons/flags/gb.png') },
                { lang: 'fr', flag: require('../../../assets/icons/flags/fr.png') },
                { lang: 'de', flag: require('../../../assets/icons/flags/de.png') },
                { lang: 'nl', flag: require('../../../assets/icons/flags/nl.png') },
                // { lang: 'pt', flag: require('../../../assets/icons/flags/pt.png') }
            ]
        };

        this.change = this.change.bind(this);
        this.toggle = this.toggle.bind(this);
    }

    /**
     *
     */
    change (lang)
    {
        this.props.changeLang(lang);

        this.toggle();
    }

    /**
     * Return the flag image path for the currently active language
     */
    getCurrentFlag ()
    {
        return this.state.langs.find(lng => lng.lang === this.props.lang).flag;
    }

    /**
     * Show or hide available languages
     */
    toggle ()
    {
        this.setState({ show: ! this.state.show });
    }

    render ()
    {
        return (
            <View style={styles.top}>
                {
                    this.state.show ?
                    (
                        this.state.langs.map(lang => (
                            <TouchableOpacity
                                key={lang.lang}
                                onPress={() => this.change(lang.lang)}
                            >
                                <Image
                                    source={lang.flag}
                                    style={{ marginBottom: 10 }}
                                />
                            </TouchableOpacity>
                        ))
                    )
                    :
                    (
                        <TouchableOpacity onPress={this.toggle}>
                            <Image source={this.getCurrentFlag()}  />
                        </TouchableOpacity>
                    )
                }
            </View>
        )
    }
}

const styles = {
    top: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.075,
        left: SCREEN_WIDTH * 0.075,
        zIndex: 1
    }
}

// LanguageFlags = Animatable.createAnimatableComponent(LanguageFlags);

export default connect(
    null,
    actions
)(LanguageFlags);
