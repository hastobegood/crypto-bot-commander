import { ActiveStrategyMessage } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';
import { randomString } from '../../random-test-builder';

export const buildDefaultActiveStrategyMessage = (): ActiveStrategyMessage => {
  return {
    content: {
      id: randomString(10),
    },
  };
};
