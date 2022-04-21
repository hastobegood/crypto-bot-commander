import { StrategyStep } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { ProcessedStrategyStepMessage } from '../../../../../src/code/infrastructure/strategy/step/sqs-strategy-step-publisher';
import { buildDefaultStrategyStep } from '../../../domain/strategy/strategy-step-test-builder';

export const buildDefaultProcessedStrategyStepMessage = (): ProcessedStrategyStepMessage => {
  return buildProcessedStrategyStepMessage(buildDefaultStrategyStep());
};

export const buildProcessedStrategyStepMessage = (step: StrategyStep): ProcessedStrategyStepMessage => {
  return {
    content: step,
  };
};
