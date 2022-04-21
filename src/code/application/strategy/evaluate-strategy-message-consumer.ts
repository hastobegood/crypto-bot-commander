import { logger } from '@hastobegood/crypto-bot-artillery/common';

import { EvaluateStrategyService } from '../../domain/strategy/evaluate-strategy-service';
import { GetStrategyService } from '../../domain/strategy/get-strategy-service';
import { Strategy, StrategyStatus } from '../../domain/strategy/model/strategy';
import { UpdateStrategyService } from '../../domain/strategy/update-strategy-service';
import { ActiveStrategyMessage } from '../../infrastructure/strategy/sqs-strategy-publisher';

export class EvaluateStrategyMessageConsumer {
  constructor(private getStrategyService: GetStrategyService, private updateStrategyService: UpdateStrategyService, private evaluateStrategyService: EvaluateStrategyService) {}

  async process(activeStrategyMessage: ActiveStrategyMessage): Promise<void> {
    try {
      logger.info(activeStrategyMessage, 'Evaluating strategy');
      const strategy = await this.#getStrategyById(activeStrategyMessage.content.id);
      const strategyEvaluation = await this.evaluateStrategyService.evaluate(strategy);
      if (strategyEvaluation.end) {
        await this.#updateStrategyStatusById(activeStrategyMessage.content.id, strategyEvaluation.success ? 'Inactive' : 'Error');
      }
      logger.info(activeStrategyMessage, 'Strategy evaluated');
    } catch (error) {
      logger.error(activeStrategyMessage, 'Unable to evaluate strategy');
      await this.#updateStrategyStatusById(activeStrategyMessage.content.id, 'Error');
      throw error;
    }
  }

  async #getStrategyById(id: string): Promise<Strategy> {
    const strategy = await this.getStrategyService.getById(id);
    if (!strategy) {
      throw new Error(`Unable to find strategy with ID '${id}'`);
    }
    return strategy;
  }

  async #updateStrategyStatusById(id: string, status: StrategyStatus): Promise<void> {
    await this.updateStrategyService.updateStatusById(id, status);
  }
}
