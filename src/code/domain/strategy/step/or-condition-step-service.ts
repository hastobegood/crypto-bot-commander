import { OrConditionStep, OrConditionStepInput, OrConditionStepOutput, StrategyStepOutput, StrategyStepTemplate, StrategyStepType } from '../model/strategy-step';
import { getStrategyStepService, StrategyStepService } from './strategy-step-service';
import { getStepTemplateById, Strategy } from '../model/strategy';

export class OrConditionStepService implements StrategyStepService {
  constructor(private strategyStepServices: StrategyStepService[]) {}

  getType(): StrategyStepType {
    return 'OrCondition';
  }

  async process(strategy: Strategy, orConditionStepInput: OrConditionStepInput): Promise<OrConditionStepOutput> {
    const allResults = await Promise.all(orConditionStepInput.steps.map((orConditionStep) => this.#processStep(strategy, orConditionStep)));
    const successfulResults = allResults.filter((orConditionStepResult) => orConditionStepResult.output.success);
    const champion = successfulResults.length === 0 ? undefined : successfulResults.reduce((previous, current) => (previous.condition.priority > current.condition.priority ? current : previous));

    return {
      success: !!champion,
      id: champion?.template.id,
      nextId: champion?.template.nextId,
      steps: allResults.map((orConditionStepResult) => ({ ...orConditionStepResult.condition, ...orConditionStepResult.output })),
    };
  }

  async #processStep(strategy: Strategy, orConditionStep: OrConditionStep): Promise<OrConditionStepResult> {
    const stepTemplate = getStepTemplateById(strategy, orConditionStep.id);
    const stepOutput = await getStrategyStepService(this.strategyStepServices, stepTemplate).process(strategy, stepTemplate.input);

    return {
      condition: orConditionStep,
      template: stepTemplate,
      output: stepOutput,
    };
  }
}

interface OrConditionStepResult {
  condition: OrConditionStep;
  template: StrategyStepTemplate;
  output: StrategyStepOutput;
}
