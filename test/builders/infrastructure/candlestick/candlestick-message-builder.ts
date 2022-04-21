import { randomFromList, randomSymbol } from '@hastobegood/crypto-bot-artillery/test/builders';

import { TriggeredCandlesticksMessage, UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';

export const buildDefaultTriggeredCandlesticksMessage = (): TriggeredCandlesticksMessage => {
  return {
    content: {
      exchange: randomFromList(['Binance']),
      symbol: randomSymbol(),
    },
  };
};

export const buildDefaultUpdatedCandlesticksMessage = (): UpdatedCandlesticksMessage => {
  return {
    content: {
      exchange: randomFromList(['Binance']),
      symbol: randomSymbol(),
    },
  };
};
