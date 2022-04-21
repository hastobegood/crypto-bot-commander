import { randomBoolean, randomFromList, randomNumber, randomSymbol } from '@hastobegood/crypto-bot-artillery/test/builders';

import { CreateOrder } from '../../../../src/code/domain/order/model/order';

export const buildDefaultCreateMarketOrder = (): CreateOrder => {
  return {
    exchange: randomFromList(['Binance']),
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Market',
    quote: randomBoolean(),
    requestedQuantity: randomNumber(),
  };
};

export const buildDefaultCreateLimitOrder = (): CreateOrder => {
  return {
    exchange: randomFromList(['Binance']),
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Limit',
    quote: false,
    requestedQuantity: randomNumber(),
    requestedPrice: randomNumber(),
  };
};
