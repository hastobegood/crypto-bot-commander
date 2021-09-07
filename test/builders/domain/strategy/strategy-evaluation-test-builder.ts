import { StrategyEvaluation } from '../../../../src/code/domain/strategy/model/strategy-evaluation';

export const buildStrategyEvaluation = (success: boolean): StrategyEvaluation => {
  return {
    success: success,
  };
};
