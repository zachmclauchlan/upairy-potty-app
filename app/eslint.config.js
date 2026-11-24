// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.tools/*'],
  },
  {
    rules: {
      // Apostrophes in copy ("Otto's day") render fine in React Native text.
      'react/no-unescaped-entities': 'off',
      // The timer and daily screens read the clock on purpose, and Animated values live in refs by design.
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // expo-notifications re-exports its enums with `export *`, which this rule can't follow.
      'import/namespace': 'off',
    },
  },
]);
