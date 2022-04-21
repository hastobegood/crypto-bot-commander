import { Strategy } from '../model/strategy';
import { StrategyStepInput, StrategyStepOutput, StrategyStepTemplate, StrategyStepType } from '../model/strategy-step';

export interface StrategyStepService {
  getType(): StrategyStepType;

  process(strategy: Strategy, stepInput: StrategyStepInput): Promise<StrategyStepOutput>;
}

export const getStrategyStepService = (strategyStepServices: StrategyStepService[], stepTemplate: StrategyStepTemplate): StrategyStepService => {
  const stepService = strategyStepServices.find((stepService) => stepService.getType() === stepTemplate.type);
  if (!stepService) {
    throw new Error(`Unsupported '${stepTemplate.type}' strategy step type`);
  }
  return stepService;
};
