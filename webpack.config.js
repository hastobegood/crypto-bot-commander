import { readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const handlers = {};
readdirSync('./src/handlers')
  .filter((file) => file.endsWith('-handler.ts'))
  .forEach(function (handler) {
    handlers[handler.split('.ts')[0]] = './handlers/' + handler;
  });

const config = {
  mode: 'production',
  target: 'node14',
  externalsPresets: { node: true },
  devtool: 'nosources-source-map',

  context: resolve(dirname(''), 'src'),
  entry: handlers,

  experiments: {
    outputModule: true,
  },

  output: {
    path: resolve(dirname(''), 'dist/webpack'),
    filename: '[name]/app.js',
    library: {
      type: 'module',
    },
    module: true,
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts/,
        use: 'ts-loader',
      },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: Object.keys(handlers).map((handler) => ({
        from: '../package-empty.json',
        to: `${handler}/package.json`,
      })),
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: true,
    }),
  ],
};

export default config;
