import { randomFromList, randomNumber, randomString } from '../../random-test-builder';
import { BinanceOrder, BinanceOrderFill } from '../../../../src/code/infrastructure/binance/model/binance-order';

export const buildDefaultBinanceOrder = (): BinanceOrder => {
  return buildDefaultBinanceMarketOrder();
};

export const buildDefaultBinanceMarketOrder = (): BinanceOrder => {
  return {
    orderId: randomNumber(),
    transactTime: new Date().valueOf(),
    type: 'MARKET',
    side: randomFromList(['BUY', 'SELL']),
    status: 'FILLED',
    price: '0',
    executedQty: randomNumber(10, 100).toString(),
    cummulativeQuoteQty: randomNumber(10, 100).toString(),
    fills: [buildDefaultBinanceOrderFill(), buildDefaultBinanceOrderFill()],
  };
};

export const buildDefaultBinanceLimitOrder = (): BinanceOrder => {
  return {
    orderId: randomNumber(),
    transactTime: new Date().valueOf(),
    type: 'LIMIT',
    side: randomFromList(['BUY', 'SELL']),
    status: 'NEW',
    price: '0',
    executedQty: '0',
    cummulativeQuoteQty: '0',
    fills: [],
  };
};

export const buildDefaultBinanceOrderFill = (): BinanceOrderFill => {
  return {
    tradeId: randomNumber(),
    price: randomNumber(1_000, 10_000).toString(),
    qty: randomNumber(10, 1_000).toString(),
    commission: randomNumber(1, 10).toString(),
    commissionAsset: randomString(5),
  };
};
