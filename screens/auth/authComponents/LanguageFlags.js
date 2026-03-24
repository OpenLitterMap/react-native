import React, {useState} from 'react';
import {
    Image,
    LayoutAnimation,
    Platform,
    Pressable,
    StyleSheet,
    UIManager,
    useWindowDimensions,
    View
} from 'react-native';

import {useTranslation} from 'react-i18next';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const LANGS = [
    {lang: 'ar', flag: require('../../../assets/icons/flags/sa.png')},
    {lang: 'es', flag: require('../../../assets/icons/flags/es.png')},
    {lang: 'en', flag: require('../../../assets/icons/flags/gb.png')},
    {lang: 'fr', flag: require('../../../assets/icons/flags/fr.png')},
    {lang: 'de', flag: require('../../../assets/icons/flags/de.png')},
    {lang: 'ie', flag: require('../../../assets/icons/flags/ie.png')},
    {lang: 'nl', flag: require('../../../assets/icons/flags/nl.png')},
    {lang: 'pt', flag: require('../../../assets/icons/flags/pt.png')}
];

const LanguageFlags = () => {
    const {i18n} = useTranslation();
    const {width: SCREEN_WIDTH} = useWindowDimensions();
    const currentLang = i18n.language;
    const [show, setShow] = useState(false);

    const change = lang => {
        i18n.changeLanguage(lang);
        LayoutAnimation.configureNext(
            LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
        );
        setShow(false);
    };

    const toggle = () => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
        );
        setShow(prev => !prev);
    };

    const getCurrentFlag = () => {
        const found = LANGS.find(l => l.lang === currentLang);
        return found ? found.flag : LANGS[2].flag;
    };

    return (
        <View style={[styles.container, {right: (SCREEN_WIDTH * 0.35) / 2 - 24}]}>
            {show ? (
                <View style={styles.flagList}>
                    {LANGS.map(item => (
                        <Pressable
                            key={item.lang}
                            onPress={() => change(item.lang)}
                            style={({pressed}) => [
                                styles.flagButton,
                                item.lang === currentLang &&
                                    styles.flagButtonActive,
                                pressed && styles.flagButtonPressed
                            ]}>
                            <Image
                                source={item.flag}
                                resizeMode="cover"
                                style={styles.flagImage}
                            />
                        </Pressable>
                    ))}
                </View>
            ) : (
                <Pressable
                    onPress={toggle}
                    style={({pressed}) => [
                        styles.flagButton,
                        pressed && styles.flagButtonPressed
                    ]}>
                    <Image
                        resizeMode="cover"
                        style={styles.flagImage}
                        source={getCurrentFlag()}
                    />
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: -12,
        zIndex: 10,
        alignItems: 'flex-end'
    },
    flagList: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 6,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    flagButton: {
        borderRadius: 6,
        overflow: 'hidden',
        padding: 2
    },
    flagButtonActive: {
        backgroundColor: 'rgba(39,174,96,0.15)',
        borderRadius: 6
    },
    flagButtonPressed: {
        opacity: 0.7
    },
    flagImage: {
        borderRadius: 4,
        width: 48,
        height: 32
    }
});

export default LanguageFlags;
