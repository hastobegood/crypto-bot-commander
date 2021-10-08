import { randomNumber, randomString } from '../../random-test-builder';
import { BinanceTrade } from '../../../../src/code/infrastructure/binance/model/binance-trade';

export const buildDefaultBinanceTrades = (): BinanceTrade[] => {
  return [buildDefaultBinanceTrade(), buildDefaultBinanceTrade(), buildDefaultBinanceTrade()];
};

export const buildDefaultBinanceTrade = (): BinanceTrade => {
  return {
    id: randomNumber(),
    time: new Date().valueOf(),
    price: randomNumber(1_000, 10_000).toString(),
    qty: randomNumber(1_000, 10_000).toString(),
    quoteQty: randomNumber(1_000, 10_000).toString(),
    commission: randomNumber(10, 100).toString(),
    commissionAsset: randomString(5),
  };
};
