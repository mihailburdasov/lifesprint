const TerserPlugin = require('terser-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

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
  // Включаем source maps и добавляем плагины
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // Добавляем Workbox плагин для генерации Service Worker
          if (process.env.NODE_ENV === 'production') {
            const workboxPlugin = new InjectManifest({
              swSrc: path.resolve(__dirname, 'public/service-worker.js'),
              swDest: 'service-worker.js',
              exclude: [
                /\.map$/,
                /asset-manifest\.json$/,
                /LICENSE/,
                /\.js\.gz$/,
                /\.css\.gz$/,
              ],
            });
            
            // Добавляем плагин в конец массива плагинов
            webpackConfig.plugins.push(workboxPlugin);
          }
          
          return webpackConfig;
        }
      }
    }
  ]
};
