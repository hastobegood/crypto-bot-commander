import { randomFromList, randomSymbol } from '@hastobegood/crypto-bot-artillery/test/builders';
import { UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';

export const buildDefaultUpdatedCandlesticksMessage = (): UpdatedCandlesticksMessage => {
  return {
    content: {
      exchange: randomFromList(['Binance']),
      symbol: randomSymbol(),
    },
  };
};
