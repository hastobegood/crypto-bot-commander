import { logger } from '../../configuration/log/logger';
import { UpdateStrategyService } from '../../domain/strategy/update-strategy-service';
import { SendOrderSide, SendOrderStepInput, SendOrderStepOutput } from '../../domain/strategy/model/strategy-step';
import { ProcessedStrategyStepMessage } from '../../infrastructure/strategy/step/sqs-strategy-step-publisher';

export class UpdateStrategyBudgetMessageConsumer {
  constructor(private updateStrategyService: UpdateStrategyService) {}

  async process(processedStrategyStepMessage: ProcessedStrategyStepMessage): Promise<void> {
    if (processedStrategyStepMessage.content.output.success && processedStrategyStepMessage.content.type === 'SendOrder') {
      try {
        logger.info(processedStrategyStepMessage, 'Updating strategy budget');
        const side = (processedStrategyStepMessage.content.input as SendOrderStepInput).side;
        const quantity = (processedStrategyStepMessage.content.output as SendOrderStepOutput).quantity!;
        const price = (processedStrategyStepMessage.content.output as SendOrderStepOutput).price!;
        await this.updateStrategyService.updateBudgetById(processedStrategyStepMessage.content.strategyId, this.#calculateBaseAssetQuantity(side, quantity), this.#calculateQuoteAssetQuantity(side, quantity, price));
        logger.info(processedStrategyStepMessage, 'Strategy budget updated');
      } catch (error) {
        logger.error(processedStrategyStepMessage, 'Unable to update strategy budget');
        throw error;
      }
    }
  }

  #calculateBaseAssetQuantity(side: SendOrderSide, quantity: number): number {
    return side === 'Buy' ? quantity : quantity * -1;
  }

  #calculateQuoteAssetQuantity(side: SendOrderSide, quantity: number, price: number): number {
    return side === 'Buy' ? quantity * price * -1 : quantity * price;
  }
}
