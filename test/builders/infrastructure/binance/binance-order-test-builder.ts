import { randomNumber, randomString, randomSymbol } from '../../random-test-builder';
import { BinanceOrder, BinanceOrderFill } from '../../../../src/code/infrastructure/binance/model/binance-order';

export const buildDefaultBinanceOrder = (): BinanceOrder => {
  return buildBinanceOrder([buildDefaultBinanceFill(), buildDefaultBinanceFill()]);
};

export const buildBinanceOrder = (fills: BinanceOrderFill[]): BinanceOrder => {
  return {
    symbol: randomSymbol(),
    orderId: randomNumber(),
    clientOrderId: randomString(),
    transactTime: new Date().valueOf(),
    price: randomNumber(100, 1_000).toString(),
    executedQty: randomNumber(10, 100).toString(),
    status: 'FILLED',
    side: 'BUY',
    type: 'MARKET',
    fills: fills,
  };
};

export const buildDefaultBinanceFill = (): BinanceOrderFill => {
  return {
    price: randomNumber(1, 1_000).toString(),
    qty: randomNumber(1, 1_000).toString(),
    commission: randomNumber(1, 1_000).toString(),
    commissionAsset: randomString(5).toUpperCase(),
  };
};
