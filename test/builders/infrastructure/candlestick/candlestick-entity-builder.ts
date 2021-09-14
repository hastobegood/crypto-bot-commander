import { randomNumber } from '../../random-test-builder';
import { CandlestickEntity } from '../../../../src/code/infrastructure/candlestick/ddb-candlestick-repository';

export const buildDefaultCandlestickEntity = (): CandlestickEntity => {
  return {
    start: new Date().valueOf(),
    end: new Date().valueOf(),
    ohlcv: [randomNumber(400, 500), randomNumber(500, 550), randomNumber(350, 400), randomNumber(400, 500), 0],
  };
};
