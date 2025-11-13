const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add Node.js polyfills for web
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify'),
  };

  // Ensure CSS files are processed
  const cssRule = config.module.rules.find(
    rule => rule.test && rule.test.toString().includes('css')
  );

  if (cssRule && cssRule.use) {
    // Make sure postcss-loader is in the chain
    const hasPostCSS = cssRule.use.some(
      loader => typeof loader === 'object' && loader.loader && loader.loader.includes('postcss')
    );

    if (!hasPostCSS) {
      // Add postcss-loader if it's not already there
      cssRule.use.push({
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [
              require('tailwindcss'),
              require('autoprefixer'),
            ],
          },
        },
      });
    }
  }

  return config;
};
