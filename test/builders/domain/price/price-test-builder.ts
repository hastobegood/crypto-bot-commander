import { randomNumber, randomString } from '../../random-test-builder';
import { Price } from '../../../../src/code/domain/price/model/price';

export const buildDefaultPrice = (): Price => {
  return buildPrice(randomString(5), randomNumber(100, 1_000), randomNumber(100, 1_000));
};

export const buildPrice = (symbol: string, averagePrice: number, currentPrice: number): Price => {
  return {
    symbol: symbol,
    averagePrice: averagePrice,
    currentPrice: currentPrice,
  };
};
