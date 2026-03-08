/**
 * Patch react-native-tab-view to fix React key spread warning.
 *
 * The library builds a props object that includes `key` and then spreads it
 * into <TabBarItem {...props} />.  React 18.3+ warns that `key` must be
 * passed directly, not via spread.
 *
 * This script extracts `key` from props and passes it to the Fragment wrapper
 * instead, removing it from the TabBarItem spread.
 */
const fs = require('fs');
const path = require('path');

const files = [
    'lib/module/TabBar.js',
    'lib/commonjs/TabBar.js'
];

const base = path.join(__dirname, '..', 'node_modules', 'react-native-tab-view');

for (const file of files) {
    const filePath = path.join(base, file);
    if (!fs.existsSync(filePath)) continue;

    let src = fs.readFileSync(filePath, 'utf8');

    // Match the pattern where props (including key) are spread into TabBarItem
    const needle =
        /return \/\*#__PURE__\*\/React\.createElement\(React\.Fragment, null,([^;]+?)React\.createElement\((\w+(?:\.\w+)?), props\)\);/;

    if (!needle.test(src)) continue;

    src = src.replace(needle, (match, middle, component) => {
        return `const {key, ...tabBarItemProps} = props;\n    return /*#__PURE__*/React.createElement(React.Fragment, {key: key},${middle}React.createElement(${component}, tabBarItemProps));`;
    });

    fs.writeFileSync(filePath, src, 'utf8');
}
