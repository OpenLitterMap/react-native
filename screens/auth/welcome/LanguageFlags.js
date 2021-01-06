import React, { Component } from 'react';
import {
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { getLanguage } from 'react-native-translation';

import * as Animatable from 'react-native-animatable';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const langs = [
    { lang: 'es', flag: require('../../../assets/icons/flags/es.png') },
    { lang: 'en', flag: require('../../../assets/icons/flags/gb.png') },
    { lang: 'de', flag: require('../../../assets/icons/flags/de.png') },
    { lang: 'nl', flag: require('../../../assets/icons/flags/nl.png') }
];

class LanguageFlags extends Component
{

    constructor() {
        super();

        this.state = {
            show: false
        }
    }

    getCurrentFlag ()
    {
        const current = getLanguage(); // current lang

        return langs.find(lng => lng.lang === current).flag;
    }

    toggle ()
    {
        console.log('toggle');
    }

    render ()
    {
        return (
            <TouchableOpacity
                style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.075, left: SCREEN_WIDTH * 0.075, zIndex: 1 }}
                onPress={this.toggle.bind('this')}
            >
                <Image source={this.getCurrentFlag()}  />
            </TouchableOpacity>
        )
    }
}

LanguageFlags = Animatable.createAnimatableComponent(LanguageFlags);

export default LanguageFlags;