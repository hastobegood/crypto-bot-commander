import { Configuration, Entry } from 'webpack';
import { readdirSync } from 'fs-extra';
import CopyPlugin from 'copy-webpack-plugin';

const handlers: Entry = {};
readdirSync('./src/handlers')
  .filter((file) => file.endsWith('-handler.ts'))
  .forEach(function (handler) {
    handlers[handler.split('.ts')[0]] = './src/handlers/' + handler;
  });

const config: Configuration = {
  mode: 'production',
  target: 'node',
  devtool: 'source-map',

  entry: handlers,

  externals: [
    'pino-pretty', // https://github.com/pinojs/pino/issues/688
  ],

  output: {
    filename: 'dist/webpack/[name]/app.js',
    path: __dirname,
    libraryTarget: 'commonjs',
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
      patterns: Object.keys(handlers).map((handler) => ({ from: 'package-empty.json', to: `dist/webpack/${handler}/package.json` })),
    }),
  ],
};

export default config;
