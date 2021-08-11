import { randomNumber, randomString } from '../../random-test-builder';
import { BinanceSymbolPrice } from '../../../../src/code/infrastructure/binance/model/binance-price';

export const buildDefaultBinanceSymbolPrice = (): BinanceSymbolPrice => {
  return {
    symbol: randomString(5),
    price: randomNumber(1_000, 100_000).toString(),
  };
};
