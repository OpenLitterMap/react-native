module.exports = {
    root: true,
    extends: '@react-native-community',
    rules: {
        // indent: ['warn', 4, { SwitchCase: 1 }],
        // semi: ['off', 'always'], // recommend on and always
        'no-control-regex': 'off',
        'comma-dangle': ['warn', 'never'], // recommend always
        'no-undef': 'off',
        'react-native/no-inline-styles': 'off', // recommend turning on
        'space-before-function-paren': 'always'
        // 'prettier/prettier': 'off',
        // quotes: ['off', 'double'] // recommend on and backtick
    }
};
