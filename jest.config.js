module.exports = {
    preset: 'react-native',
    // Extend the RN preset's allowlist so Jest also transforms RTK + immer
    // (shipped as ESM), letting reducer/thunk tests import the slices.
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@reduxjs/toolkit|immer|redux|reselect)/)'
    ]
};
