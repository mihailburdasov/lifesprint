const TerserPlugin = require('terser-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  style: {
    postcss: {
      mode: 'file',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Включаем source maps для отладки
      webpackConfig.devtool = process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map';

      // Настраиваем оптимизацию
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: process.env.NODE_ENV === 'production',
                drop_debugger: process.env.NODE_ENV === 'production',
                pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : []
              },
              mangle: {
                safari10: true,
                keep_classnames: true,
                keep_fnames: true,
                toplevel: false,
                reserved: []
              },
              output: {
                comments: false,
                ascii_only: true,
                beautify: false
              }
            },
            extractComments: false
          })
        ],
        splitChunks: {
          chunks: 'all',
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };

      // Добавляем плагины для оптимизации
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8
          })
        );

        if (process.env.ANALYZE) {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: 'bundle-analysis.html',
              openAnalyzer: false
            })
          );
        }
      }

      return webpackConfig;
    }
  },
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
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
              maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              dontCacheBustURLsMatching: /\.\w{8}\./,
              manifestTransforms: [
                (manifestEntries) => {
                  const timestamp = new Date().getTime();
                  const manifest = manifestEntries.map(entry => {
                    if (entry.url && !entry.url.includes('?')) {
                      entry.url = `${entry.url}?v=${timestamp}`;
                    }
                    return entry;
                  });
                  return { manifest, warnings: [] };
                }
              ]
            });
            
            webpackConfig.plugins.push(workboxPlugin);
          }
          
          return webpackConfig;
        }
      }
    }
  ]
};
