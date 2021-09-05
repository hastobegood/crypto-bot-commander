import { StrategyMessage } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';
import { randomString } from '../../random-test-builder';

export const buildDefaultStrategyMessage = (): StrategyMessage => {
  return {
    id: randomString(10),
  };
};
