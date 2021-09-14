import { logger } from '../../configuration/log/logger';
import { UpdateCandlestickService } from '../../domain/candlestick/update-candlestick-service';
import { PublishCandlestickService } from '../../domain/candlestick/publish-candlestick-service';

export class UpdateAllCandlesticksController {
  constructor(private updateCandlestickService: UpdateCandlestickService, private publishCandlesticksService: PublishCandlestickService) {}

  async process(symbol: string): Promise<void> {
    try {
      logger.info({ symbol: symbol }, 'Updating all candlesticks');
      await this.updateCandlestickService.updateAllBySymbol(symbol);
      await this.publishCandlesticksService.publishUpdatedBySymbol(symbol);
      logger.info({ symbol: symbol }, 'All candlesticks updated');
    } catch (error) {
      logger.error({ symbol: symbol }, 'Unable to update all candlesticks');
      throw error;
    }
  }
}
