import { randomSymbol } from '../../random-test-builder';
import { UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';

export const buildDefaultUpdatedCandlesticksMessage = (): UpdatedCandlesticksMessage => {
  return {
    content: {
      symbol: randomSymbol(),
    },
  };
};
