const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable source maps in production
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.devtool = false;
      }

      // Configure optimization
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
              },
              mangle: {
                safari10: true,
                keep_classnames: false,
                keep_fnames: false,
                toplevel: true,
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
        ]
      };

      return webpackConfig;
    }
  },
  // Disable source maps in production
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          if (process.env.NODE_ENV === 'production') {
            webpackConfig.plugins = webpackConfig.plugins.filter(
              (plugin) => plugin.constructor.name !== 'SourceMapDevToolPlugin'
            );
          }
          return webpackConfig;
        }
      }
    }
  ]
};
