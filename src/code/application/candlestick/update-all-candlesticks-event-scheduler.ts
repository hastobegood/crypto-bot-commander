import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { UpdateCandlestickService } from '../../domain/candlestick/update-candlestick-service';
import { PublishCandlestickService } from '../../domain/candlestick/publish-candlestick-service';

export class UpdateAllCandlesticksEventScheduler {
  constructor(private updateCandlestickService: UpdateCandlestickService, private publishCandlesticksService: PublishCandlestickService) {}

  async process(exchange: string, symbol: string): Promise<void> {
    const log = {
      exchange: exchange,
      symbol: symbol,
    };

    try {
      logger.info(log, 'Updating all candlesticks');
      await this.updateCandlestickService.updateAllBySymbol(this.#parseExchange(exchange), symbol);
      await this.publishCandlesticksService.publishUpdatedBySymbol(this.#parseExchange(exchange), symbol);
      logger.info(log, 'All candlesticks updated');
    } catch (error) {
      logger.error(log, 'Unable to update all candlesticks');
      throw error;
    }
  }

  #parseExchange(exchange: string): CandlestickExchange {
    switch (exchange) {
      case 'Binance':
        return 'Binance';
      default:
        throw new Error(`Unsupported '${exchange}' exchange`);
    }
  }
}
