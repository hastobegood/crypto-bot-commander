import { StrategyStepInput, StrategyStepOutput, StrategyStepType } from '../model/strategy-step';
import { Strategy } from '../model/strategy';

export interface StrategyStepService {
  getType(): StrategyStepType;

  process(strategy: Strategy, stepInput: StrategyStepInput): Promise<StrategyStepOutput>;
}
