import { StrategyEvaluation } from '../../../../src/code/domain/strategy/model/strategy-evaluation';

export const buildStrategyEvaluation = (success: boolean, end: boolean): StrategyEvaluation => {
  return {
    success: success,
    end: end,
  };
};
