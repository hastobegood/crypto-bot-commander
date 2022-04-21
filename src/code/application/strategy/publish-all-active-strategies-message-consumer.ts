import { logger } from '@hastobegood/crypto-bot-artillery/common';

import { PublishStrategyService } from '../../domain/strategy/publish-strategy-service';
import { UpdatedCandlesticksMessage } from '../../infrastructure/candlestick/sqs-candlestick-publisher';

export class PublishAllActiveStrategiesMessageConsumer {
  constructor(private publishStrategyService: PublishStrategyService) {}

  async process(updatedCandlesticksMessage: UpdatedCandlesticksMessage): Promise<void> {
    try {
      logger.info(updatedCandlesticksMessage, 'Publishing all active strategies');
      await this.publishStrategyService.publishAllBySymbolAndActiveStatus(updatedCandlesticksMessage.content.symbol);
      logger.info(updatedCandlesticksMessage, 'All active strategies published');
    } catch (error) {
      logger.error(updatedCandlesticksMessage, 'Unable to publish all active strategies');
      throw error;
    }
  }
}
