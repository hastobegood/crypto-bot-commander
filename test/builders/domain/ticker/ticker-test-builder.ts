import { randomNumber, randomSymbol } from '../../random-test-builder';
import { Ticker } from '../../../../src/code/domain/ticker/model/ticker';

export const buildDefaultTicker = (): Ticker => {
  return {
    symbol: randomSymbol(),
    baseAssetPrecision: randomNumber(8, 10),
    quoteAssetPrecision: randomNumber(8, 10),
    quantityPrecision: randomNumber(2, 6),
    pricePrecision: randomNumber(2, 6),
  };
};
