import { randomNumber } from '@hastobegood/crypto-bot-artillery/test/builders';
import { CandlestickEntity } from '../../../../src/code/infrastructure/candlestick/ddb-candlestick-repository';

export const buildDefaultCandlestickEntity = (): CandlestickEntity => {
  return {
    start: new Date().valueOf(),
    end: new Date().valueOf(),
    ohlcv: [randomNumber(), randomNumber(), randomNumber(), randomNumber(), randomNumber()],
  };
};
