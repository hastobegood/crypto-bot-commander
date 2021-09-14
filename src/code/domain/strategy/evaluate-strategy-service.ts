import { logger } from '../../configuration/log/logger';
import { getStepTemplateById, Strategy } from './model/strategy';
import { StrategyStep, StrategyStepTemplate } from './model/strategy-step';
import { StrategyStepService } from './step/strategy-step-service';
import { StrategyStepRepository } from './step/strategy-step-repository';
import { serializeError } from 'serialize-error';
import { StrategyEvaluation } from './model/strategy-evaluation';
import { StrategyStepPublisher } from './step/strategy-step-publisher';

export class EvaluateStrategyService {
  constructor(private strategyStepServices: StrategyStepService[], private strategyStepRepository: StrategyStepRepository, private strategyStepPublisher: StrategyStepPublisher) {}

  async evaluate(strategy: Strategy): Promise<StrategyEvaluation> {
    if (strategy.status !== 'Active') {
      throw new Error(`Unable to evaluate a strategy with status '${strategy.status}'`);
    }

    let lastStep = await this.strategyStepRepository.getLastByStrategyId(strategy.id);
    let stepTemplate = lastStep || getStepTemplateById(strategy, '1');

    let stepSuccess = true;
    while (stepSuccess) {
      lastStep = await this.#processStep(strategy, stepTemplate, lastStep);
      stepSuccess = lastStep.output.success;
      stepTemplate = getStepTemplateById(strategy, lastStep.nextId);
    }

    return {
      success: !lastStep?.error,
    };
  }

  async #processStep(strategy: Strategy, stepTemplate: StrategyStepTemplate, lastStep: StrategyStep | null): Promise<StrategyStep> {
    const stepDate = new Date();
    const step: StrategyStep = {
      ...stepTemplate,
      strategyId: strategy.id,
      output: { success: false },
      error: undefined,
      creationDate: !lastStep || lastStep.output.success ? stepDate : lastStep.creationDate,
      executionStartDate: stepDate,
      executionEndDate: stepDate,
    };

    try {
      logger.info(step, 'Processing strategy step');
      step.output = await this.#getStepService(stepTemplate).process(strategy, stepTemplate.input);
      logger.info(step, 'Strategy step processed');
    } catch (error) {
      step.error = { message: (error as Error).message, details: JSON.stringify(serializeError(error)) };
      logger.error(step, 'Unable to process strategy step');
    } finally {
      step.executionEndDate = new Date();
    }

    return (await Promise.all([this.#publishProcessedStep(step), this.strategyStepRepository.save(step)]))[1];
  }

  async #publishProcessedStep(step: StrategyStep): Promise<void> {
    try {
      await this.strategyStepPublisher.publishProcessed(step);
    } catch (error) {
      logger.child({ err: error }).error(step, 'Unable to publish processed strategy step');
    }
  }

  #getStepService(stepTemplate: StrategyStepTemplate): StrategyStepService {
    const stepService = this.strategyStepServices.find((stepService) => stepService.getType() === stepTemplate.type);
    if (!stepService) {
      throw new Error(`Unsupported '${stepTemplate.type}' strategy step type`);
    }
    return stepService;
  }
}
