import { randomNumber, randomString, randomSymbol } from '../../random-test-builder';
import { BinanceOrder } from '../../../../src/code/infrastructure/binance/model/binance-order';

export const buildDefaultBinanceOrder = (): BinanceOrder => {
  return buildDefaultBinanceMarketOrder();
};

export const buildDefaultBinanceMarketOrder = (): BinanceOrder => {
  return {
    symbol: randomSymbol(),
    orderId: randomNumber(),
    clientOrderId: randomString(),
    transactTime: new Date().valueOf(),
    price: '0',
    executedQty: randomNumber(10, 100).toString(),
    cummulativeQuoteQty: randomNumber(10, 100).toString(),
    status: 'FILLED',
    side: 'BUY',
    type: 'MARKET',
  };
};

export const buildDefaultBinanceLimitOrder = (): BinanceOrder => {
  return {
    symbol: randomSymbol(),
    orderId: randomNumber(),
    clientOrderId: randomString(),
    transactTime: new Date().valueOf(),
    price: '0',
    executedQty: '0',
    cummulativeQuoteQty: '0',
    status: 'NEW',
    side: 'BUY',
    type: 'LIMIT',
  };
};
