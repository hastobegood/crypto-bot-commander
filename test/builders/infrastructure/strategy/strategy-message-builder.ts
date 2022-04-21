import { randomString } from '@hastobegood/crypto-bot-artillery/test/builders';

import { ActiveStrategyMessage } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';

export const buildDefaultActiveStrategyMessage = (): ActiveStrategyMessage => {
  return {
    content: {
      id: randomString(),
    },
  };
};
