import { logger } from '@hastobegood/crypto-bot-artillery/common';

import { PublishCandlestickService } from '../../domain/candlestick/publish-candlestick-service';
import { UpdateCandlestickService } from '../../domain/candlestick/update-candlestick-service';
import { TriggeredCandlesticksMessage } from '../../infrastructure/candlestick/sqs-candlestick-publisher';

export class UpdateAllCandlesticksMessageConsumer {
  constructor(private updateCandlestickService: UpdateCandlestickService, private publishCandlesticksService: PublishCandlestickService) {}

  async process(triggeredCandlesticksMessage: TriggeredCandlesticksMessage): Promise<void> {
    try {
      logger.info(triggeredCandlesticksMessage, 'Updating all candlesticks');
      await this.updateCandlestickService.updateAllBySymbol(triggeredCandlesticksMessage.content.exchange, triggeredCandlesticksMessage.content.symbol);
      await this.publishCandlesticksService.publishUpdatedBySymbol(triggeredCandlesticksMessage.content.exchange, triggeredCandlesticksMessage.content.symbol);
      logger.info(triggeredCandlesticksMessage, 'All candlesticks updated');
    } catch (error) {
      logger.error(triggeredCandlesticksMessage, 'Unable to update all candlesticks');
      throw error;
    }
  }
}
