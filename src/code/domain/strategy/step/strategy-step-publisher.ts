import { StrategyStep } from '../model/strategy-step';

export interface StrategyStepPublisher {
  publishProcessed(step: StrategyStep): Promise<void>;
}
