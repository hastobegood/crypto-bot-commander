import { Configuration, Entry } from 'webpack';
import { readdirSync } from 'fs-extra';
import { resolve } from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const handlers: Entry = {};
readdirSync('./src/handlers')
  .filter((file) => file.endsWith('-handler.ts'))
  .forEach(function (handler) {
    handlers[handler.split('.ts')[0]] = './handlers/' + handler;
  });

const config: Configuration = {
  mode: 'production',
  target: 'node',
  devtool: 'nosources-source-map',

  context: resolve(__dirname, 'src'),
  entry: handlers,

  externals: [
    'pino-pretty', // https://github.com/pinojs/pino/issues/688
  ],

  output: {
    path: resolve(__dirname, 'dist/webpack'),
    filename: '[name]/app.js',
    libraryTarget: 'commonjs',
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
      patterns: Object.keys(handlers).map((handler) => ({ from: '../package-empty.json', to: `${handler}/package.json` })),
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: true,
    }),
  ],
};

export default config;
