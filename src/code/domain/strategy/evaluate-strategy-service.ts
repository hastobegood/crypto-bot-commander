import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { getStepTemplateById, Strategy } from './model/strategy';
import { CheckOrderStepInput, OrConditionStepOutput, SendOrderStepOutput, StrategyStep, StrategyStepTemplate } from './model/strategy-step';
import { getStrategyStepService, StrategyStepService } from './step/strategy-step-service';
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
    let stepTemplate: StrategyStepTemplate | undefined = lastStep || getStepTemplateById(strategy, '1');

    do {
      lastStep = await this.#processStep(strategy, stepTemplate, lastStep);
      stepTemplate = this.#getNextStepTemplate(strategy, lastStep);
    } while (stepTemplate);

    return {
      success: !lastStep.error,
      end: !!lastStep.error || (lastStep.output.success && !lastStep.nextId),
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
      step.output = await getStrategyStepService(this.strategyStepServices, stepTemplate).process(strategy, stepTemplate.input);
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

  #getNextStepTemplate(strategy: Strategy, lastStep: StrategyStep): StrategyStepTemplate | undefined {
    if (!lastStep.output.success) {
      return undefined;
    }

    if (lastStep.type === 'SendOrder') {
      const sendOrderStepOutput = lastStep.output as SendOrderStepOutput;
      const checkOrderStepInput: CheckOrderStepInput = {
        id: sendOrderStepOutput.id,
        externalId: sendOrderStepOutput.externalId,
        side: sendOrderStepOutput.side,
        type: sendOrderStepOutput.type,
      };

      return {
        id: `${lastStep.id}`,
        type: 'CheckOrder',
        input: checkOrderStepInput,
        nextId: lastStep.nextId,
      };
    }

    if (lastStep.type === 'OrCondition') {
      lastStep.nextId = (lastStep.output as OrConditionStepOutput).nextId!;
    }

    return lastStep.nextId ? getStepTemplateById(strategy, lastStep.nextId) : undefined;
  }
}
