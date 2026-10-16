// NativeWind v4: the css-interop plugin rewrites JSX so `className` works on
// React Native components. We add only that plugin (not `nativewind/babel`)
// because babel-preset-expo already adds the Reanimated/Worklets plugin and
// adding it twice would transform worklets twice.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [require('react-native-css-interop/dist/babel-plugin').default],
  };
};
