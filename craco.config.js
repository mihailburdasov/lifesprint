const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  style: {
    postcss: {
      mode: 'file',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Включаем source maps для отладки
      webpackConfig.devtool = 'source-map';

      // Настраиваем оптимизацию с более мягкими параметрами
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                // Сохраняем console.log для отладки
                drop_console: false,
                drop_debugger: false
              },
              mangle: {
                safari10: true,
                // Сохраняем имена классов и функций для лучшей отладки
                keep_classnames: true,
                keep_fnames: true,
                toplevel: false,
                reserved: []
              },
              output: {
                // Сохраняем комментарии и форматирование для лучшей читаемости
                comments: true,
                ascii_only: true,
                beautify: true
              }
            },
            extractComments: false
          })
        ]
      };

      return webpackConfig;
    }
  },
  // Включаем source maps
  plugins: []
};
